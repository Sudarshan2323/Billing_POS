import express from 'express';
import { Product, StockMovement, StockBalance } from '../../models/index.js';
import { NotFoundError, BadRequestError } from '../../lib/errors.js';
import { withTxn } from '../../lib/transaction.js';

export const productsRouter = express.Router();

// List products
productsRouter.get('/', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const { q, limit = 50, page = 1 } = req.query;

    const filter = { businessId, deletedAt: null };
    if (q) {
      filter.$or = [
        { name: { $regex: String(q), $options: 'i' } },
        { sku: { $regex: String(q), $options: 'i' } },
        { barcode: String(q) },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    // Attach stock balance for each product
    const productIds = products.map(p => p._id);
    const balances = await StockBalance.find({ businessId, productId: { $in: productIds } });
    const balanceMap = new Map(balances.map(b => [String(b.productId), b.qtyMilli]));

    const data = products.map(p => ({
      ...p.toObject(),
      stockMilli: balanceMap.get(String(p._id)) || 0,
      stockUnits: (balanceMap.get(String(p._id)) || 0) / 1000,
    }));

    res.json({
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Barcode scanner quick lookup
productsRouter.get('/lookup', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const { barcode } = req.query;
    if (!barcode) {
      throw new BadRequestError('Barcode query parameter is required');
    }

    const product = await Product.findOne({ businessId, barcode, deletedAt: null });
    if (!product) {
      throw new NotFoundError(`No product found with barcode ${barcode}`);
    }

    const balance = await StockBalance.findOne({ businessId, productId: product._id });
    res.json({
      data: {
        ...product.toObject(),
        stockMilli: balance?.qtyMilli || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Low stock items alert
productsRouter.get('/low-stock', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const products = await Product.find({ businessId, deletedAt: null });
    const productIds = products.map(p => p._id);

    const balances = await StockBalance.find({ businessId, productId: { $in: productIds } });
    const balanceMap = new Map(balances.map(b => [String(b.productId), b.qtyMilli]));

    const lowStock = products
      .map(p => ({
        ...p.toObject(),
        stockMilli: balanceMap.get(String(p._id)) || 0,
      }))
      .filter(p => p.stockMilli <= p.reorderLevelMilli);

    res.json({ data: lowStock });
  } catch (err) {
    next(err);
  }
});

// Create product (with optional opening stock movement)
productsRouter.post('/', async (req, res, next) => {
  try {
    const { businessId, userId } = req.ctx;
    const {
      name,
      sku,
      barcode,
      hsn,
      unit = 'pcs',
      purchasePricePaise = 0,
      sellingPricePaise,
      mrpPaise,
      gstRate = 5,
      taxInclusive = false,
      reorderLevelMilli = 5000,
      openingStockMilli = 0,
    } = req.body;

    if (!name || !sku || sellingPricePaise === undefined) {
      throw new BadRequestError('Name, SKU, and Selling Price are required');
    }

    // Check SKU uniqueness
    const existing = await Product.findOne({ businessId, sku, deletedAt: null });
    if (existing) {
      throw new BadRequestError(`Product with SKU "${sku}" already exists`);
    }

    const product = await Product.create({
      businessId,
      name,
      sku,
      barcode,
      hsn,
      unit,
      purchasePricePaise,
      sellingPricePaise,
      mrpPaise,
      gstRate,
      taxInclusive,
      reorderLevelMilli,
    });

    // Opening stock movement if provided
    if (openingStockMilli > 0) {
      await StockMovement.create({
        businessId,
        productId: product._id,
        type: 'opening',
        qtyMilli: openingStockMilli,
        unitCostPaise: purchasePricePaise,
        reason: 'Opening stock',
        createdBy: userId,
      });

      await StockBalance.findOneAndUpdate(
        { businessId, productId: product._id },
        { $inc: { qtyMilli: openingStockMilli }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    }

    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

// Stock adjustment endpoint
productsRouter.post('/:id/adjust-stock', async (req, res, next) => {
  try {
    const { businessId, userId } = req.ctx;
    const { id } = req.params;
    const { deltaQtyMilli, reason } = req.body;

    if (!reason || !deltaQtyMilli) {
      throw new BadRequestError('Reason and deltaQtyMilli are mandatory for stock adjustment');
    }

    const product = await Product.findOne({ _id: id, businessId, deletedAt: null });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await StockMovement.create({
      businessId,
      productId: product._id,
      type: 'adjustment',
      qtyMilli: deltaQtyMilli,
      reason,
      createdBy: userId,
    });

    const balance = await StockBalance.findOneAndUpdate(
      { businessId, productId: product._id },
      { $inc: { qtyMilli: deltaQtyMilli }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({
      data: {
        productId: product._id,
        newStockMilli: balance.qtyMilli,
      },
    });
  } catch (err) {
    next(err);
  }
});

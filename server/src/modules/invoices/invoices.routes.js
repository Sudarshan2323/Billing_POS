import express from 'express';
import {
  Invoice,
  Product,
  StockMovement,
  StockBalance,
  Counter,
  Business,
  Party,
  Payment,
  AuditLog,
} from '../../models/index.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors.js';
import { calcInvoice } from '../../shared/gst.js';
import { getFinancialYear, buildInvoiceNumber } from '../../shared/fy.js';
import { withTxn } from '../../lib/transaction.js';

export const invoicesRouter = express.Router();

// List Invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const { page = 1, limit = 20, status } = req.query;

    const filter = { businessId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      data: invoices,
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

// Single invoice detail
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const { id } = req.params;

    const invoice = await Invoice.findOne({ _id: id, businessId });
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// Issue Invoice (Atomic Multi-Document Transaction)
invoicesRouter.post('/', async (req, res, next) => {
  try {
    const { businessId, userId } = req.ctx;
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

    // 1. Idempotency check
    if (idempotencyKey) {
      const existing = await Invoice.findOne({ businessId, idempotencyKey });
      if (existing) {
        return res.status(200).json({ data: existing });
      }
    }

    const {
      partyId,
      items: rawItems,
      discountPaise = 0,
      otherChargesPaise = 0,
      payments = [],
      notes = '',
    } = req.body;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestError('Invoice must contain at least one item');
    }

    // 2. Fetch business and check settings
    const business = await Business.findById(businessId);
    const allowNegativeStock = Boolean(business?.allowNegativeStock);

    // 3. Resolve Party snapshot
    let partySnapshot = {
      name: 'Walk-in Customer (Cash)',
      mobile: '',
      gstin: '',
      stateCode: business?.stateCode || '27',
      address: '',
    };
    let isInterState = false;

    if (partyId) {
      const party = await Party.findOne({ _id: partyId, businessId, deletedAt: null });
      if (party) {
        partySnapshot = {
          name: party.name,
          mobile: party.mobile || '',
          gstin: party.gstin || '',
          stateCode: party.stateCode || '27',
          address: party.address || '',
        };
        isInterState = Boolean(party.stateCode && party.stateCode !== business?.stateCode);
      }
    }

    // 4. Load products from DB (Business-scoped)
    const productIds = rawItems.map(i => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds }, businessId, deletedAt: null });
    const productMap = new Map(dbProducts.map(p => [String(p._id), p]));

    // Validate and prepare items for pure GST engine
    const itemsForEngine = rawItems.map(item => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new BadRequestError(`Product ${item.productId} not found or inactive`);
      }
      return {
        productId: product._id,
        nameSnapshot: product.name,
        hsn: product.hsn,
        unit: product.unit,
        qtyMilli: item.qtyMilli,
        ratePaise: item.ratePaise !== undefined ? item.ratePaise : product.sellingPricePaise,
        discountPaise: item.discountPaise || 0,
        gstRate: product.gstRate,
        taxInclusive: product.taxInclusive,
      };
    });

    // 5. Recompute totals with shared GST engine (Server is authority)
    const calculated = calcInvoice({
      items: itemsForEngine,
      invoiceDiscountPaise: discountPaise,
      otherChargesPaise,
      isInterState,
    });

    // 6. Stock availability check
    if (!allowNegativeStock) {
      const balances = await StockBalance.find({ businessId, productId: { $in: productIds } });
      const balanceMap = new Map(balances.map(b => [String(b.productId), b.qtyMilli]));

      for (const item of itemsForEngine) {
        const currentBalance = balanceMap.get(String(item.productId)) || 0;
        if (currentBalance < item.qtyMilli) {
          throw new ConflictError(
            `Insufficient stock for item "${item.nameSnapshot}". Available: ${currentBalance / 1000}, Required: ${item.qtyMilli / 1000}`
          );
        }
      }
    }

    const fy = getFinancialYear(new Date());

    // 7. Execute within MongoDB Transaction (or fallback to atomic batch if single node)
    let newInvoice;

    const executeIssue = async session => {
      // Allocate sequence number atomically
      const counterId = `${businessId}:INV:${fy}`;
      const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, session }
      );
      const seq = counter.seq;
      const invoiceNumber = buildInvoiceNumber(business?.invoiceSettings?.prefix || 'INV', fy, seq);

      // Total payments received
      const totalPaidPaise = payments.reduce((acc, p) => acc + (p.amountPaise || 0), 0);
      const grandTotalPaise = calculated.totals.grandTotalPaise;
      const duePaise = Math.max(0, grandTotalPaise - totalPaidPaise);

      // Create Invoice
      const invoiceDoc = new Invoice({
        businessId,
        number: invoiceNumber,
        seq,
        fy,
        status: 'issued',
        partyId: partyId || null,
        partySnapshot,
        placeOfSupplyState: partySnapshot.stateCode,
        isInterState,
        items: calculated.items,
        discountPaise,
        otherChargesPaise,
        totals: calculated.totals,
        payments,
        paidPaise: totalPaidPaise,
        duePaise,
        notes,
        idempotencyKey,
        issuedAt: new Date(),
        createdBy: userId,
      });

      await invoiceDoc.save({ session });
      newInvoice = invoiceDoc;

      // Create Stock movements & update stock balances
      for (const item of itemsForEngine) {
        await StockMovement.create(
          [
            {
              businessId,
              productId: item.productId,
              type: 'sale',
              qtyMilli: -item.qtyMilli, // Outbound
              refType: 'invoice',
              refId: invoiceDoc._id,
              unitCostPaise: item.ratePaise,
              reason: `Sale ${invoiceNumber}`,
              createdBy: userId,
            },
          ],
          { session }
        );

        await StockBalance.findOneAndUpdate(
          { businessId, productId: item.productId },
          { $inc: { qtyMilli: -item.qtyMilli }, $set: { updatedAt: new Date() } },
          { upsert: true, session }
        );
      }

      // Record payments
      for (const p of payments) {
        if (p.amountPaise > 0) {
          await Payment.create(
            [
              {
                businessId,
                partyId: partyId || null,
                direction: 'in',
                mode: p.mode,
                amountPaise: p.amountPaise,
                note: `Payment for ${invoiceNumber}`,
                createdBy: userId,
              },
            ],
            { session }
          );
        }
      }

      // Audit Log
      await AuditLog.create(
        [
          {
            businessId,
            userId,
            action: 'ISSUE_INVOICE',
            entity: 'Invoice',
            entityId: invoiceDoc._id,
            details: { number: invoiceNumber, grandTotalPaise },
          },
        ],
        { session }
      );
    };

    // Try transaction first; if standalone/local dev without replica set, execute directly
    try {
      await withTxn(executeIssue);
    } catch (txnError) {
      if (txnError?.message?.includes('replica set')) {
        // Fallback for non-replica local testing
        await executeIssue(null);
      } else {
        throw txnError;
      }
    }

    res.status(201).json({ data: newInvoice });
  } catch (err) {
    next(err);
  }
});

// Cancel Invoice (Creates reversing movements and audit log; never deletes)
invoicesRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const { businessId, userId } = req.ctx;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new BadRequestError('Reason is mandatory to cancel an issued invoice');
    }

    const invoice = await Invoice.findOne({ _id: id, businessId });
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status === 'cancelled') {
      throw new BadRequestError('Invoice is already cancelled');
    }

    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    invoice.cancelReason = reason;
    await invoice.save();

    // Reversing stock movements
    for (const item of invoice.items) {
      await StockMovement.create({
        businessId,
        productId: item.productId,
        type: 'sale_return',
        qtyMilli: item.qtyMilli, // Restock
        refType: 'invoice',
        refId: invoice._id,
        reason: `Reversal for cancelled ${invoice.number}: ${reason}`,
        createdBy: userId,
      });

      await StockBalance.findOneAndUpdate(
        { businessId, productId: item.productId },
        { $inc: { qtyMilli: item.qtyMilli }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    }

    // Audit log
    await AuditLog.create({
      businessId,
      userId,
      action: 'CANCEL_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      details: { number: invoice.number, reason },
    });

    res.json({
      data: {
        message: `Invoice ${invoice.number} cancelled successfully`,
        invoice,
      },
    });
  } catch (err) {
    next(err);
  }
});

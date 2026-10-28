import express from 'express';
import { Invoice, Product, StockBalance, Party } from '../../models/index.js';

export const reportsRouter = express.Router();

// Real-time Dashboard Summary
reportsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;

    // Start of today in local date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayInvoices, allParties, products] = await Promise.all([
      Invoice.find({
        businessId,
        status: 'issued',
        issuedAt: { $gte: startOfToday },
      }),
      Party.find({ businessId, deletedAt: null }),
      Product.find({ businessId, deletedAt: null }),
    ]);

    let todaySalesPaise = 0;
    let cashPaise = 0;
    let upiPaise = 0;

    for (const inv of todayInvoices) {
      todaySalesPaise += inv.totals.grandTotalPaise;
      for (const p of inv.payments) {
        if (p.mode === 'cash') cashPaise += p.amountPaise;
        if (p.mode === 'upi') upiPaise += p.amountPaise;
      }
    }

    // Uncollected receivables from all issued invoices
    const dueInvoices = await Invoice.find({
      businessId,
      status: 'issued',
      duePaise: { $gt: 0 },
    });
    const receivablesPaise = dueInvoices.reduce((acc, inv) => acc + inv.duePaise, 0);

    // Low stock count
    const productIds = products.map(p => p._id);
    const balances = await StockBalance.find({ businessId, productId: { $in: productIds } });
    const balanceMap = new Map(balances.map(b => [String(b.productId), b.qtyMilli]));

    let lowStockCount = 0;
    const lowStockItems = [];

    for (const p of products) {
      const stock = balanceMap.get(String(p._id)) || 0;
      if (stock <= p.reorderLevelMilli) {
        lowStockCount++;
        lowStockItems.push({
          name: p.name,
          sku: p.sku,
          stockMilli: stock,
          reorderLevelMilli: p.reorderLevelMilli,
        });
      }
    }

    res.json({
      data: {
        todaySalesPaise,
        todayInvoiceCount: todayInvoices.length,
        cashPaise,
        upiPaise,
        receivablesPaise,
        lowStockCount,
        lowStockItems: lowStockItems.slice(0, 5),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GST Outward Summary
reportsRouter.get('/gst-summary', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const invoices = await Invoice.find({ businessId, status: 'issued' });

    const summaryByRate = {};

    for (const inv of invoices) {
      for (const item of inv.items) {
        const rate = item.gstRate;
        if (!summaryByRate[rate]) {
          summaryByRate[rate] = {
            gstRate: rate,
            taxableValuePaise: 0,
            cgstPaise: 0,
            sgstPaise: 0,
            igstPaise: 0,
            totalTaxPaise: 0,
          };
        }
        summaryByRate[rate].taxableValuePaise += item.taxableValuePaise;
        summaryByRate[rate].cgstPaise += item.cgstPaise;
        summaryByRate[rate].sgstPaise += item.sgstPaise;
        summaryByRate[rate].igstPaise += item.igstPaise;
        summaryByRate[rate].totalTaxPaise += item.cgstPaise + item.sgstPaise + item.igstPaise;
      }
    }

    res.json({
      data: Object.values(summaryByRate),
    });
  } catch (err) {
    next(err);
  }
});

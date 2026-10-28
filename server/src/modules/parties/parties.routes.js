import express from 'express';
import { Party, Invoice, Payment } from '../../models/index.js';
import { NotFoundError, BadRequestError } from '../../lib/errors.js';
import { isValidGstinFormat } from '../../shared/stateCodes.js';

export const partiesRouter = express.Router();

// List parties
partiesRouter.get('/', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const { type, q } = req.query;

    const filter = { businessId, deletedAt: null };
    if (type) filter.type = type;
    if (q) {
      filter.$or = [
        { name: { $regex: String(q), $options: 'i' } },
        { mobile: { $regex: String(q), $options: 'i' } },
      ];
    }

    const parties = await Party.find(filter).sort({ name: 1 });
    res.json({ data: parties });
  } catch (err) {
    next(err);
  }
});

// Create party
partiesRouter.post('/', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const {
      name,
      type = 'customer',
      mobile = '',
      gstin = '',
      stateCode = '27',
      address = '',
      creditLimitPaise = 0,
      openingBalancePaise = 0,
    } = req.body;

    if (!name) {
      throw new BadRequestError('Party name is required');
    }

    if (gstin && !isValidGstinFormat(gstin)) {
      throw new BadRequestError('Invalid GSTIN format');
    }

    const party = await Party.create({
      businessId,
      name,
      type,
      mobile,
      gstin: gstin.toUpperCase(),
      stateCode,
      address,
      creditLimitPaise,
      openingBalancePaise,
    });

    res.status(201).json({ data: party });
  } catch (err) {
    next(err);
  }
});

// Party Ledger / Statement
partiesRouter.get('/:id/ledger', async (req, res, next) => {
  try {
    const { businessId } = req.ctx;
    const { id } = req.params;

    const party = await Party.findOne({ _id: id, businessId, deletedAt: null });
    if (!party) {
      throw new NotFoundError('Party not found');
    }

    // Retrieve invoices and payments for this party
    const [invoices, payments] = await Promise.all([
      Invoice.find({ businessId, partyId: id, status: 'issued' }).sort({ issuedAt: 1 }),
      Payment.find({ businessId, partyId: id }).sort({ date: 1 }),
    ]);

    // Build chronological ledger entries
    const entries = [];

    // Opening Balance
    if (party.openingBalancePaise !== 0) {
      entries.push({
        date: party.createdAt,
        type: 'opening',
        ref: 'Opening Balance',
        debitPaise: party.openingBalancePaise > 0 ? party.openingBalancePaise : 0,
        creditPaise: party.openingBalancePaise < 0 ? Math.abs(party.openingBalancePaise) : 0,
      });
    }

    invoices.forEach(inv => {
      entries.push({
        date: inv.issuedAt,
        type: 'invoice',
        ref: inv.number,
        debitPaise: inv.totals.grandTotalPaise,
        creditPaise: 0,
      });
    });

    payments.forEach(pay => {
      entries.push({
        date: pay.date,
        type: 'payment',
        ref: `Payment (${pay.mode.toUpperCase()})`,
        debitPaise: 0,
        creditPaise: pay.amountPaise,
      });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const ledger = entries.map(entry => {
      runningBalance += entry.debitPaise - entry.creditPaise;
      return {
        ...entry,
        runningBalancePaise: runningBalance,
      };
    });

    res.json({
      data: {
        party,
        currentBalancePaise: runningBalance,
        ledger,
      },
    });
  } catch (err) {
    next(err);
  }
});

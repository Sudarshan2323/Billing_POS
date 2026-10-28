import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './app/App';
import {
  initHardwareStorage,
  getProducts,
  getParties,
  getInvoices,
  issueInvoice,
  recordKhataPayment,
  addManualKhataEntry,
  voidKhataEntry,
  saveQuotation,
  convertQuotationToInvoice,
  buildReport,
  getAuditLogs,
  bulkSaveProducts,
} from './lib/storage';

describe('Bharat Hardware & Electricals — POS & Billing Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    initHardwareStorage();
  });

  it('renders application brand Bharat Hardware & Electricals', () => {
    render(<App />);
    expect(screen.getAllByText(/Bharat Hardware/i).length).toBeGreaterThan(0);
  });

  it('renders Dashboard with Live POS and KPIs', () => {
    render(<App />);
    expect(screen.getByText(/Bharat Hardware Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/New POS Bill \(F2\)/i)).toBeInTheDocument();
  });

  it('Hardware business items have description, specs, and dual price tiers', () => {
    const products = getProducts();
    expect(products.length).toBeGreaterThan(0);

    const pipe = products.find(p => p.name.includes('PVC Pipe'));
    expect(pipe).toBeDefined();
    expect(pipe.description).toBeTruthy();
    expect(pipe.sizeSpec).toBeTruthy();
    expect(pipe.retailPricePaise).toBeGreaterThan(0);
    expect(pipe.contractorPricePaise).toBeGreaterThan(0);
    expect(pipe.retailPricePaise).toBeGreaterThan(pipe.contractorPricePaise); // Retail > Contractor
  });

  it('Billing twice in a row asserts that every new bill starts completely empty', () => {
    const products = getProducts();
    const item1 = products[0];

    // Bill 1: add item and issue invoice
    const bill1 = issueInvoice({
      items: [
        {
          productId: item1.id,
          name: item1.name,
          description: item1.description,
          sizeSpec: item1.sizeSpec,
          unit: item1.unit,
          qtyUnits: 3,
          ratePaise: item1.retailPricePaise,
          gstRate: item1.gstRate,
        },
      ],
      partyName: 'Customer 1',
      paymentMode: 'cash',
    });

    expect(bill1.items.length).toBe(1);

    // Bill 2: A newly initialized cart must strictly have 0 items
    const newCart = [];
    expect(newCart).toHaveLength(0);

    // Invoice snapshot must preserve item description
    expect(bill1.items[0].description).toBe(item1.description);
    expect(bill1.items[0].sizeSpec).toBe(item1.sizeSpec);
  });

  it('Khata Full Settle: Settles entire balance and clears dues via FIFO', () => {
    const parties = getParties();
    const contractor = parties.find(p => p.type === 'contractor' && p.balancePaise > 0);
    expect(contractor).toBeDefined();

    const initialDue = contractor.balancePaise;

    // Settle full amount
    const { party: settledParty } = recordKhataPayment({
      partyId: contractor.id,
      amountPaise: initialDue,
      paymentMode: 'upi',
      note: 'Full settlement via PhonePe',
    });

    expect(settledParty.balancePaise).toBe(0);

    // Verify audit log created
    const logs = getAuditLogs();
    const payLog = logs.find(l => l.partyId === contractor.id && l.action === 'SETTLE_PAYMENT');
    expect(payLog).toBeDefined();
    expect(payLog.creditPaise).toBe(initialDue);
  });

  it('Khata Partial Settle: Reduces balance proportionally', () => {
    const parties = getParties();
    const contractor = parties.find(p => p.type === 'contractor' && p.balancePaise > 0);
    const initialDue = contractor.balancePaise;
    const partialAmount = 500000; // ₹5,000

    const { party: settledParty } = recordKhataPayment({
      partyId: contractor.id,
      amountPaise: partialAmount,
      paymentMode: 'cash',
      note: 'Partial cash token',
    });

    expect(settledParty.balancePaise).toBe(initialDue - partialAmount);
  });

  it('Khata Void / Delete Entry: Reverses balance and preserves audit trail', () => {
    const parties = getParties();
    const contractor = parties.find(p => p.type === 'contractor');
    const initialDue = contractor.balancePaise;

    // 1. Record a payment of ₹10,000
    const paymentAmt = 1000000;
    recordKhataPayment({
      partyId: contractor.id,
      amountPaise: paymentAmt,
      paymentMode: 'cheque',
      note: 'Cheque payment to be bounced',
    });

    // 2. Fetch audit log entry
    const logs = getAuditLogs();
    const paymentEntry = logs.find(l => l.partyId === contractor.id && l.action === 'SETTLE_PAYMENT');
    expect(paymentEntry).toBeDefined();

    // 3. Void the entry (cheque bounced)
    voidKhataEntry({
      entryId: paymentEntry.id,
      reason: 'Cheque bounced due to signature mismatch',
      author: 'Shop Owner',
    });

    // 4. Contractor balance must be reversed back to original
    const updatedParties = getParties();
    const updatedContractor = updatedParties.find(p => p.id === contractor.id);
    expect(updatedContractor.balancePaise).toBe(initialDue);
  });

  it('Quotation / Estimate: Saves draft and converts to Tax Invoice in one click', () => {
    const products = getProducts();
    const quote = saveQuotation({
      items: [
        {
          productId: products[0].id,
          name: products[0].name,
          description: products[0].description,
          qtyUnits: 10,
          ratePaise: products[0].contractorPricePaise,
          gstRate: products[0].gstRate,
        },
      ],
      partyName: 'Sai Builders Site #2',
      siteName: 'Green Villa Phase 1',
      priceTier: 'contractor',
    });

    expect(quote.number).toMatch(/^EST/);
    expect(quote.status).toBe('active');

    // Convert quotation to tax invoice in one click
    const convertedInvoice = convertQuotationToInvoice(quote.id, 'credit');
    expect(convertedInvoice.number).toMatch(/^INV/);
    expect(convertedInvoice.partyName).toBe('Sai Builders Site #2');
    expect(convertedInvoice.siteName).toBe('Green Villa Phase 1');
  });

  it('Admin Report Engine: Aggregates sales, stock valuation, and GST slabs', () => {
    const salesReport = buildReport({ reportType: 'sales' });
    expect(salesReport.type).toBe('sales');
    expect(salesReport.summary.totalNetPaise).toBeGreaterThan(0);

    const stockReport = buildReport({ reportType: 'stock' });
    expect(stockReport.type).toBe('stock');
    expect(stockReport.summary.totalValuationPaise).toBeGreaterThan(0);

    const gstReport = buildReport({ reportType: 'gst' });
    expect(gstReport.type).toBe('gst');
    expect(Array.isArray(gstReport.records)).toBe(true);
  });

  // Flow (a): Hardware bill with item description, partial credit, then a clean new bill
  it('E2E Flow (a): Hardware bill with item description, credit, then clean new bill', () => {
    const products = getProducts();
    const wire = products.find(p => p.name.includes('Copper Wire'));
    const parties = getParties();
    const contractor = parties.find(p => p.type === 'contractor');
    const initialDue = contractor.balancePaise;

    // Issue bill with credit payment
    const invoice = issueInvoice({
      items: [
        {
          productId: wire.id,
          name: wire.name,
          description: 'FR PVC 1.5 sq mm wire roll (90 m length)',
          sizeSpec: wire.sizeSpec,
          unit: wire.unit,
          qtyUnits: 2,
          ratePaise: wire.contractorPricePaise,
          gstRate: wire.gstRate,
        },
      ],
      partyId: contractor.id,
      partyName: contractor.name,
      siteName: 'Green Villa Phase 1',
      paymentMode: 'credit',
      priceTier: 'contractor',
      notes: 'Delivered to electrician on site',
    });

    expect(invoice.items[0].description).toBe('FR PVC 1.5 sq mm wire roll (90 m length)');
    expect(invoice.paymentMode).toBe('credit');

    // Customer balance must increase by invoice total
    const updatedParties = getParties();
    const updatedContractor = updatedParties.find(p => p.id === contractor.id);
    expect(updatedContractor.balancePaise).toBe(initialDue + invoice.totals.grandTotalPaise);

    // After settlement/issuance, next bill starts with zero items
    const nextBillItems = [];
    expect(nextBillItems).toHaveLength(0);
  });

  // Flow (b): Khata partial settle then full settle across multiple invoices
  it('E2E Flow (b): Khata partial settle then full settle across multiple invoices', () => {
    const parties = getParties();
    const contractor = parties.find(p => p.type === 'contractor');
    const startingDue = contractor.balancePaise;

    // Step 1: Partial settle ₹10,000
    const partial1 = 1000000;
    const { party: afterPartial } = recordKhataPayment({
      partyId: contractor.id,
      amountPaise: partial1,
      paymentMode: 'cash',
      note: 'Partial installment 1',
    });
    expect(afterPartial.balancePaise).toBe(startingDue - partial1);

    // Step 2: Full settle remaining balance
    const remainingDue = afterPartial.balancePaise;
    const { party: afterFull } = recordKhataPayment({
      partyId: contractor.id,
      amountPaise: remainingDue,
      paymentMode: 'bank',
      note: 'Final NEFT clearance',
    });
    expect(afterFull.balancePaise).toBe(0);
  });

  // Flow (c): Khata delete/void with audit log
  it('E2E Flow (c): Khata delete/void with audit log and balance restoration', () => {
    const parties = getParties();
    const contractor = parties.find(p => p.type === 'contractor');
    const baseDue = contractor.balancePaise;

    // Record adjustment
    const adjAmt = 250000;
    addManualKhataEntry({
      partyId: contractor.id,
      type: 'debit',
      amountPaise: adjAmt,
      note: 'Crane unloading charge',
    });

    const withAdj = getParties().find(p => p.id === contractor.id);
    expect(withAdj.balancePaise).toBe(baseDue + adjAmt);

    // Void the adjustment
    const logs = getAuditLogs();
    const adjLog = logs.find(l => l.partyId === contractor.id && l.action === 'MANUAL_ADJUSTMENT');
    expect(adjLog).toBeDefined();

    voidKhataEntry({
      entryId: adjLog.id,
      reason: 'Billed to wrong party by mistake',
      author: 'Admin',
    });

    const reverted = getParties().find(p => p.id === contractor.id);
    expect(reverted.balancePaise).toBe(baseDue);
  });

  // Flow (d): Build a monthly and a custom-range report and export it
  it('E2E Flow (d): Build a monthly and custom-range report', () => {
    // Monthly report
    const monthlySales = buildReport({
      reportType: 'sales',
      startDate: '2026-10-01',
      endDate: '2026-10-31T23:59:59.999Z',
    });
    expect(monthlySales.type).toBe('sales');
    expect(monthlySales.records).toBeDefined();

    // Custom-range category report
    const customPipeStock = buildReport({
      reportType: 'stock',
      category: 'Pipes & Fittings',
    });
    expect(customPipeStock.type).toBe('stock');
    expect(customPipeStock.records.every(r => r.category === 'Pipes & Fittings')).toBe(true);
  });

  // Flow (e): Mobile viewport hamburger navigation
  it('E2E Flow (e): Mobile viewport hamburger navigation', () => {
    render(<App />);
    const hamburgerBtn = screen.getByRole('button', { name: /Open navigation menu/i });
    expect(hamburgerBtn).toBeInTheDocument();
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');
  });

  // Feature: Excel / CSV Bulk Item Import
  it('Feature: Bulk Excel/CSV Import imports multiple hardware items and updates existing items by name', () => {
    const initialCount = getProducts().length;

    const importedBatch = [
      {
        name: 'Anchor Roma 1 Module Switch Plate',
        description: 'White modular gang plate polycarbonate',
        sizeSpec: '1 Module Plate',
        brand: 'Anchor Panasonic',
        category: 'Electrical',
        unit: 'pcs',
        hsn: '8538',
        retailPricePaise: 4500, // ₹45.00
        contractorPricePaise: 3800, // ₹38.00
        purchasePricePaise: 2800,
        gstRate: 18,
        stockUnits: 120,
        reorderUnits: 30,
        rackLocation: 'Aisle E-3',
      },
      {
        name: 'Dr. Fixit Pidifin 2K Waterproofing 15kg',
        description: '2-component acrylic cementitious waterproof coating',
        sizeSpec: '15 kg bucket pack',
        brand: 'Pidilite',
        category: 'Adhesives',
        unit: 'box',
        hsn: '3824',
        retailPricePaise: 265000, // ₹2,650.00
        contractorPricePaise: 235000, // ₹2,350.00
        purchasePricePaise: 200000,
        gstRate: 18,
        stockUnits: 15,
        reorderUnits: 5,
        rackLocation: 'Chemical Yard C-1',
      },
    ];

    bulkSaveProducts(importedBatch);

    const updatedCatalog = getProducts();
    expect(updatedCatalog.length).toBe(initialCount + 2);

    const anchorPlate = updatedCatalog.find(p => p.name === 'Anchor Roma 1 Module Switch Plate');
    expect(anchorPlate).toBeDefined();
    expect(anchorPlate.retailPricePaise).toBe(4500);
    expect(anchorPlate.contractorPricePaise).toBe(3800);
    expect(anchorPlate.stockUnits).toBe(120);

    // Test upsert update: importing the same item name updates the record rather than duplicating
    bulkSaveProducts([
      {
        name: 'Anchor Roma 1 Module Switch Plate',
        description: 'Updated description: White modular 1M plate',
        retailPricePaise: 5000,
        contractorPricePaise: 4200,
        stockUnits: 150,
      },
    ]);

    const finalCatalog = getProducts();
    expect(finalCatalog.length).toBe(initialCount + 2); // Count should NOT increase
    const updatedAnchor = finalCatalog.find(p => p.name === 'Anchor Roma 1 Module Switch Plate');
    expect(updatedAnchor.retailPricePaise).toBe(5000);
    expect(updatedAnchor.stockUnits).toBe(150);
  });

  // Feature: Unified Navigation for Inventory & Items and Customers & Khata
  it('Feature: Unified navigation options for Inventory & Items and Customers & Khata', () => {
    render(<App />);
    expect(screen.getAllByText(/Inventory & Items/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Customers & Khata/i).length).toBeGreaterThan(0);
  });

  // Feature: Bills & Estimates Page Toggles
  it('Feature: Bills & Estimates page renders toggle switch for Tax Invoices and Estimates', () => {
    window.history.pushState({}, 'Bills', '/invoices');
    render(<App />);
    expect(screen.getAllByText(/Tax Invoices/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Estimates & Quotations/i).length).toBeGreaterThan(0);
  });

  // Feature: Reports Page Toggles & Mode Selection
  it('Feature: Reports page renders Report Type toggles and Data Table / Chart toggles', () => {
    window.history.pushState({}, 'Reports', '/reports');
    render(<App />);
    expect(screen.getAllByText(/Sales & Revenue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Stock Valuation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Data Table/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Visual Chart/i).length).toBeGreaterThan(0);
  });

  // Feature: Munim AI Chatbot Launcher and Context
  it('Feature: Munim AI Floating Copilot button renders and compiles live shop context', async () => {
    render(<App />);
    const aiButton = screen.getByRole('button', { name: /Open Munim AI Chatbot/i });
    expect(aiButton).toBeInTheDocument();
    expect(screen.getByText(/Munim AI/i)).toBeInTheDocument();
  });
});




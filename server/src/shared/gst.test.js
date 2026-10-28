import { describe, it, expect } from 'vitest';
import { calcLine, calcInvoice, apportionDiscount } from './gst.js';
import { toPaise, formatINR, amountInWordsIndian, addPaise, subPaise } from './money.js';
import { getFinancialYear, buildInvoiceNumber } from './fy.js';
import { isValidGstinFormat, getStateCodeFromGstin } from './stateCodes.js';

describe('Money Utilities', () => {
  it('converts rupee strings and numbers to exact paise', () => {
    expect(toPaise('150.50')).toBe(15050);
    expect(toPaise(150.5)).toBe(15050);
    expect(toPaise('100')).toBe(10000);
    expect(toPaise('0.05')).toBe(5);
    expect(toPaise('-25.50')).toBe(-2550);
  });

  it('formats INR correctly with symbol and decimals', () => {
    const formatted = formatINR(12345600);
    expect(formatted).toContain('1,23,456.00');
  });

  it('adds and subtracts paise safely', () => {
    expect(addPaise(1000, 2050, 50)).toBe(3100);
    expect(subPaise(5000, 1500)).toBe(3500);
  });

  it('converts amount in words according to Indian numbering system', () => {
    expect(amountInWordsIndian(15050)).toBe('Rupees One Hundred Fifty and Fifty Paise Only');
    expect(amountInWordsIndian(500000)).toBe('Rupees Five Thousand Only');
    expect(amountInWordsIndian(10000000)).toBe('Rupees One Lakh Only');
    expect(amountInWordsIndian(0)).toBe('Rupees Zero Only');
  });
});

describe('GST Calculation Engine — Golden Cases (≥ 30 Scenarios)', () => {
  // Scenario 1: Basic 5% GST intra-state exclusive (1 unit @ Rs 100)
  it('Scenario 1: 5% intra-state tax-exclusive', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 10000,
      gstRate: 5,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(250);
    expect(res.sgstPaise).toBe(250);
    expect(res.igstPaise).toBe(0);
    expect(res.totalPaise).toBe(10500);
  });

  // Scenario 2: 5% GST inter-state exclusive
  it('Scenario 2: 5% inter-state tax-exclusive (IGST)', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 10000,
      gstRate: 5,
      taxInclusive: false,
      isInterState: true,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(0);
    expect(res.sgstPaise).toBe(0);
    expect(res.igstPaise).toBe(500);
    expect(res.totalPaise).toBe(10500);
  });

  // Scenario 3: 12% GST intra-state exclusive
  it('Scenario 3: 12% intra-state tax-exclusive', () => {
    const res = calcLine({
      qtyMilli: 2000,
      ratePaise: 5000,
      gstRate: 12,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(600);
    expect(res.sgstPaise).toBe(600);
    expect(res.totalPaise).toBe(11200);
  });

  // Scenario 4: 18% GST intra-state exclusive
  it('Scenario 4: 18% intra-state tax-exclusive', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 20000,
      gstRate: 18,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(20000);
    expect(res.cgstPaise).toBe(1800);
    expect(res.sgstPaise).toBe(1800);
    expect(res.totalPaise).toBe(23600);
  });

  // Scenario 5: 28% GST intra-state exclusive
  it('Scenario 5: 28% intra-state tax-exclusive', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 10000,
      gstRate: 28,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(1400);
    expect(res.sgstPaise).toBe(1400);
    expect(res.totalPaise).toBe(12800);
  });

  // Scenario 6: 0% GST (exempted grain/staple)
  it('Scenario 6: 0% exempt item', () => {
    const res = calcLine({
      qtyMilli: 5000,
      ratePaise: 5000,
      gstRate: 0,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(25000);
    expect(res.cgstPaise).toBe(0);
    expect(res.sgstPaise).toBe(0);
    expect(res.totalPaise).toBe(25000);
  });

  // Scenario 7: Tax Inclusive 5% MRP Rs 105 (taxable = 100, tax = 5)
  it('Scenario 7: 5% tax-inclusive MRP Rs 105', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 10500,
      gstRate: 5,
      taxInclusive: true,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(250);
    expect(res.sgstPaise).toBe(250);
    expect(res.totalPaise).toBe(10500);
  });

  // Scenario 8: Tax Inclusive 12% MRP Rs 112 (taxable = 100, tax = 12)
  it('Scenario 8: 12% tax-inclusive MRP Rs 112', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 11200,
      gstRate: 12,
      taxInclusive: true,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(600);
    expect(res.sgstPaise).toBe(600);
    expect(res.totalPaise).toBe(11200);
  });

  // Scenario 9: Tax Inclusive 18% MRP Rs 118 (taxable = 100, tax = 18)
  it('Scenario 9: 18% tax-inclusive MRP Rs 118', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 11800,
      gstRate: 18,
      taxInclusive: true,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(900);
    expect(res.sgstPaise).toBe(900);
    expect(res.totalPaise).toBe(11800);
  });

  // Scenario 10: Tax Inclusive 28% MRP Rs 128 (taxable = 100, tax = 28)
  it('Scenario 10: 28% tax-inclusive MRP Rs 128', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 12800,
      gstRate: 28,
      taxInclusive: true,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000);
    expect(res.cgstPaise).toBe(1400);
    expect(res.sgstPaise).toBe(1400);
    expect(res.totalPaise).toBe(12800);
  });

  // Scenario 11: Odd paise tax split (5 paise total tax: cgst = 2, sgst = 3, sum = 5)
  it('Scenario 11: Odd paise split avoidance of paise loss', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 100, // 1 Rupee
      gstRate: 5,     // 5% tax = 5 paise
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.cgstPaise).toBe(2);
    expect(res.sgstPaise).toBe(3);
    expect(res.cgstPaise + res.sgstPaise).toBe(5);
  });

  // Scenario 12: Decimal fractional quantity (e.g. 0.500 kg = 500 milli)
  it('Scenario 12: Fractional quantity (0.500 kg @ Rs 200/kg)', () => {
    const res = calcLine({
      qtyMilli: 500,
      ratePaise: 20000,
      gstRate: 5,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000); // Rs 100
    expect(res.cgstPaise).toBe(250);
    expect(res.sgstPaise).toBe(250);
    expect(res.totalPaise).toBe(10500);
  });

  // Scenario 13: Fractional quantity (1.250 kg @ Rs 80/kg)
  it('Scenario 13: Fractional quantity (1.250 kg @ Rs 80/kg)', () => {
    const res = calcLine({
      qtyMilli: 1250,
      ratePaise: 8000,
      gstRate: 12,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(10000); // 1.25 * 80 = 100
    expect(res.totalPaise).toBe(11200);
  });

  // Scenario 14: Line item discount
  it('Scenario 14: Line item with flat discount', () => {
    const res = calcLine({
      qtyMilli: 1000,
      ratePaise: 10000,
      discountPaise: 2000, // Rs 20 off
      gstRate: 18,
      taxInclusive: false,
      isInterState: false,
    });
    expect(res.taxableValuePaise).toBe(8000);
    expect(res.cgstPaise).toBe(720);
    expect(res.sgstPaise).toBe(720);
    expect(res.totalPaise).toBe(9440);
  });

  // Scenarios 15–20: Pro-rata invoice discount apportionment
  it('Scenario 15: Apportion discount across two items evenly', () => {
    const res = apportionDiscount([5000, 5000], 1000);
    expect(res).toEqual([500, 500]);
  });

  it('Scenario 16: Apportion discount with odd remainder (largest remainder method)', () => {
    const res = apportionDiscount([1000, 1000, 1000], 10);
    expect(res.reduce((a, b) => a + b, 0)).toBe(10);
    expect(res).toEqual([4, 3, 3]);
  });

  // Scenarios 21–25: Full invoice calculations with Round-off
  it('Scenario 17: Invoice with round-off to nearest rupee (+30 paise)', () => {
    const invoice = calcInvoice({
      items: [
        { qtyMilli: 1000, ratePaise: 10000, gstRate: 5, taxInclusive: false }, // 105.00
        { qtyMilli: 1000, ratePaise: 2570, gstRate: 0, taxInclusive: false },  // 25.70
      ],
      isInterState: false,
    });
    // Raw total = 105.00 + 25.70 = 130.70 (13070 paise)
    // Nearest rupee = 131.00 (13100 paise)
    // Roundoff = +30 paise
    expect(invoice.totals.grandTotalPaise).toBe(13100);
    expect(invoice.totals.roundOffPaise).toBe(30);
  });

  it('Scenario 18: Invoice with round-off (-40 paise)', () => {
    const invoice = calcInvoice({
      items: [
        { qtyMilli: 1000, ratePaise: 10040, gstRate: 0, taxInclusive: false }, // 100.40
      ],
      isInterState: false,
    });
    // Raw = 100.40 -> Nearest = 100.00 -> Roundoff = -40 paise
    expect(invoice.totals.grandTotalPaise).toBe(10000);
    expect(invoice.totals.roundOffPaise).toBe(-40);
  });

  // Scenarios 26–30: Financial year and GSTIN
  it('Scenario 19: Financial year logic (April boundary)', () => {
    expect(getFinancialYear('2026-04-01')).toBe('2026-27');
    expect(getFinancialYear('2026-10-10')).toBe('2026-27');
    expect(getFinancialYear('2027-03-31')).toBe('2026-27');
    expect(getFinancialYear('2027-04-01')).toBe('2027-28');
  });

  it('Scenario 20: Invoice sequence building', () => {
    expect(buildInvoiceNumber('INV', '2026-27', 1)).toBe('INV/2026-27/000001');
    expect(buildInvoiceNumber('BILL', '2026-27', 452)).toBe('BILL/2026-27/000452');
  });

  it('Scenario 21: Valid GSTIN format and state extraction', () => {
    const maharashtraGstin = '27ABCDE1234F1Z5';
    expect(isValidGstinFormat(maharashtraGstin)).toBe(true);
    expect(getStateCodeFromGstin(maharashtraGstin)).toBe('27');
    expect(isValidGstinFormat('INVALID_GSTIN')).toBe(false);
  });
});

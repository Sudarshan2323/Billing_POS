/**
 * Pure GST Calculation Engine for BillBook.
 * Zero I/O, integer paise precision, compliant with Indian GST rules.
 */

import { assertPaise } from './money.js';

export function calcLine({
  qtyMilli,
  ratePaise,
  discountPaise = 0,
  gstRate,
  taxInclusive = false,
  isInterState = false,
}) {
  if (!Number.isInteger(qtyMilli) || qtyMilli <= 0) {
    throw new TypeError(`qtyMilli must be a positive integer, got: ${qtyMilli}`);
  }
  assertPaise(ratePaise);
  assertPaise(discountPaise);

  const grossPaise = Math.round((qtyMilli * ratePaise) / 1000);
  const lineNetPaise = Math.max(0, grossPaise - discountPaise);

  let taxableValuePaise = 0;
  let taxPaise = 0;

  if (gstRate === 0) {
    taxableValuePaise = lineNetPaise;
    taxPaise = 0;
  } else if (taxInclusive) {
    taxableValuePaise = Math.round((lineNetPaise * 100) / (100 + gstRate));
    taxPaise = lineNetPaise - taxableValuePaise;
  } else {
    taxableValuePaise = lineNetPaise;
    taxPaise = Math.round((taxableValuePaise * gstRate) / 100);
  }

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isInterState) {
    igstPaise = taxPaise;
  } else {
    cgstPaise = Math.floor(taxPaise / 2);
    sgstPaise = taxPaise - cgstPaise;
  }

  const totalPaise = taxableValuePaise + taxPaise;

  return {
    grossPaise,
    discountPaise,
    taxableValuePaise,
    gstRate,
    taxPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalPaise,
  };
}

export function apportionDiscount(itemGrossList, totalDiscountPaise) {
  assertPaise(totalDiscountPaise);
  if (totalDiscountPaise === 0 || itemGrossList.length === 0) {
    return itemGrossList.map(() => 0);
  }

  const totalGross = itemGrossList.reduce((a, b) => a + b, 0);
  if (totalGross === 0) {
    return itemGrossList.map(() => 0);
  }

  const exactShares = itemGrossList.map(gross => (gross * totalDiscountPaise) / totalGross);
  const floorShares = exactShares.map(s => Math.floor(s));
  const remainders = exactShares.map((s, idx) => ({ idx, rem: s - floorShares[idx] }));

  let distributed = floorShares.reduce((a, b) => a + b, 0);
  let difference = totalDiscountPaise - distributed;

  remainders.sort((a, b) => b.rem - a.rem);

  for (let i = 0; i < difference; i++) {
    const item = remainders[i % remainders.length];
    floorShares[item.idx] += 1;
  }

  return floorShares;
}

export function calcInvoice({
  items,
  invoiceDiscountPaise = 0,
  otherChargesPaise = 0,
  isInterState = false,
}) {
  assertPaise(invoiceDiscountPaise);
  assertPaise(otherChargesPaise);

  const itemGrossList = items.map(item =>
    Math.round((item.qtyMilli * item.ratePaise) / 1000)
  );

  const apportionedDiscounts = apportionDiscount(itemGrossList, invoiceDiscountPaise);

  let totalTaxableValuePaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalTaxPaise = 0;

  const calculatedItems = items.map((item, idx) => {
    const lineDiscount = (item.discountPaise || 0) + apportionedDiscounts[idx];
    const lineResult = calcLine({
      qtyMilli: item.qtyMilli,
      ratePaise: item.ratePaise,
      discountPaise: lineDiscount,
      gstRate: item.gstRate,
      taxInclusive: Boolean(item.taxInclusive),
      isInterState,
    });

    totalTaxableValuePaise += lineResult.taxableValuePaise;
    totalCgstPaise += lineResult.cgstPaise;
    totalSgstPaise += lineResult.sgstPaise;
    totalIgstPaise += lineResult.igstPaise;
    totalTaxPaise += lineResult.taxPaise;

    return {
      ...item,
      ...lineResult,
    };
  });

  const rawGrandTotalPaise =
    totalTaxableValuePaise + totalTaxPaise + otherChargesPaise;

  const grandTotalPaise = Math.round(rawGrandTotalPaise / 100) * 100;
  const roundOffPaise = grandTotalPaise - rawGrandTotalPaise;

  return {
    items: calculatedItems,
    totals: {
      taxableValuePaise: totalTaxableValuePaise,
      cgstPaise: totalCgstPaise,
      sgstPaise: totalSgstPaise,
      igstPaise: totalIgstPaise,
      totalTaxPaise,
      otherChargesPaise,
      roundOffPaise,
      grandTotalPaise,
    },
  };
}

/**
 * Financial Year & Invoice Numbering Utilities (Indian Accounting FY: April–March)
 */

export function getFinancialYear(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 to 12

  if (month >= 4) {
    const nextYearShort = String((year + 1) % 100).padStart(2, '0');
    return `${year}-${nextYearShort}`;
  } else {
    const currentYearShort = String(year % 100).padStart(2, '0');
    return `${year - 1}-${currentYearShort}`;
  }
}

export function buildInvoiceNumber(prefix = 'INV', fy, seq) {
  const paddedSeq = String(seq).padStart(6, '0');
  return `${prefix}/${fy}/${paddedSeq}`;
}

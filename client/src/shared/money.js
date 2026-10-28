/**
 * Money utilities for BillBook.
 * Rule: Money is always integer paise everywhere. No floats for currency.
 */

export function assertPaise(amount) {
  if (!Number.isInteger(amount)) {
    throw new TypeError(`Amount must be an integer in paise, received: ${amount}`);
  }
  if (!Number.isFinite(amount)) {
    throw new TypeError(`Amount must be finite, received: ${amount}`);
  }
}

export function toPaise(rupees) {
  if (typeof rupees === 'number') {
    if (!Number.isFinite(rupees)) {
      throw new TypeError(`Invalid rupee number: ${rupees}`);
    }
    return Math.round(rupees * 100);
  }

  const cleaned = String(rupees).trim();
  if (cleaned === '' || Number.isNaN(Number(cleaned))) {
    throw new TypeError(`Invalid rupee string format: "${rupees}"`);
  }

  const isNegative = cleaned.startsWith('-');
  const absStr = isNegative ? cleaned.slice(1) : cleaned;
  const parts = absStr.split('.');

  const wholePart = parts[0] || '0';
  const fracPart = (parts[1] || '').padEnd(2, '0').slice(0, 2);

  const paise = Number(wholePart) * 100 + Number(fracPart);
  return isNegative ? -paise : paise;
}

export function toRupees(paise) {
  assertPaise(paise);
  return paise / 100;
}

export function addPaise(...amounts) {
  return amounts.reduce((acc, curr) => {
    assertPaise(curr);
    return acc + curr;
  }, 0);
}

export function subPaise(a, b) {
  assertPaise(a);
  assertPaise(b);
  return a - b;
}

export function formatINR(paise) {
  assertPaise(paise);
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertBelowThousand(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n] || '';
  if (n < 100) {
    const ten = TENS[Math.floor(n / 10)] || '';
    const one = ONES[n % 10] ? ` ${ONES[n % 10]}` : '';
    return `${ten}${one}`;
  }
  const hundred = `${ONES[Math.floor(n / 100)]} Hundred`;
  const remainder = n % 100;
  if (remainder > 0) {
    return `${hundred} ${convertBelowThousand(remainder)}`;
  }
  return hundred;
}

export function amountInWordsIndian(paise) {
  assertPaise(paise);
  if (paise === 0) return 'Rupees Zero Only';

  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);

  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  let words = '';

  if (rupees > 0) {
    let num = rupees;

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    const hundredAndBelow = num;

    const parts = [];
    if (crore > 0) parts.push(`${convertBelowThousand(crore)} Crore`);
    if (lakh > 0) parts.push(`${convertBelowThousand(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${convertBelowThousand(thousand)} Thousand`);
    if (hundredAndBelow > 0) parts.push(convertBelowThousand(hundredAndBelow));

    words = `Rupees ${parts.join(' ')}`;
  } else {
    words = 'Rupees Zero';
  }

  if (remainingPaise > 0) {
    words += ` and ${convertBelowThousand(remainingPaise)} Paise`;
  }

  words += ' Only';

  return isNegative ? `Minus ${words}` : words;
}

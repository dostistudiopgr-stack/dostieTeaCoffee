/**
 * Format a number as Indian Rupee string using Intl.NumberFormat.
 * e.g. 12500 → "₹12,500"
 */
export const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/** Calculate discount % between original and sale price. */
export const calcDiscountPct = (original: number, sale: number): number =>
  Math.round(((original - sale) / original) * 100);

export const calcDiscount = calcDiscountPct;

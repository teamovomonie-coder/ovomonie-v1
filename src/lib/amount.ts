export function toKobo(amount: number | string): number {
  // Accept numbers or numeric strings representing Naira (₦). Return integer kobo.
  let n: number;
  if (typeof amount === 'string') {
    // Remove common thousand separators and non-numeric characters except dot and minus
    const cleaned = (amount as string).replace(/[^0-9.-]+/g, '');
    n = parseFloat(cleaned);
  } else {
    n = Number(amount);
  }
  if (!isFinite(n) || isNaN(n)) return 0;
  // Use precise rounding to avoid floating point surprises
  return Math.round(n * 100);
}

export function fromKobo(kobo: number): number {
  return Math.round(kobo) / 100;
}

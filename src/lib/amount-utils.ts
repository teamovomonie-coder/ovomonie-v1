/**
 * Simple amount utilities for currency conversion
 * Avoids circular imports by being standalone
 */

export function toKobo(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num * 100);
}

export function fromKobo(kobo: number): number {
  return kobo / 100;
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatAmount(kobo: number): string {
  return formatCurrency(fromKobo(kobo));
}
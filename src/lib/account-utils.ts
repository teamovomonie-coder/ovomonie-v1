/**
 * Account number utilities for VFD virtual accounts
 */

/**
 * Convert phone number to VFD account number (stored in DB)
 * Phone: 08012345678 -> Account: 8012345678 (without leading 0)
 */
export function phoneToAccountNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const withoutLeadingZero = cleaned.replace(/^0+/, '');
  return withoutLeadingZero.slice(-10); // Last 10 digits without leading 0
}

/**
 * Convert account number to display format (reversed for frontend)
 * Account: 8012345678 -> Display: 8765432108
 */
export function accountNumberToDisplay(accountNumber: string): string {
  if (!accountNumber) return '';
  return accountNumber.split('').reverse().join('');
}

/**
 * Convert display format back to account number
 * Display: 8765432108 -> Account: 8012345678
 */
export function displayToAccountNumber(display: string): string {
  if (!display) return '';
  return display.split('').reverse().join('');
}

/**
 * Format account number for display with spacing
 * 8012345678 -> 8765 4321 08 (reversed and spaced)
 */
export function formatAccountDisplay(accountNumber: string): string {
  if (!accountNumber) return '';
  const display = accountNumberToDisplay(accountNumber);
  return display.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3');
}

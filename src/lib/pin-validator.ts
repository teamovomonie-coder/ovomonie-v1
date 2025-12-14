import { verifySecret } from './auth';
import { logger } from './logger';

/**
 * Validates a user's transaction PIN against the stored hash
 * @param providedPin - The PIN provided by the user (unhashed)
 * @param storedHash - The PIN hash stored in the database
 * @returns true if PIN is valid, false otherwise
 */
export function validateTransactionPin(providedPin: string | number, storedHash: string): boolean {
  try {
    if (!storedHash) {
      logger.warn('No PIN hash found in database');
      return false;
    }
    return verifySecret(String(providedPin), storedHash);
  } catch (error) {
    logger.error('PIN validation error:', error);
    return false;
  }
}

/**
 * Validates a user's login PIN against the stored hash
 * @param providedPin - The PIN provided by the user (unhashed)
 * @param storedHash - The PIN hash stored in the database
 * @returns true if PIN is valid, false otherwise
 */
export function validateLoginPin(providedPin: string | number, storedHash: string): boolean {
  return validateTransactionPin(providedPin, storedHash);
}

/**
 * Validates both login and transaction PINs (used for withdrawals)
 * @param loginPin - User's login PIN (unhashed)
 * @param transactionPin - User's transaction PIN (unhashed)
 * @param loginPinHash - Login PIN hash from database
 * @param transactionPinHash - Transaction PIN hash from database
 * @returns object with validation results
 */
export function validateBothPins(
  loginPin: string | number,
  transactionPin: string | number,
  loginPinHash: string,
  transactionPinHash: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateLoginPin(loginPin, loginPinHash)) {
    errors.push('Invalid login PIN');
  }

  if (!validateTransactionPin(transactionPin, transactionPinHash)) {
    errors.push('Invalid transaction PIN');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a PIN attempt should be allowed based on attempt count
 * (Can be enhanced with rate limiting in the future)
 * @param attemptCount - Number of failed PIN attempts
 * @param maxAttempts - Maximum allowed attempts before lockout (default: 3)
 * @returns true if the PIN attempt should be allowed
 */
export function isPinAttemptAllowed(attemptCount: number, maxAttempts: number = 3): boolean {
  return attemptCount < maxAttempts;
}

/**
 * Generates a response for PIN validation failure with appropriate message
 * @param attemptCount - Current attempt count
 * @param maxAttempts - Maximum attempts allowed
 * @returns response message
 */
export function getPinErrorMessage(attemptCount: number, maxAttempts: number = 3): string {
  const remainingAttempts = maxAttempts - attemptCount;
  
  if (remainingAttempts > 1) {
    return `Invalid PIN. ${remainingAttempts} attempts remaining.`;
  } else if (remainingAttempts === 1) {
    return 'Invalid PIN. 1 attempt remaining. Account will be locked after this.';
  } else {
    return 'Account locked due to too many failed PIN attempts. Please contact support.';
  }
}

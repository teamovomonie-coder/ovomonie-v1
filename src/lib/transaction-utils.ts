/**
 * Transaction Utilities
 * Helper functions for generating unique transaction references and IDs
 */

/**
 * Generate a unique transaction reference
 * Format: prefix-timestamp-random
 * Example: ovopay-1703123456789-abc123
 */
export function generateTransactionReference(prefix: string = 'ovopay'): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

/**
 * Generate a unique transaction ID for internal use
 * Format: UUID-like string with timestamp component
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 8);
  const random2 = Math.random().toString(36).substring(2, 8);
  return `tx_${timestamp}_${random1}_${random2}`;
}

/**
 * Validate transaction reference format
 */
export function isValidTransactionReference(reference: string): boolean {
  // Check for ovopay-timestamp-random format
  const pattern = /^[a-zA-Z]+-\d{13}-[a-z0-9]{6}$/;
  return pattern.test(reference);
}

/**
 * Extract timestamp from transaction reference
 */
export function extractTimestampFromReference(reference: string): number | null {
  try {
    const parts = reference.split('-');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[1]);
      return isNaN(timestamp) ? null : timestamp;
    }
    return null;
  } catch {
    return null;
  }
}
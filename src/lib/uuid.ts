export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate unique transaction reference with timestamp and random suffix
export const generateTransactionReference = (type: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${type.toUpperCase()}-${timestamp}-${randomSuffix}`;
};

// Generate unique receipt ID
export const generateReceiptId = (): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `RCP-${timestamp}-${randomId}`;
};
/**
 * Card Utilities for Smart Card Detection and Validation
 */

export type CardBrand = 'visa' | 'mastercard' | 'verve' | 'amex' | 'discover' | 'unknown';

export interface CardInfo {
  brand: CardBrand;
  brandName: string;
  icon: string;
  cvvLength: number;
  cardNumberLengths: number[];
  gaps: number[]; // Positions to insert spaces for formatting
  isValid: boolean;
  isPotentiallyValid: boolean;
}

// Card brand detection patterns
const CARD_PATTERNS: { brand: CardBrand; pattern: RegExp; cvvLength: number; lengths: number[]; gaps: number[] }[] = [
  // Verve (Nigerian cards) - starts with 506099, 507850, 507865, 507866, 507867, 507868, 507869, 650002-650027
  { brand: 'verve', pattern: /^(506099|507850|50786[5-9]|650002|650010|650011|65002[0-7]|5061)/, cvvLength: 3, lengths: [16, 18, 19], gaps: [4, 8, 12, 16] },
  
  // Visa - starts with 4
  { brand: 'visa', pattern: /^4/, cvvLength: 3, lengths: [13, 16, 19], gaps: [4, 8, 12] },
  
  // Mastercard - starts with 51-55 or 2221-2720
  { brand: 'mastercard', pattern: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/, cvvLength: 3, lengths: [16], gaps: [4, 8, 12] },
  
  // American Express - starts with 34 or 37
  { brand: 'amex', pattern: /^3[47]/, cvvLength: 4, lengths: [15], gaps: [4, 10] },
  
  // Discover - starts with 6011, 622126-622925, 644-649, 65
  { brand: 'discover', pattern: /^(6011|65|64[4-9]|622(12[6-9]|1[3-9]|[2-8]|9[01]|92[0-5]))/, cvvLength: 3, lengths: [16, 19], gaps: [4, 8, 12] },
];

const BRAND_INFO: Record<CardBrand, { name: string; icon: string }> = {
  visa: { name: 'Visa', icon: '💳' },
  mastercard: { name: 'Mastercard', icon: '💳' },
  verve: { name: 'Verve', icon: '🇳🇬' },
  amex: { name: 'American Express', icon: '💳' },
  discover: { name: 'Discover', icon: '💳' },
  unknown: { name: 'Card', icon: '💳' },
};

/**
 * Detect card brand from card number
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  for (const { brand, pattern } of CARD_PATTERNS) {
    if (pattern.test(cleanNumber)) {
      return brand;
    }
  }
  
  return 'unknown';
}

/**
 * Get full card info including validation status
 */
export function getCardInfo(cardNumber: string): CardInfo {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(cleanNumber);
  const brandConfig = CARD_PATTERNS.find(c => c.brand === brand);
  const brandDisplay = BRAND_INFO[brand];
  
  const config = brandConfig || { cvvLength: 3, lengths: [16], gaps: [4, 8, 12] };
  
  // Validate using Luhn algorithm
  const isValidLuhn = luhnCheck(cleanNumber);
  const isCorrectLength = config.lengths.includes(cleanNumber.length);
  const isPotentiallyValid = cleanNumber.length <= Math.max(...config.lengths);
  
  return {
    brand,
    brandName: brandDisplay.name,
    icon: brandDisplay.icon,
    cvvLength: config.cvvLength,
    cardNumberLengths: config.lengths,
    gaps: config.gaps,
    isValid: isValidLuhn && isCorrectLength,
    isPotentiallyValid,
  };
}

/**
 * Luhn algorithm for card number validation
 */
export function luhnCheck(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Format card number with proper spacing based on card type
 */
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const info = getCardInfo(cleanNumber);
  
  let formatted = '';
  let gapIndex = 0;
  
  for (let i = 0; i < cleanNumber.length; i++) {
    if (gapIndex < info.gaps.length && i === info.gaps[gapIndex]) {
      formatted += ' ';
      gapIndex++;
    }
    formatted += cleanNumber[i];
  }
  
  return formatted;
}

/**
 * Validate expiry date
 */
export function validateExpiry(expiry: string): { isValid: boolean; isExpired: boolean; message: string } {
  // Handle both MM/YY and YYMM formats
  let month: number;
  let year: number;
  
  const cleanExpiry = expiry.replace(/\D/g, '');
  
  if (expiry.includes('/')) {
    // MM/YY format
    const [mm, yy] = expiry.split('/');
    month = parseInt(mm, 10);
    year = parseInt(yy, 10) + 2000;
  } else if (cleanExpiry.length === 4) {
    // YYMM format (VFD style)
    year = parseInt(cleanExpiry.slice(0, 2), 10) + 2000;
    month = parseInt(cleanExpiry.slice(2, 4), 10);
  } else {
    return { isValid: false, isExpired: false, message: 'Invalid expiry format' };
  }
  
  if (month < 1 || month > 12) {
    return { isValid: false, isExpired: false, message: 'Invalid month (1-12)' };
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Allow VFD dev mode expiry dates (5003 = year 2050, month 03)
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && year >= 2050) {
    return { isValid: true, isExpired: false, message: '' };
  }
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, isExpired: true, message: 'Card has expired' };
  }
<<<<<<< HEAD
  
<<<<<<< HEAD
  // Card valid for max 50 years from now (to support test cards)
  if (year > currentYear + 50) {
=======
  // Card valid for max 20 years from now (or 50 years in dev mode)
  const maxYears = isDev ? 50 : 20;
  if (year > currentYear + maxYears) {
>>>>>>> origin/supabase/remove-firebase
=======

  // Card valid for max 20 years from now (or 50 years in dev mode)
  const maxYears = isDev ? 50 : 20;
  if (year > currentYear + maxYears) {
>>>>>>> 8e5f21f5b08d51d9bd1771aad0f7e479bf12c9aa
    return { isValid: false, isExpired: false, message: 'Invalid expiry year' };
  }
  
  return { isValid: true, isExpired: false, message: '' };
}

/**
 * Validate CVV based on card type
 */
export function validateCVV(cvv: string, cardNumber: string): { isValid: boolean; message: string } {
  const cleanCvv = cvv.replace(/\D/g, '');
  const info = getCardInfo(cardNumber);
  
  if (cleanCvv.length === 0) {
    return { isValid: false, message: 'CVV is required' };
  }
  
  if (cleanCvv.length !== info.cvvLength) {
    return { isValid: false, message: `CVV must be ${info.cvvLength} digits for ${info.brandName}` };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Mask card number for display (show last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length < 4) return '****';
  const last4 = cleanNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Format expiry for display
 */
export function formatExpiryDisplay(expiry: string): string {
  const clean = expiry.replace(/\D/g, '');
  if (clean.length === 4) {
    // If YYMM format, convert to MM/YY for display
    if (expiry.includes('/')) {
      return expiry;
    }
    return `${clean.slice(2, 4)}/${clean.slice(0, 2)}`;
  }
  return expiry;
}

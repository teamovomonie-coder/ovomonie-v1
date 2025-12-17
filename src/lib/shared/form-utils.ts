import { z } from 'zod'

// Common validation schemas
export const pinSchema = z.string().regex(/^\d{4}$/, 'PIN must be 4 digits')
export const phoneSchema = z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid phone number')
export const amountSchema = z.number().min(100, 'Minimum amount is ₦100').max(1000000, 'Maximum amount is ₦1,000,000')
export const accountNumberSchema = z.string().regex(/^OVO\d{9}$/, 'Invalid account number format')

// Common form validation
export const validatePin = (pin: string): boolean => pinSchema.safeParse(pin).success
export const validatePhone = (phone: string): boolean => phoneSchema.safeParse(phone).success
export const validateAmount = (amount: number): boolean => amountSchema.safeParse(amount).success

// Format currency
export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)

// Format phone number
export const formatPhone = (phone: string): string => {
  if (phone.startsWith('+234')) return phone
  if (phone.startsWith('0')) return '+234' + phone.slice(1)
  return '+234' + phone
}

// Generate transaction reference
export const generateTxnRef = (prefix: string = 'TXN'): string => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
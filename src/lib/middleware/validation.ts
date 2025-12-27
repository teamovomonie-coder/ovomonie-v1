import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { logger } from './logger';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return {
        success: false,
        error: 'Validation failed',
        errors: errors as Record<string, string[]>
      };
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    logger.error('Validation error', { error });
    return {
      success: false,
      error: 'Validation failed'
    };
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '').substring(0, 15);
}

export function sanitizeAmount(amount: number): number {
  const sanitized = Math.abs(Math.round(amount * 100) / 100);
  return Math.min(sanitized, 10000000); // Max 10M
}

export async function withValidation<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = validateRequestBody(schema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: validation.error,
          errors: validation.errors
        },
        { status: 400 }
      );
    }
    
    return await handler(validation.data!, request);
  } catch (error) {
    logger.error('Request validation error', { error });
    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

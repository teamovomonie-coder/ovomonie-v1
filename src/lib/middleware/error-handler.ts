import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';
  
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

function handleApiError(error: unknown, request: NextRequest): NextResponse {
  const requestId = crypto.randomUUID();
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // Log error with context
  logger.error('API Error', {
    requestId,
    path,
    method,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  });
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: messages,
        code: 'VALIDATION_ERROR',
        requestId,
      },
      { status: 400 }
    );
  }
  
  // Handle custom API errors
  if (error instanceof Error && 'statusCode' in error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      {
        error: apiError.message,
        code: apiError.code || 'API_ERROR',
        requestId,
      },
      { status: apiError.statusCode || 500 }
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      {
        error: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId,
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
  
  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      requestId,
    },
    { status: 500 }
  );
}
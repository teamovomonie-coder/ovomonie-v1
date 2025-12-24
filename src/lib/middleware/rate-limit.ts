import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of requestCounts.entries()) {
      if (now > v.resetTime) {
        requestCounts.delete(k);
      }
    }
    
    const current = requestCounts.get(key);
    
    if (!current) {
      // First request from this IP for this endpoint
      requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }
    
    if (now > current.resetTime) {
      // Window has expired, reset
      requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      logger.warn('Rate limit exceeded', { ip, path: request.nextUrl.pathname, count: current.count });
      
      return NextResponse.json(
        { 
          error: config.message || 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString(),
          }
        }
      );
    }
    
    // Increment counter
    current.count++;
    return null; // Allow request
  };
}

// Predefined rate limit configurations
export const rateLimits = {
  // Strict limits for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  }),
  
  // Moderate limits for financial operations
  financial: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: 'Too many financial requests. Please wait a moment.',
  }),
  
  // General API limits
  general: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many requests. Please slow down.',
  }),
  
  // Strict limits for sensitive operations
  sensitive: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 attempts per 5 minutes
    message: 'Too many attempts for sensitive operation. Please try again later.',
  }),
};
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface FailedAttempt {
  count: number;
  lockUntil: number | null;
}

// In-memory store for failed PIN attempts (use Redis in production)
const failedAttempts = new Map<string, FailedAttempt>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export class PinRateLimiter {
  private getKey(identifier: string, type: 'login' | 'transaction' | 'authorization'): string {
    return `pin:${type}:${identifier}`;
  }

  checkLockout(identifier: string, type: 'login' | 'transaction' | 'authorization'): NextResponse | null {
    const key = this.getKey(identifier, type);
    const attempt = failedAttempts.get(key);
    
    if (!attempt) return null;
    
    const now = Date.now();
    
    if (attempt.lockUntil && now < attempt.lockUntil) {
      const remainingSeconds = Math.ceil((attempt.lockUntil - now) / 1000);
      logger.warn('PIN attempt blocked - account locked', { identifier, type, remainingSeconds });
      
      return NextResponse.json(
        { 
          message: `Too many failed attempts. Account locked for ${Math.ceil(remainingSeconds / 60)} minutes.`,
          lockedUntil: attempt.lockUntil,
          remainingSeconds
        },
        { status: 429 }
      );
    }
    
    // Lock expired, reset
    if (attempt.lockUntil && now >= attempt.lockUntil) {
      failedAttempts.delete(key);
    }
    
    return null;
  }

  recordFailure(identifier: string, type: 'login' | 'transaction' | 'authorization'): { 
    remainingAttempts: number; 
    locked: boolean;
    lockUntil?: number;
  } {
    const key = this.getKey(identifier, type);
    const attempt = failedAttempts.get(key) || { count: 0, lockUntil: null };
    
    attempt.count++;
    
    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.lockUntil = Date.now() + LOCKOUT_DURATION;
      failedAttempts.set(key, attempt);
      
      logger.warn('PIN attempts exceeded - account locked', { 
        identifier, 
        type, 
        attempts: attempt.count,
        lockUntil: attempt.lockUntil 
      });
      
      return { 
        remainingAttempts: 0, 
        locked: true,
        lockUntil: attempt.lockUntil
      };
    }
    
    failedAttempts.set(key, attempt);
    
    logger.info('Failed PIN attempt recorded', { 
      identifier, 
      type, 
      attempts: attempt.count,
      remaining: MAX_ATTEMPTS - attempt.count
    });
    
    return { 
      remainingAttempts: MAX_ATTEMPTS - attempt.count, 
      locked: false 
    };
  }

  recordSuccess(identifier: string, type: 'login' | 'transaction' | 'authorization'): void {
    const key = this.getKey(identifier, type);
    failedAttempts.delete(key);
    logger.info('PIN attempt successful - counter reset', { identifier, type });
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of failedAttempts.entries()) {
      if (attempt.lockUntil && now >= attempt.lockUntil) {
        failedAttempts.delete(key);
      }
    }
  }
}

export const pinRateLimiter = new PinRateLimiter();

// Run cleanup every 5 minutes
setInterval(() => pinRateLimiter.cleanup(), 5 * 60 * 1000);

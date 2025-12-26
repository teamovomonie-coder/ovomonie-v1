# PIN Rate Limiter

## Overview
The PIN rate limiter protects against brute force attacks by limiting failed PIN entry attempts across the application.

## Configuration
- **Maximum Attempts**: 5 failed attempts
- **Lockout Duration**: 30 minutes
- **Tracked PIN Types**:
  - `login` - Login PIN attempts (tracked by phone number)
  - `transaction` - Transaction PIN attempts (tracked by user ID)
  - `authorization` - Card authorization PIN attempts (tracked by user ID)

## Implementation

### Endpoints Protected
1. **Login PIN** (`/api/auth/login`)
   - Tracks failures by phone number
   - Returns remaining attempts in error message
   - Locks account for 30 minutes after 5 failures

2. **Transaction PIN** (`/api/auth/verify-pin`)
   - Tracks failures by user ID
   - Returns remaining attempts in error message
   - Locks account for 30 minutes after 5 failures

3. **Card Authorization PIN** (`/api/vfd/cards/authorize-pin`)
   - Tracks failures by user ID
   - Returns remaining attempts in error message
   - Locks account for 30 minutes after 5 failures

### Response Codes
- **200**: Success (counter reset)
- **401**: Invalid PIN (with remaining attempts)
- **429**: Too many attempts (account locked)

### Example Responses

#### Failed Attempt (attempts remaining)
```json
{
  "message": "Invalid phone number or PIN. 3 attempt(s) remaining."
}
```

#### Account Locked
```json
{
  "message": "Too many failed attempts. Account locked for 30 minutes.",
  "lockedUntil": 1234567890000,
  "remainingSeconds": 1800
}
```

## Storage
Currently uses in-memory storage. For production with multiple servers, migrate to Redis:

```typescript
// Example Redis implementation
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store attempt
await redis.setex(`pin:login:${phone}`, 1800, JSON.stringify(attempt));

// Get attempt
const data = await redis.get(`pin:login:${phone}`);
```

## Security Features
- Separate counters for different PIN types
- Automatic cleanup of expired lockouts
- Detailed logging of all attempts
- No information leakage about valid/invalid users

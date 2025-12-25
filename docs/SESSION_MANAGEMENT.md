# Persistent Session Management

## Overview
Users stay logged in indefinitely until they manually log out. The session management system uses long-lived tokens with automatic refresh.

## Configuration

### Token Expiration
- **Initial Token TTL**: 30 days
- **Auto-Refresh Interval**: Every 7 days
- **Storage**: localStorage (client-side)

### Session Behavior
- ✅ Users remain logged in across browser sessions
- ✅ Tokens automatically refresh before expiration
- ✅ Network errors don't cause logout
- ✅ Only manual logout or 401 errors trigger logout

## Implementation Details

### Token Management
1. **Token Creation** (`src/lib/auth.ts`)
   - Tokens are signed with HMAC-SHA256
   - Include user ID (sub), issued at (iat), and expiration (exp)
   - 30-day expiration from creation

2. **Token Validation** (`src/lib/auth-helpers.ts`)
   - Validates signature and expiration
   - Returns null for invalid/expired tokens
   - Used by all protected API endpoints

3. **Token Refresh** (`/api/auth/refresh`)
   - Validates current token
   - Issues new token with extended expiration
   - Automatically called every 7 days

### Auth Context (`src/context/auth-context.tsx`)

#### Features
- Fetches user data on mount
- Handles network errors gracefully
- Auto-refreshes tokens every 7 days
- Updates balance every 30 seconds
- Only logs out on explicit logout or 401 errors

#### Error Handling
```typescript
// Network errors - keep user logged in
catch (err) {
  console.debug('Request failed, keeping user logged in');
  setIsAuthenticated(true);
}

// 401 Unauthorized - logout user
if (res.status === 401) {
  performLogout();
}
```

## Logout Flow

### Manual Logout
1. User clicks logout button
2. Client calls `/api/auth/logout`
3. Token removed from localStorage
4. User redirected to login page

### Automatic Logout (401 Only)
- Invalid/expired token
- User not found in database
- Token signature mismatch

## Storage Keys
- `ovo-auth-token`: JWT token
- `ovo-user-id`: User ID for quick access

## Security Considerations

### Token Security
- Tokens are signed with AUTH_SECRET
- Timing-safe comparison prevents timing attacks
- Tokens stored in localStorage (XSS risk - ensure CSP headers)

### Best Practices
1. Use HTTPS in production
2. Set secure CSP headers
3. Implement token blacklist for compromised tokens
4. Consider httpOnly cookies for enhanced security

## Migration to Production

### Recommended Improvements
1. **Redis Token Store**
   ```typescript
   // Store active tokens
   await redis.setex(`token:${userId}`, 30 * 24 * 60 * 60, token);
   
   // Invalidate on logout
   await redis.del(`token:${userId}`);
   ```

2. **Refresh Token Pattern**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (30 days)
   - Rotate refresh tokens on use

3. **Device Management**
   - Track active sessions per device
   - Allow users to revoke specific sessions
   - Logout all devices option

## Testing

### Test Scenarios
- ✅ User stays logged in after browser restart
- ✅ Token refreshes automatically
- ✅ Network errors don't cause logout
- ✅ Manual logout works correctly
- ✅ Expired tokens trigger re-authentication

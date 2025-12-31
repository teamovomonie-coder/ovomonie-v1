# Authentication and API Fixes - Summary

## Issues Fixed

### 1. Missing "dev" Script
**Problem:** `npm run dev` was failing with "Missing script: dev"
**Solution:** Added `"dev": "next dev"` to package.json scripts

### 2. 401 Unauthorized Errors on API Endpoints
**Problem:** 
- `/api/wallet/balance` returning 401
- `/api/user/[accountNumber]` returning 401

**Root Causes:**
1. Missing or invalid authentication tokens
2. Auth helper functions not properly awaiting async operations
3. Status field case sensitivity (database has 'active' but code checked for 'ACTIVE')
4. Missing authorization header checks

**Solutions:**

#### a. Fixed `/api/wallet/balance` route
- Added explicit authorization header check
- Made getUserIdFromToken properly async with await
- Added user verification from database
- Implemented case-insensitive status check (`status?.toUpperCase() !== 'ACTIVE'`)
- Improved error handling with proper HTTP status codes
- Added logging for debugging

#### b. Fixed `/api/user/[accountNumber]` route
- Added authentication requirement (was missing)
- Verified sender is authenticated and active
- Implemented case-insensitive status checks
- Added account number format validation (10 digits)
- Used supabaseAdmin instead of creating new client
- Improved error messages

#### c. Enhanced auth-helpers.ts
- Added proper logging for authentication failures
- Improved error handling
- Made functions properly async

### 3. Created Client-Side API Helper
**File:** `src/lib/api-client.ts`

Features:
- Automatic token management (localStorage/sessionStorage)
- Proper Authorization header injection
- Automatic token clearing on 401 errors
- Type-safe API methods
- Centralized error handling

Usage:
```typescript
import apiClient from '@/lib/api-client';

// Login
const result = await apiClient.login(phone, pin);

// Get balance
const balance = await apiClient.getWalletBalance();

// Verify account
const user = await apiClient.getUserByAccountNumber('1234567890');
```

### 4. Created Test Script
**File:** `scripts/test-auth-fix.js`

Tests:
- AUTH_SECRET configuration
- Database connection
- User lookup by account number

Run with: `node scripts/test-auth-fix.js`

## How to Use

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Authentication
```bash
node scripts/test-auth-fix.js
```

### 3. Client-Side Usage
Make sure your frontend code:
1. Stores the token after login: `localStorage.setItem('authToken', token)`
2. Includes Authorization header in all API requests: `Authorization: Bearer ${token}`
3. Or use the provided `apiClient` helper

Example:
```typescript
// After login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, pin })
});

const { token } = await response.json();
localStorage.setItem('authToken', token);

// For subsequent requests
const token = localStorage.getItem('authToken');
const balanceResponse = await fetch('/api/wallet/balance', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Database Status Values
The database uses lowercase status values ('active', 'inactive', 'suspended', 'locked').
All API routes now use case-insensitive comparison: `status?.toUpperCase() !== 'ACTIVE'`

## Testing Checklist
- [ ] Login works and returns token
- [ ] Token is stored in localStorage
- [ ] Balance API returns data (not 401)
- [ ] User lookup by account number works
- [ ] Invalid tokens return 401
- [ ] Inactive accounts return 403

## Next Steps
1. Update frontend components to use the new `apiClient` helper
2. Ensure all API calls include the Authorization header
3. Add token refresh logic if needed
4. Test all financial operations (transfers, payments, etc.)

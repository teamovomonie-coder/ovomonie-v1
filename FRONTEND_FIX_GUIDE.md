# Quick Fix Guide - Frontend Authentication

## The Problem
Your API endpoints are returning 401 Unauthorized because:
1. The authentication token is not being sent with requests
2. The token might be expired or invalid

## The Solution

### Step 1: Verify Token Storage After Login
Check your login component and ensure the token is stored:

```typescript
// In your login handler
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, pin })
});

const data = await response.json();

if (data.token) {
  // Store the token
  localStorage.setItem('authToken', data.token);
  // Also store user info if needed
  localStorage.setItem('userId', data.userId);
  localStorage.setItem('accountNumber', data.accountNumber);
}
```

### Step 2: Use the API Client Helper (Recommended)
Replace your fetch calls with the new API client:

```typescript
import apiClient from '@/lib/api-client';

// Login
const result = await apiClient.login(phone, pin);
if (result.ok) {
  // Token is automatically stored
  console.log('Logged in:', result.data);
}

// Get balance
const balance = await apiClient.getWalletBalance();
if (balance.ok) {
  console.log('Balance:', balance.data.balanceInKobo);
} else {
  console.error('Error:', balance.error);
}

// Verify recipient account
const user = await apiClient.getUserByAccountNumber('1234567890');
if (user.ok) {
  console.log('Recipient:', user.data.fullName);
}
```

### Step 3: Manual Fetch (Alternative)
If you prefer manual fetch calls, always include the Authorization header:

```typescript
const token = localStorage.getItem('authToken');

const response = await fetch('/api/wallet/balance', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

if (response.status === 401) {
  // Token expired or invalid - redirect to login
  localStorage.removeItem('authToken');
  window.location.href = '/login';
  return;
}

const data = await response.json();
```

### Step 4: Create a Fetch Wrapper (Alternative)
Create a utility function for authenticated requests:

```typescript
// lib/fetch-with-auth.ts
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}

// Usage
const response = await fetchWithAuth('/api/wallet/balance');
const data = await response.json();
```

## Common Issues & Fixes

### Issue 1: Token Not Being Sent
**Check:** Open browser DevTools → Network tab → Click on the failing request → Check Headers
**Fix:** Ensure Authorization header is present: `Authorization: Bearer ovotoken.xxx.xxx`

### Issue 2: Token Expired
**Symptom:** Was working, now getting 401
**Fix:** Login again to get a new token (tokens expire after 30 days)

### Issue 3: Token Not Stored
**Check:** Console → `localStorage.getItem('authToken')`
**Fix:** Ensure login response handler stores the token

### Issue 4: Wrong Token Format
**Check:** Token should start with `ovotoken.`
**Fix:** Don't modify the token, use it exactly as received from login API

## Testing Your Fix

### 1. Clear Everything
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

### 2. Login
```javascript
// Should store token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '09033333311', pin: '1234' })
});
const data = await response.json();
console.log('Token:', data.token);
localStorage.setItem('authToken', data.token);
```

### 3. Test Balance API
```javascript
const token = localStorage.getItem('authToken');
const response = await fetch('/api/wallet/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('Balance:', data);
```

### 4. Test User Lookup
```javascript
const token = localStorage.getItem('authToken');
const response = await fetch('/api/user/1133333309', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('User:', data);
```

## Files Modified
- ✅ `package.json` - Added dev script
- ✅ `src/app/api/wallet/balance/route.ts` - Fixed authentication
- ✅ `src/app/api/user/[accountNumber]/route.ts` - Fixed authentication
- ✅ `src/lib/auth-helpers.ts` - Improved error handling
- ✅ `src/lib/api-client.ts` - NEW: Client-side helper

## Next Steps
1. Update your components to use `apiClient` or add Authorization headers
2. Test login flow
3. Test balance fetching
4. Test recipient verification
5. Deploy and test in production

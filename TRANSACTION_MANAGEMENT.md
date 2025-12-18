# Transaction Management Guide

## Overview
Internal transfers now automatically save to the `pending_transactions` table with "completed" status and proper response structure.

## What Was Fixed

### 1. Transaction Status
- Internal transfers now save with `status: "completed"` immediately (not "pending")
- The `completed_at` timestamp is set when the transaction completes
- Response structure matches the database schema

### 2. API Response Structure
The internal transfer API now returns:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "user_id": "user-uuid",
    "type": "internal-transfer",
    "status": "completed",
    "reference": "int-1766073463230",
    "amount": 100,
    "data": {
      "data": {
        "photo": null,
        "amount": 100,
        "message": "",
        "narration": "",
        "accountNumber": "7766543218"
      },
      "type": "internal-transfer",
      "amount": 100,
      "reference": "int-1766073463230",
      "completedAt": "18/12/2025, 16:57:43",
      "recipientName": "blur",
      "transactionId": "int-1766073463230"
    },
    "recipient_name": "blur",
    "bank_name": null,
    "error_message": null,
    "completed_at": "2025-12-18T15:57:44.235153+00:00",
    "expires_at": null,
    "created_at": "2025-12-18T15:57:44.235153+00:00",
    "updated_at": "2025-12-18T15:57:44.235153+00:00"
  }
}
```

## View Transaction Details

### Using npm scripts:
```bash
npm run tx:view <transaction-id-or-reference>
```

Example:
```bash
npm run tx:view int-1766073463230
```

### Using API endpoint:
```bash
GET /api/transactions/[id]
Authorization: Bearer <token>
```

## Update Transaction Status

### Using npm scripts:
```bash
npm run tx:update <transaction-id-or-reference> <status>
```

Example:
```bash
npm run tx:update int-1766073463230 completed
```

Status options: `pending`, `processing`, `completed`, `failed`

### Using API endpoint:
```bash
PATCH /api/transactions/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

## Database Schema

The `pending_transactions` table stores:
- `id` - UUID primary key
- `user_id` - User identifier
- `type` - Transaction type (e.g., "internal-transfer")
- `status` - Transaction status (pending/processing/completed/failed)
- `reference` - Unique transaction reference
- `amount` - Amount in kobo (smallest currency unit)
- `data` - JSONB field with full transaction details
- `recipient_name` - Recipient's name
- `bank_name` - Bank name (if applicable)
- `error_message` - Error details (if failed)
- `completed_at` - Completion timestamp
- `expires_at` - Expiration timestamp (if applicable)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Success Page Integration

The success page (`/success`) automatically:
1. Fetches the latest transaction from `pending_transactions` table
2. Falls back to localStorage if database is unavailable
3. Displays the appropriate receipt based on transaction type
4. Shows "completed" transactions with proper formatting

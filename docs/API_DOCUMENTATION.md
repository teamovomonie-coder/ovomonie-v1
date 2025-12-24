# 🚀 Ovo Thrive API Documentation

## Authentication

All API endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Base URL
```
Production: https://ovomonie-v1.vercel.app/api
Development: http://localhost:3000/api
```

## Core Endpoints

### 🔐 Authentication

#### POST /api/auth/login
Login with phone and PIN.

**Request:**
```json
{
  "phone": "+2349034151086",
  "pin": "123456"
}
```

**Response:**
```json
{
  "ok": true,
  "token": "ovotoken.eyJ...",
  "user": {
    "id": "user_123",
    "phone": "+2349034151086",
    "full_name": "John Doe",
    "balance": 50000,
    "kyc_tier": 1
  }
}
```

#### POST /api/auth/register
Register new user account.

**Request:**
```json
{
  "phone": "+2349034151086",
  "full_name": "John Doe",
  "pin": "123456",
  "email": "john@example.com"
}
```

### 💸 Transfers

#### POST /api/transfers/internal
Transfer money between Ovo accounts.

**Request:**
```json
{
  "recipientAccountNumber": "1234567890",
  "amount": 10000,
  "narration": "Payment for services",
  "clientReference": "TXN_123456789"
}
```

**Response:**
```json
{
  "success": true,
  "newSenderBalance": 40000,
  "recipientName": "Jane Doe",
  "reference": "TXN_123456789"
}
```

#### POST /api/transfers/external
Transfer to external bank accounts.

**Request:**
```json
{
  "recipientAccountNumber": "0123456789",
  "recipientBankCode": "044",
  "recipientName": "Jane Doe",
  "amount": 5000,
  "narration": "External transfer",
  "clientReference": "EXT_123456789"
}
```

### 💳 Cards

#### GET /api/cards
Get user's cards.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "card_123",
      "type": "virtual",
      "last4": "1234",
      "status": "active",
      "balance": 25000
    }
  ]
}
```

#### POST /api/cards/create
Create new virtual card.

**Request:**
```json
{
  "type": "virtual",
  "name": "Shopping Card",
  "amount": 50000
}
```

### 🏦 Bills

#### GET /api/bills/categories
Get available bill categories.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "electricity",
      "name": "Electricity",
      "providers": [
        {
          "id": "EKEDC",
          "name": "Eko Electricity Distribution Company"
        }
      ]
    }
  ]
}
```

#### POST /api/bills/pay
Pay utility bills.

**Request:**
```json
{
  "category": "electricity",
  "provider": "EKEDC",
  "customerNumber": "12345678901",
  "amount": 5000,
  "clientReference": "BILL_123456789"
}
```

### 🏧 Loans

#### GET /api/loans
Get user's loan history.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "loan_123",
      "amount": 100000,
      "balance": 75000,
      "status": "active",
      "monthlyRepayment": 18500,
      "nextPaymentDate": "2024-02-15"
    }
  ]
}
```

#### POST /api/loans
Apply for a loan.

**Request:**
```json
{
  "amount": 100000,
  "tenure": 6,
  "purpose": "Business expansion",
  "reference": "LOAN_123456789"
}
```

### 👤 KYC

#### POST /api/kyc/upgrade
Upgrade KYC tier.

**Request:**
```json
{
  "tier": 2,
  "bvn": "12345678901"
}
```

#### POST /api/kyc/nin
Verify NIN.

**Request:**
```json
{
  "nin": "12345678901",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Invalid or missing authentication token
- `INSUFFICIENT_FUNDS` - Account balance too low
- `DAILY_LIMIT_EXCEEDED` - Transaction exceeds daily limit
- `INVALID_ACCOUNT` - Account number not found
- `DUPLICATE_REFERENCE` - Transaction reference already used

## Rate Limits

- **Authentication endpoints**: 5 requests per 15 minutes
- **Financial operations**: 10 requests per minute
- **General API**: 60 requests per minute

## Webhooks

Configure webhooks to receive real-time notifications:

### Transaction Status Updates
```json
{
  "event": "transaction.completed",
  "data": {
    "reference": "TXN_123456789",
    "status": "completed",
    "amount": 10000,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### KYC Status Updates
```json
{
  "event": "kyc.upgraded",
  "data": {
    "userId": "user_123",
    "oldTier": 1,
    "newTier": 2,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```
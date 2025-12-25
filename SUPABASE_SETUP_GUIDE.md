# Ovomonie v1 - Complete Supabase Setup Guide

## 🚀 Project Overview

Ovomonie is a comprehensive fintech platform built with Next.js 15 and Supabase, offering:

- **Digital Banking**: Account management, transfers, balance tracking
- **Payment Services**: VFD Bank integration, bill payments, airtime
- **Financial Products**: Loans, investments, stock trading
- **Lifestyle Services**: Hotel/flight booking, ride-hailing, events
- **Business Tools**: Inventory management, invoicing, payroll
- **Agent Network**: POS terminals, agent management

## 📋 Prerequisites

- Node.js 20+ and npm
- Supabase account and project
- VFD Bank API credentials (for payments)
- Gemini API key (for AI features)

## 🔧 Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd ovomonie-v1
npm install
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Authentication
AUTH_SECRET=your-super-secret-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# VFD Payment API (Optional for development)
VFD_TOKEN_URL=https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token
VFD_CONSUMER_KEY=your-consumer-key
VFD_CONSUMER_SECRET=your-consumer-secret
VFD_ACCESS_TOKEN=your-access-token

# VFD API Base URLs
VFD_CARDS_API_BASE=https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards
VFD_WALLET_API_BASE=https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2
VFD_BILLS_API_BASE=https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore

# AI Features (Optional)
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Supabase Database Setup

Run the complete database migration:

```bash
# Copy the migration SQL
cat docs/supabase-migrations.sql

# Execute in your Supabase SQL Editor
# This creates all tables, indexes, functions, and triggers
```

### 4. Seed Test Data (Optional)

```bash
npm run db:seed
```

## 🏗️ Database Schema Overview

### Core Tables

- **users**: User accounts, authentication, balances
- **financial_transactions**: Complete transaction ledger
- **notifications**: Real-time user notifications
- **loans**: Loan applications and management
- **investments**: Investment portfolios
- **stock_holdings**: Stock trading positions

### Business Features

- **invoices**: Business invoicing system
- **payroll_batches**: Payroll processing
- **inventory_transactions**: Stock management
- **saved_cards**: Tokenized payment methods

### Booking Services

- **event_bookings**: Event ticket reservations
- **hotel_bookings**: Hotel room bookings
- **flight_bookings**: Flight reservations
- **ride_bookings**: Ride-hailing history

## 🚀 Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build           # Production build
npm run start           # Start production server

# Code Quality
npm run lint            # ESLint check
npm run typecheck       # TypeScript check
npm run format          # Prettier formatting

# Testing
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:all        # Complete test suite

# Database
npm run db:seed         # Seed test data
npm run migrate:verify  # Verify migrations

# VFD Integration Testing
npm run test:vfd        # Test VFD connectivity
npm run debug:vfd       # Debug VFD API issues
```

## 🔐 Authentication System

### How It Works

1. **Registration**: Users register with phone + PIN
2. **Login**: JWT tokens with 30-day expiry
3. **Authorization**: All API routes validate tokens
4. **Security**: Scrypt hashing, rate limiting, account lockouts

### Key Files

- `src/lib/auth.ts`: Token creation/verification
- `src/lib/supabase-helpers.ts`: Token extraction
- `src/context/auth-context.tsx`: React authentication state
- `src/app/api/auth/`: Authentication API routes

## 💰 Financial Operations

### Transfer System

```typescript
// Internal transfers use atomic database functions
await supabaseAdmin.rpc('perform_internal_transfer', {
  p_sender_id: senderId,
  p_recipient_id: recipientId,
  p_amount: amountInKobo,
  p_reference: uniqueReference,
  p_narration: description
});
```

### Balance Management

- All amounts stored in kobo (1 Naira = 100 kobo)
- Real-time balance updates via WebSocket-like polling
- Transaction history with complete audit trail

### VFD Bank Integration

- Card funding and management
- Bill payments (electricity, internet, etc.)
- Airtime and data purchases
- Virtual account creation
- Wallet-to-wallet transfers

## 🏦 Key Features Implementation

### 1. Digital Wallet

- **Location**: `src/app/dashboard/`
- **Features**: Balance display, quick actions, transaction history
- **API**: `src/app/api/wallet/`

### 2. Money Transfers

- **Location**: `src/app/internal-transfer/`
- **Features**: Account lookup, PIN verification, instant transfers
- **API**: `src/app/api/transfer/`

### 3. Bill Payments

- **Location**: `src/app/bill-payment/`
- **Features**: Electricity, internet, cable TV, water bills
- **API**: `src/app/api/bills/`

### 4. Card Services

- **Location**: `src/app/add-money/`
- **Features**: Virtual card creation, funding, management
- **API**: `src/app/api/cards/`

### 5. Loan Management

- **Location**: `src/app/loan/`
- **Features**: Application, approval, repayment tracking
- **API**: `src/app/api/loans/`

### 6. Investment Platform

- **Location**: `src/app/ovo-wealth/`
- **Features**: Fixed deposits, mutual funds, portfolio tracking
- **API**: `src/app/api/investments/`

### 7. Business Tools

- **Inventory**: `src/app/inventory/`
- **Invoicing**: `src/app/invoicing/`
- **Payroll**: `src/app/payroll/`

## 🔧 API Architecture

### Authentication Middleware

All API routes use standardized authentication:

```typescript
import { getUserIdFromToken } from '@/lib/supabase-helpers';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromToken(request.headers);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  // Your API logic here
}
```

### Error Handling

Centralized error handling with structured logging:

```typescript
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { logger } from '@/lib/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Your logic here
  logger.info('Operation completed', { userId, operation: 'transfer' });
});
```

### Rate Limiting

Built-in rate limiting for sensitive operations:

```typescript
import { rateLimits } from '@/lib/middleware/rate-limit';

const rateLimitResponse = await rateLimits.auth(request);
if (rateLimitResponse) return rateLimitResponse;
```

## 🎨 UI Components

### Design System

- **Framework**: Tailwind CSS + shadcn/ui
- **Components**: `src/components/ui/`
- **Theme**: Custom financial app theme
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Key Component Categories

- **Layout**: Navigation, headers, footers
- **Forms**: Input validation, PIN entry, OTP
- **Financial**: Balance displays, transaction lists
- **Cards**: Payment cards, feature cards
- **Modals**: Confirmations, receipts, alerts

## 📱 Mobile Optimization

### Progressive Web App

- Service worker for offline functionality
- App manifest for installation
- Touch-optimized interfaces
- Responsive design for all screen sizes

### Biometric Authentication

- Fingerprint/Face ID support
- Secure credential storage
- Fallback to PIN authentication

## 🔒 Security Features

### Data Protection

- All sensitive data encrypted at rest
- PII tokenization and hashing
- Secure API communication (HTTPS only)
- Input validation and sanitization

### Financial Security

- Transaction PIN verification
- Daily transaction limits by KYC tier
- Fraud detection and monitoring
- Account lockout mechanisms

### Compliance

- KYC tier management (1-4 levels)
- Transaction reporting
- Audit trail maintenance
- Regulatory compliance features

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Set all environment variables in your deployment platform:

- Vercel: Project Settings → Environment Variables
- Railway: Variables tab
- Netlify: Site Settings → Environment Variables

### Database Migrations

Run migrations in your Supabase dashboard:

1. Go to SQL Editor
2. Paste contents of `docs/supabase-migrations.sql`
3. Execute the migration

## 📊 Monitoring & Analytics

### Built-in Monitoring

- **Logging**: Structured JSON logs via `src/lib/logger.ts`
- **Performance**: API response time tracking
- **Errors**: Centralized error reporting
- **Health Checks**: `/api/health` endpoint

### Key Metrics

- User registration/login rates
- Transaction volumes and success rates
- API response times
- Error rates by endpoint
- Balance reconciliation

## 🧪 Testing

### Test Structure

```bash
src/__tests__/
├── integration/          # API integration tests
├── financial-operations.test.ts  # Core financial logic
└── ...

e2e/
├── critical-flows.spec.ts       # End-to-end user flows
└── critical-financial-flows.spec.ts  # Financial operations
```

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Full test suite
npm run test:all
```

## 🔧 Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   ```bash
   # Check environment variables
   npm run typecheck
   
   # Verify Supabase credentials
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

2. **VFD API Issues**
   ```bash
   # Test VFD connectivity
   npm run test:vfd
   
   # Debug VFD API calls
   npm run debug:vfd
   ```

3. **Authentication Problems**
   ```bash
   # Clear local storage
   localStorage.clear()
   
   # Check token validity
   npm run debug:auth
   ```

### Database Issues

```sql
-- Check user balances
SELECT id, phone, balance FROM users LIMIT 10;

-- Verify transactions
SELECT * FROM financial_transactions 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check notifications
SELECT * FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 📚 Additional Resources

### Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [VFD Integration](docs/VFD_INTEGRATION_SUMMARY.md)
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)

### Development Tools

- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [VFD Developer Portal](https://developer.vfdbank.systems)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the full test suite
6. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained By**: Ovomonie Development Team
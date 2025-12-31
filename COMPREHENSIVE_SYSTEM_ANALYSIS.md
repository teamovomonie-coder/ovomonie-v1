# OVOMONIE - Comprehensive System Analysis

## Executive Summary

**OVOMONIE** is a comprehensive fintech application built with Next.js 15, TypeScript, Supabase (PostgreSQL), and integrated with VFD Bank APIs. It provides a full suite of financial services including payments, transfers, bill payments, virtual cards, KYC verification, and more.

---

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **UI Framework**: Tailwind CSS, shadcn/ui components, Radix UI
- **Backend**: Next.js API Routes (Server Actions)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Payment Gateway**: VFD Bank APIs
- **Authentication**: Custom JWT token-based system with HMAC-SHA256
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **State Management**: React Context API (Auth, Notifications, Theme)
- **AI Integration**: Google Gemini API (for AI assistant features)

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (backend endpoints)
│   ├── dashboard/         # Main dashboard
│   ├── [feature-pages]/  # Feature-specific pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Core utilities and services
│   ├── auth.ts           # Authentication logic
│   ├── vfd-*.ts          # VFD API integrations
│   ├── db.ts             # Database service layer
│   └── middleware/       # Request middleware
├── context/               # React contexts
│   ├── auth-context.tsx  # Authentication state
│   └── notification-context.tsx  # Real-time notifications
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

---

## Core Workflows

### 1. Authentication & Authorization

#### Token-Based Authentication
- **Location**: `src/lib/auth.ts`, `src/lib/auth-helpers.ts`
- **Method**: HMAC-SHA256 signed JWT tokens
- **Token Format**: `ovo.{base64_payload}.{signature}`
- **Storage**: localStorage (`ovo-auth-token`)

**Flow**:
1. User logs in via `/api/auth/login`
2. Server validates credentials against Supabase
3. Generates JWT token with user ID (`sub`), expiration (`exp`)
4. Token stored in localStorage
5. All API requests include `Authorization: Bearer {token}` header
6. Middleware verifies token on each request

**PIN System**:
- **Transaction PIN**: Required for financial operations (transfers, payments)
- **Login PIN**: Used for authentication
- **Rate Limiting**: PIN attempts tracked to prevent brute force
- **Validation**: `src/lib/pin-validator.ts`

#### Authentication Context
- **Location**: `src/context/auth-context.tsx`
- **Features**:
  - Token management
  - User data fetching
  - Balance synchronization
  - Auto token refresh (24-hour interval)
  - Balance update events

---

### 2. User Registration & Onboarding

#### Registration Flow
**Endpoint**: `POST /api/auth/register`

**Process**:
1. User provides: phone, password, full name, date of birth
2. System generates account number from phone (strips leading 0)
3. Creates user record in Supabase `users` table
4. In production: Creates VFD wallet via `vfdWalletService.createWallet()`
5. Returns user ID and authentication token

**KYC Tiers**:
- **Tier 1**: Basic registration (phone verification)
- **Tier 2**: BVN verification + selfie + OTP verification
- **Tier 3**: Full KYC (NIN, documents)

#### KYC Verification Workflows

**BVN Verification** (`POST /api/kyc/bvn`):
- Validates 11-digit BVN via VFD API
- Returns: name, DOB, phone, photo
- Stores verification status in database

**Image Match** (`POST /api/kyc/imagematch`):
- Compares user selfie with BVN photo
- Uses VFD image matching API
- Returns match score (0-100)

**OTP Verification** (`POST /api/kyc/verify-otp`):
- Sends OTP to user's phone
- Validates OTP code
- Required for Tier 2 upgrade

**AML Screening** (`POST /api/kyc/aml`):
- Screens against PEP, sanctions lists
- Risk level assessment

---

### 3. Wallet & Balance Management

#### Balance Storage
- **Unit**: Kobo (1 Naira = 100 Kobo)
- **Storage**: `users.balance` column (BIGINT)
- **Sync**: Can sync with VFD wallet balance

#### Balance Operations
**Get Balance**: `GET /api/wallet/balance`
- Fetches from Supabase
- Returns balance in kobo

**Sync Balance**: `POST /api/wallet/sync-balance`
- Syncs local balance with VFD wallet
- Updates Supabase if discrepancy found

**Balance Updates**:
- Atomic operations via database functions
- Transaction logs created for all changes
- Real-time updates via Supabase subscriptions

---

### 4. Internal Transfers

#### Transfer Flow
**Endpoint**: `POST /api/transfers/internal`

**Process**:
1. User provides: recipient account, amount, narration, transaction PIN
2. Validates transaction PIN
3. Checks sender balance (sufficient funds)
4. Verifies recipient exists
5. Calls `process_internal_transfer()` database function (atomic)
6. Database function:
   - Locks sender and recipient rows (`FOR UPDATE`)
   - Validates balance
   - Updates both balances atomically
   - Creates debit and credit transactions
   - Creates notifications for both parties
7. Returns new sender balance

**Database Function**: `process_internal_transfer()` (PostgreSQL)
- **Location**: `supabase/migrations/20250126000000_atomic_transfers.sql`
- **Features**:
  - Row-level locking prevents race conditions
  - Duplicate transaction prevention
  - Self-transfer prevention
  - Atomic balance updates
  - Automatic notification creation

**Security**:
- Transaction PIN required
- Rate limiting on PIN attempts
- Idempotency via transaction reference
- Balance validation before processing

---

### 5. External Transfers (Bank Transfers)

#### External Transfer Flow
**Endpoint**: `POST /api/transfers/external`

**Process**:
1. User provides: recipient account, bank code, amount, narration
2. Validates transaction PIN
3. Calls VFD transfer API (`vfdTransfer.initiateTransfer()`)
4. VFD processes interbank transfer
5. Updates local balance
6. Creates transaction record
7. Sends notification

**VFD Integration**:
- Uses VFD Bank Transfer API
- Supports all Nigerian banks
- Real-time processing
- Webhook notifications for status updates

---

### 6. Card Funding (Deposits)

#### Card Payment Flow
**Endpoint**: `POST /api/vfd/cards/initiate`

**Process**:
1. User enters card details (number, PIN, CVV, expiry)
2. System initiates payment via VFD Card API
3. **OTP Handling**:
   - If OTP required: Returns `otpReference`
   - User enters OTP
   - Validates via `POST /api/vfd/cards/validate-otp`
4. Payment processed
5. Balance updated
6. Transaction logged
7. Notification sent

**3D Secure**:
- Some cards require 3DS authentication
- System detects redirect requirement
- Returns error message for user

**Card Tokenization**:
- Option to save card for future use
- Token stored securely in database

#### Alternative Funding Methods
- **Bank Transfer**: Via virtual account
- **USSD**: Integration with USSD codes
- **Paystack**: Alternative payment gateway

---

### 7. Bill Payments

#### Bill Payment Flow
**Endpoint**: `POST /api/bills/vfd`

**Supported Categories**:
- **Electricity**: PHED, EKEDC, AEDC, etc.
- **Cable TV**: DSTV, GOTV, StarTimes
- **Internet**: Spectranet, Smile
- **Water**: Various water boards

**Process**:
1. User selects biller category
2. Enters account number/customer ID
3. System validates account (name lookup)
4. User confirms amount
5. Validates transaction PIN
6. Processes payment via VFD Bills API
7. Deducts from balance
8. Creates transaction record
9. Generates receipt (with token for utilities)
10. Sends notification

**Receipt Generation**:
- PDF receipt with transaction details
- Token numbers for utility payments
- Downloadable format

---

### 8. Airtime Top-ups

#### Airtime Purchase Flow
**Endpoint**: `POST /api/payments` (category: 'airtime')

**Supported Networks**:
- MTN
- Airtel
- GLO
- 9Mobile

**Process**:
1. User selects network
2. Enters phone number
3. Selects amount (quick buttons or custom)
4. Validates transaction PIN
5. Processes via VFD API
6. Deducts from balance
7. Creates transaction
8. Sends notification

---

### 9. Virtual Cards

#### Virtual Card Creation
**Endpoint**: `POST /api/cards/virtual-new`

**Process**:
1. User requests virtual card
2. System checks:
   - User has sufficient balance (₦500 fee)
   - No existing active card
   - KYC tier requirements met
3. Creates `card_request` record (idempotency)
4. Deducts card fee from balance
5. Calls VFD Virtual Card API
6. Creates `virtual_cards` record
7. Returns card details (masked PAN, expiry, CVV)

**Card Management**:
- **View Cards**: `GET /api/cards/virtual`
- **Block Card**: `POST /api/cards/[id]/block`
- **Unblock Card**: `POST /api/cards/[id]/unblock`
- **Card Transactions**: Tracked in `card_transactions` table

**Security**:
- Only one active card per user
- Card details encrypted in database
- CVV shown only once on creation

---

### 10. Virtual Accounts

#### Virtual Account System
**Purpose**: Receive bank transfers from external banks

**Flow**:
1. Each user has a virtual account number (generated from phone)
2. External transfers to this account trigger webhook
3. Webhook handler (`/api/webhooks/vfd`) processes credit
4. Updates user balance
5. Creates transaction record
6. Sends notification

**Webhook Processing**:
- **Endpoint**: `POST /api/webhooks/vfd`
- Validates webhook payload
- Matches account number to user
- Processes credit atomically
- Creates notification

---

### 11. Withdrawals

#### Withdrawal Flow
**Endpoint**: `POST /api/funding/withdraw`

**Process**:
1. User provides: bank account, amount, narration
2. Validates BOTH login PIN and transaction PIN
3. Checks balance
4. Initiates withdrawal via VFD API
5. Updates balance
6. Creates transaction record
7. Sends notification

**Security**:
- Dual PIN validation
- Bank account verification
- Transaction limits based on KYC tier

---

### 12. Notifications System

#### Real-time Notifications
**Technology**: Supabase Realtime (WebSocket)

**Implementation**:
- **Location**: `src/context/notification-context.tsx`
- **Subscription**: `postgres_changes` events on `notifications` table
- **Events**: INSERT, UPDATE, DELETE

**Notification Types**:
- **Transaction**: Transfers, payments, deposits
- **Security**: Login alerts, PIN changes
- **Promotion**: Offers, rewards

**Flow**:
1. Backend creates notification in `notifications` table
2. Supabase triggers real-time event
3. Frontend subscription receives update
4. UI updates automatically
5. Badge shows unread count

**Notification Creation**:
- **Helper**: `src/lib/notification-helper.ts`
- **Function**: `createNotification()`
- Automatically called after transactions

---

### 13. Webhooks

#### VFD Webhooks

**Card Webhooks** (`/api/webhooks/vfd-cards`):
- `virtual_card.created`
- `virtual_card.activated`
- `virtual_card.failed`
- `virtual_card.blocked`

**Credit Webhooks** (`/api/webhooks/vfd-credit`):
- Inward credit notifications
- Bank transfer receipts
- Updates user balance

**Security**:
- Signature verification (HMAC)
- IP whitelisting (optional)
- Idempotency checks

---

### 14. Receipt Generation

#### Receipt System
**Location**: `src/lib/receipt-templates.ts`

**Features**:
- PDF generation (jsPDF)
- Image generation (html2canvas)
- Transaction details
- QR codes
- Downloadable format

**Receipt Types**:
- Transfer receipts
- Bill payment receipts
- Card funding receipts
- Airtime receipts

---

### 15. AI Assistant

#### AI Features
**Integration**: Google Gemini API

**Flows**:
- **AI Assistant**: `src/ai/flows/ai-assistant-flow.ts`
- **Card Design**: `src/ai/flows/generate-card-design-flow.ts`
- **Receipt Images**: `src/ai/flows/generate-receipt-image-flow.ts`
- **Recommendations**: `src/ai/flows/personalized-recommendations-flow.ts`
- **TTS**: `src/ai/flows/tts-flow.ts`

**Usage**:
- Financial advice
- Transaction explanations
- Personalized recommendations
- Voice interactions

---

## Database Schema

### Core Tables

**users**:
- `id` (UUID, PK)
- `phone` (VARCHAR, unique)
- `account_number` (VARCHAR, unique)
- `full_name` (VARCHAR)
- `balance` (BIGINT, in kobo)
- `kyc_tier` (INTEGER)
- `transaction_pin_hash` (VARCHAR)
- `authorization_pin` (VARCHAR)
- `bvn_verified` (BOOLEAN)
- `selfie_verified` (BOOLEAN)

**financial_transactions**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `category` (VARCHAR) - transfer, payment, deposit, etc.
- `type` (VARCHAR) - debit, credit
- `amount` (BIGINT, in kobo)
- `reference` (VARCHAR, unique)
- `narration` (TEXT)
- `balance_after` (BIGINT)
- `party` (JSONB) - transaction party details
- `timestamp` (TIMESTAMPTZ)

**notifications**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `title` (VARCHAR)
- `body` (TEXT)
- `category` (VARCHAR)
- `read` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

**virtual_cards**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `vfd_card_id` (VARCHAR, unique)
- `masked_pan` (VARCHAR)
- `expiry_month` (VARCHAR)
- `expiry_year` (VARCHAR)
- `status` (VARCHAR) - active, blocked, failed
- `created_at` (TIMESTAMPTZ)

**card_requests**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `reference` (VARCHAR, unique)
- `status` (VARCHAR) - initiated, processing, completed, failed

**otp_verifications**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `phone` (VARCHAR)
- `otp_code` (VARCHAR)
- `expires_at` (TIMESTAMPTZ)
- `verified` (BOOLEAN)

---

## Security Features

### Authentication Security
- HMAC-SHA256 token signing
- Token expiration (configurable)
- Secure token storage (localStorage)
- Automatic token refresh

### PIN Security
- Hashed PIN storage (bcrypt)
- Rate limiting on PIN attempts
- Separate login and transaction PINs
- PIN validation middleware

### Transaction Security
- Idempotency checks (reference-based)
- Atomic database operations
- Row-level locking
- Balance validation
- Duplicate transaction prevention

### API Security
- CORS protection
- Security headers (X-Frame-Options, X-XSS-Protection)
- CSRF protection
- Request validation
- Error handling

---

## VFD Integration

### VFD Services

**Wallet Service** (`src/lib/vfd-wallet-service.ts`):
- Create wallet
- Get balance
- BVN verification
- Image matching
- AML screening

**Card Service** (`src/lib/vfd-card-service.ts`):
- Create virtual card
- Block/unblock card
- Card transactions

**Bills Service** (`src/lib/vfd-bills-service.ts`):
- Biller lookup
- Account validation
- Bill payment

**Transfer Service** (`src/lib/vfd-transfer.ts`):
- Internal transfers
- External transfers
- Transfer status

**Payment Processor** (`src/lib/vfd-processor.ts`):
- Payment initiation
- OTP validation
- Payment status
- Transaction logging

### VFD Authentication
- Token-based authentication
- Token caching
- Automatic token refresh
- JWT support

---

## Error Handling

### Error Types
- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found**: 404 Not Found
- **Server Errors**: 500 Internal Server Error

### Logging
- **Logger**: `src/lib/logger.ts`
- **Format**: JSON structured logs
- **Levels**: info, warn, error
- **Metadata**: User ID, transaction references, timestamps

---

## Testing

### Test Structure
- **Unit Tests**: `src/__tests__/`
- **Integration Tests**: `src/__tests__/integration/`
- **E2E Tests**: `e2e/` (Playwright)

### Test Coverage
- Financial operations
- Authentication flows
- Bill payments
- Card funding
- Internal transfers

---

## Deployment

### Environment Variables
**Required**:
- `AUTH_SECRET` - Token signing secret
- `SUPABASE_SERVICE_ROLE_KEY` - Database access
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

**Optional**:
- `VFD_ACCESS_TOKEN` - VFD API token
- `VFD_CONSUMER_KEY` - VFD consumer key
- `VFD_CONSUMER_SECRET` - VFD consumer secret
- `GEMINI_API_KEY` - AI features

### Build Process
- TypeScript compilation
- Next.js build
- Environment validation
- Linting and type checking

---

## Key Features Summary

✅ **Authentication**: Token-based with PIN support
✅ **Transfers**: Internal and external (VFD)
✅ **Payments**: Card funding, bill payments, airtime
✅ **Virtual Cards**: Create, manage, block
✅ **KYC**: BVN, selfie, OTP verification
✅ **Notifications**: Real-time via Supabase
✅ **Receipts**: PDF and image generation
✅ **AI Assistant**: Gemini integration
✅ **Webhooks**: VFD payment notifications
✅ **Balance Sync**: VFD wallet synchronization
✅ **Security**: Rate limiting, PIN validation, atomic transactions

---

## Future Enhancements

- Multi-currency support
- Investment products
- Loan management
- Savings goals
- Budgeting tools
- Merchant services
- Agent network management

---

## Conclusion

OVOMONIE is a comprehensive, production-ready fintech application with robust security, real-time features, and extensive payment integrations. The architecture follows best practices with atomic transactions, proper error handling, and scalable design patterns.


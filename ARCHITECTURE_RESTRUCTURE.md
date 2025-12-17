# Ovo Thrive App - Architecture Restructure

## Current Issues
1. **Mixed Database Usage**: Firebase and Supabase used inconsistently
2. **No Clear Data Flow**: Frontend → API → External Service → Database flow is unclear
3. **Inconsistent Response Formats**: Different APIs return different response structures
4. **Missing Middleware Layer**: No centralized request/response handling

## New Architecture: Supabase-First

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (React Components, Context, Hooks)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTES                               │
│  /api/[feature]/route.ts                                    │
│  - Authentication (getUserIdFromToken)                      │
│  - Input Validation                                         │
│  - Business Logic Orchestration                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   SUPABASE   │ │  EXTERNAL    │ │   FIREBASE   │
│   (PRIMARY)  │ │  SERVICES    │ │   (BACKUP)   │
│              │ │  - VFD       │ │              │
│  - Users     │ │  - Paystack  │ │  - Storage   │
│  - Txns      │ │              │ │  - Notifs    │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Standard Response Format

All API routes return:
```typescript
{
  ok: boolean;
  message?: string;
  data?: any;
  error?: string;
}
```

### Database Operations Priority

1. **Supabase (Primary)**: All CRUD operations
   - Users table
   - financial_transactions table
   - notifications table
   - All business data

2. **Firebase (Backup/Legacy)**: 
   - File storage only
   - Notifications (optional)
   - No financial data

### Flow Examples

#### Bill Payment Flow
```
Frontend Component (vfd-bill-payment.tsx)
    ↓ POST /api/bills/vfd
API Route (bills/vfd/route.ts)
    ↓ getUserIdFromToken() → Validate user
    ↓ Check duplicate in Supabase
    ↓ Call VFD API (vfd-bills.ts)
    ↓ Log transaction to Supabase
    ↓ Create notification in Supabase
    ↓ Return standardized response
Frontend
    ↓ Update UI
    ↓ Show receipt
```

#### Transfer Flow
```
Frontend Component
    ↓ POST /api/transfers/internal
API Route
    ↓ getUserIdFromToken() → Validate user
    ↓ Validate PIN
    ↓ Check balances in Supabase
    ↓ Update balances in Supabase (atomic)
    ↓ Log transactions in Supabase
    ↓ Create notifications in Supabase
    ↓ Return standardized response
Frontend
    ↓ Update balance in context
    ↓ Show receipt
```

## Implementation Plan

### Phase 1: Core Infrastructure
- [x] Standardize API response format
- [ ] Create Supabase service layer
- [ ] Remove Firebase from financial operations
- [ ] Centralize authentication

### Phase 2: API Routes
- [ ] Refactor all transfer routes
- [ ] Refactor bill payment routes
- [ ] Refactor transaction routes
- [ ] Add proper error handling

### Phase 3: Frontend
- [ ] Update all API calls to handle new format
- [ ] Remove Firebase client usage
- [ ] Update context providers

### Phase 4: Testing
- [ ] Test all payment flows
- [ ] Test all transfer flows
- [ ] Test error scenarios

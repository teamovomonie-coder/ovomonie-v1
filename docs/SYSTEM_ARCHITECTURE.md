# Ovomonie: Notification & Authorization System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OVOMONIE APPLICATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         TRANSFER FLOW (User A → User B)                       │
└──────────────────────────────────────────────────────────────────────────────┘

User A (Sender)                    Backend APIs                  Supabase/VFD
    │                                 │                              │
    ├─ Login (PIN)──────────────────>├─ POST /auth/login         │
    │                                 │                              │
    │<─────────Token──────────────────┤                              │
    │                                 │                              │
    ├─ Transfer Form                  │                              │
    │ (Amount, Recipient, TxnPin)     │                              │
    │                                 │                              │
    ├─ POST /transfers/internal      ├─ Get sender from DB───────>│
    │ {recipient, amount, PIN}        │<─ sender (phone, name, PIN)─┤
    │                                 │                              │
    │                                 ├─ Validate TxnPin ──────────>│
    │                                 │   verifySecret() ◄────────────┤
    │                                 │                              │
    │                                 ├─ Get recipient from DB───>│
    │                                 │<─ recipient (phone, name) ──┤
    │                                 │                              │
    │                                 ├─ Call VFD──────────────────>│
    │                                 │   processVFDInternalTransfer() VFD
    │                                 │                              │
    │                                 ├─ Update Balances ─────────>│
    │                                 │ (non-blocking backup)      │
    │                                 │                              │
    │                                 ├─ Create Transaction Log──>│
    │                                 │ (Audit trail)              │
    │                                 │                              │
    │                                 ├─ Create Notifications────>│
    │                                 │ (Both users)               │
    │                                 │   ├─ Event: INSERT        │
    │                                 │   └─ Broadcast via WebSocket
    │                                 │                              │
    │<─ Success Response ────────────┤                              │
    │ {recipientName, amount, ref}    │                              │
    │                                 │                              │
    │ [Notification Bell Updates]     │ [Real-time via Supabase]   │
    │ "Transfer Sent to John Doe"     │   postgres_changes event   │
    │                                 │                              │

User B (Recipient)
    │
    │ [Notification Bell Updates]
    │ "Transfer Received from Jane Smith"


┌──────────────────────────────────────────────────────────────────────────────┐
│                    WITHDRAWAL FLOW (User → Bank Account)                      │
└──────────────────────────────────────────────────────────────────────────────┘

User                              Backend APIs              Supabase/VFD
    │                                 │                        │
    ├─ Withdrawal Request             │                        │
    │ {amount, bankAccount,           │                        │
    │  loginPin, transactionPin}       │                        │
    │                                 │                        │
    ├─ POST /funding/withdraw ───────>├─ Get user from DB─────>│
    │                                 │<─ user (hash, balance)──│
    │                                 │                        │
    │                                 ├─ Validate Pins────────>│
    │                                 │   ├─ verifySecret(loginPin)
    │                                 │   └─ verifySecret(txnPin)
    │                                 │                        │
    │                                 ├─ Call VFD────────────>│
    │                                 │   withdrawal()    VFD │
    │                                 │                        │
    │                                 ├─ Update Balance──────>│
    │                                 │ (Supabase backup)     │
    │                                 │                        │
    │                                 ├─ Create Notification─>│
    │                                 │ "Withdrawal Complete" │
    │                                 │   Event: INSERT       │
    │                                 │   WebSocket push      │
    │                                 │                        │
    │<─ Success Response ────────────┤                        │
    │ {newBalance, timestamp}         │                        │
    │                                 │                        │
    │ [Notification Updates]          │ [Real-time via DB]    │
    │ "₦50,000 withdrawn to bank"     │                        │


┌──────────────────────────────────────────────────────────────────────────────┐
│                   REAL-TIME NOTIFICATION FLOW                                 │
└──────────────────────────────────────────────────────────────────────────────┘

Notification Context (React)
         │
         └─> useEffect on mount
             │
             ├─> Supabase Channel Subscribe
             │   channel: `notifications:${userId}`
             │   event: 'postgres_changes'
             │   filter: `user_id=eq.${userId}`
             │
             └─> Handlers:
                 ├─ INSERT → Add notification to state
                 ├─ UPDATE → Mark as read
                 └─ DELETE → Remove notification

Supabase Database Trigger
         │
         └─> INSERT INTO notifications
             │
             ├─> postgres_changes event emitted
             │
             └─> WebSocket broadcast to subscribers
                 │
                 └─> notification-context receives
                     └─> UI updates automatically


┌──────────────────────────────────────────────────────────────────────────────┐
│                   PIN VALIDATION ARCHITECTURE                                 │
└──────────────────────────────────────────────────────────────────────────────┘

Frontend (User Input)
    │
    ├─ Enters PIN: "1234" (plain text)
    │
    └─> API Call (HTTPS)
        │
        └─> Backend Endpoint
            │
            ├─> Receives PIN: "1234" (encrypted by HTTPS)
            │
            ├─> Validate PIN
            │   │
            │   └─> validateTransactionPin(pin, storedHash)
            │       │
            │       └─> verifySecret() [bcrypt compare]
            │           │
            │           ├─ Hash plain PIN on-the-fly
            │           ├─ Compare with stored hash
            │           └─ Return true/false
            │
            ├─> Decision:
            │   ├─ Valid → Process transaction
            │   │   ├─ Call VFD
            │   │   ├─ Update Supabase
            │   │   └─ Create notification
            │   │
            │   └─ Invalid → Return 401 Unauthorized
            │       └─ "Invalid PIN. Please try again."
            │
            └─> Never store/log plain PIN
                (Only hash used for comparison)


┌──────────────────────────────────────────────────────────────────────────────┐
│                    PIN TYPES & USAGE MATRIX                                   │
└──────────────────────────────────────────────────────────────────────────────┘

Operation               │  Login PIN  │  Transaction PIN  │  Required?
─────────────────────────┼─────────────┼──────────────────┼─────────────
User Registration       │     ✓       │        ✓          │   Both
User Login              │     ✓       │        ✗          │   Login PIN
P2P Transfer            │     ✗       │        ✓          │   Transaction
Deposit (Add Money)     │     ✓       │        ✗          │   Login PIN
Withdrawal              │     ✓       │        ✓          │   Both
Change Login PIN        │     ✓       │        ✗          │   Current Login
Change Transaction PIN  │     ✓       │        ✓          │   Current Txn PIN


┌──────────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                                        │
└──────────────────────────────────────────────────────────────────────────────┘

API Endpoint Receives Request
    │
    ├─ Validate Request (amount, reference, recipient)
    │   └─ Invalid → 400 Bad Request
    │
    ├─ Authenticate (JWT token)
    │   └─ Invalid → 401 Unauthorized
    │
    ├─ Fetch User from Database
    │   └─ Not found → 400 User not found
    │
    ├─ Validate PIN
    │   │
    │   ├─ PIN not provided → 400 PIN required
    │   │
    │   ├─ PIN invalid → 401 Invalid PIN
    │   │   └─ Log attempt for audit
    │   │
    │   └─ PIN valid → Continue
    │
    ├─ Business Logic Validation (balance, etc.)
    │   └─ Invalid → 400 Insufficient balance
    │
    ├─ Process Transaction (VFD)
    │   │
    │   ├─ VFD Success → Continue
    │   │
    │   ├─ VFD Timeout → Query status (retry)
    │   │
    │   └─ VFD Failure → 400 Transaction failed
    │
    ├─ Backup to Supabase (non-blocking)
    │   └─ Failure → Log warning (doesn't fail transaction)
    │
    └─> Response
        ├─ Success (200) → Transaction completed
        └─ Error (4xx/5xx) → User sees error message


┌──────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE STATE AFTER TRANSFER                              │
└──────────────────────────────────────────────────────────────────────────────┘

users table:
┌────────┬──────────┬──────────────────────┬─────────────┐
│ id     │ phone    │ full_name            │ balance     │
├────────┼──────────┼──────────────────────┼─────────────┤
│ user_a │ 2348.... │ Jane Smith           │ 950000 (↓50K)
│ user_b │ 2349.... │ John Doe             │ 150000 (↑50K)
└────────┴──────────┴──────────────────────┴─────────────┘

financial_transactions table:
┌────────┬──────────┬─────────┬────────┬──────┬──────────────────┐
│ user   │ category │ type    │ amount │ ref  │ narration        │
├────────┼──────────┼─────────┼────────┼──────┼──────────────────┤
│ user_a │ transfer │ debit   │ 50000  │ ref1 │ Transfer to Doe  │
│ user_b │ transfer │ credit  │ 50000  │ ref1 │ Transfer from SM │
└────────┴──────────┴─────────┴────────┴──────┴──────────────────┘

notifications table:
┌────────┬──────────────────────┬───────────────────────┬──────┐
│ user   │ title                │ description           │ read │
├────────┼──────────────────────┼───────────────────────┼──────┤
│ user_a │ Transfer Sent        │ ₦50,000 to John Doe   │ false│
│ user_b │ Transfer Received    │ ₦50,000 from Jane SM  │ false│
└────────┴──────────────────────┴───────────────────────┴──────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                    API RESPONSE EXAMPLES                                      │
└──────────────────────────────────────────────────────────────────────────────┘

Success: Transfer
───────────────────
{
  "message": "Transfer successful!",
  "data": {
    "recipientName": "John Doe",
    "amount": 50000,
    "reference": "TXN-20240115-001",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}

Error: Invalid PIN
───────────────────
HTTP 401 Unauthorized
{
  "message": "Invalid transaction PIN. Please try again."
}

Error: Insufficient Balance
───────────────────────────
HTTP 400 Bad Request
{
  "message": "Insufficient balance for this transfer."
}

Error: Recipient Not Found
──────────────────────────
HTTP 400 Bad Request
{
  "message": "Recipient account not found."
}


┌──────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION STRUCTURE                                     │
└──────────────────────────────────────────────────────────────────────────────┘

Transfer Sent (Sender):
┌──────────────┬──────────────────────────────────────────┐
│ title        │ "Transfer Sent"                          │
│ description  │ "₦50,000 sent to John Doe"             │
│ category     │ "transfer"                              │
│ type         │ "debit"                                 │
│ amount       │ 5000000 (in kobo)                       │
│ read         │ false                                   │
│ timestamp    │ 2024-01-15T10:30:45.123Z               │
└──────────────┴──────────────────────────────────────────┘

Transfer Received (Recipient):
┌──────────────┬──────────────────────────────────────────┐
│ title        │ "Transfer Received"                      │
│ description  │ "₦50,000 from Jane Smith"              │
│ category     │ "transfer"                              │
│ type         │ "credit"                                │
│ amount       │ 5000000 (in kobo)                       │
│ read         │ false                                   │
│ timestamp    │ 2024-01-15T10:30:45.123Z               │
└──────────────┴──────────────────────────────────────────┘

Deposit Successful:
┌──────────────┬──────────────────────────────────────────┐
│ title        │ "Deposit Successful"                     │
│ description  │ "₦100,000 added to your account"        │
│ category     │ "transaction"                           │
│ type         │ "credit"                                │
│ amount       │ 10000000 (in kobo)                      │
│ read         │ false                                   │
│ timestamp    │ 2024-01-15T10:31:00.456Z               │
└──────────────┴──────────────────────────────────────────┘

Withdrawal Complete:
┌──────────────┬──────────────────────────────────────────┐
│ title        │ "Withdrawal Complete"                    │
│ description  │ "₦50,000 withdrawn to your bank"       │
│ category     │ "transaction"                           │
│ type         │ "debit"                                 │
│ amount       │ 5000000 (in kobo)                       │
│ read         │ false                                   │
│ timestamp    │ 2024-01-15T10:32:15.789Z               │
└──────────────┴──────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                                           │
└──────────────────────────────────────────────────────────────────────────────┘

Frontend:
  • React 18+ with TypeScript
  • Supabase Client (@supabase/supabase-js)
  • Real-time WebSocket subscriptions
  • useContext API for state management

Backend:
  • Next.js 15.5.7 with App Router
  • Node.js 20.x runtime
  • TypeScript for type safety

Databases:
  • Supabase PostgreSQL (PRIMARY)
    - users, notifications, financial_transactions
    - Real-time postgres_changes events
  • VFD Payment Gateway (TRANSACTION PROCESSOR)
    - OAuth2 token-based authentication
    - RESTful API for transfers/deposits/withdrawals

Security:
  • HTTPS for all transports
  • JWT tokens for authentication
  • bcrypt hashing for PINs
  • Service Role Key (server-only)
  • Public Anon Key (client-safe)
  • Row-level Security (RLS) policies

Monitoring:
  • Request logging (logger utility)
  • PIN attempt tracking
  • Transaction audit trail
  • Error logging for debugging

```

---

## Key Integration Points

1. **Frontend → API**: HTTPS requests with JWT token
2. **API → Supabase**: Service Role Key (server-side)
3. **API → VFD**: OAuth2 client credentials flow
4. **API → Supabase Realtime**: postgres_changes events
5. **Frontend → Supabase Realtime**: WebSocket subscriptions
6. **Frontend → Notifications**: Real-time UI updates

---

## Deployment Considerations

- All environment variables configured in `.env.local`
- No new npm packages required
- Full backward compatibility maintained
- Can be deployed immediately after migrations
- Monitor real-time connections in production
- Set up error alerting for PIN validation failures


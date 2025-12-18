# Scripts Documentation

## Transaction Management Scripts

### View Transaction
View complete details of any transaction by ID or reference.

**Usage:**
```bash
npm run tx:view <transaction-id-or-reference>
```

**Example:**
```bash
npm run tx:view int-1766073463230
npm run tx:view 0718b755-92d6-4f9a-b0f4-d6ec9439a392
```

**Output:**
- Transaction ID, User ID, Type, Status
- Reference, Amount, Recipient, Bank
- Timestamps (created, updated, completed)
- Full transaction data (JSON)

### Update Transaction Status
Manually update the status of a transaction.

**Usage:**
```bash
npm run tx:update <transaction-id-or-reference> <status>
```

**Status Options:**
- `pending` - Transaction is waiting to be processed
- `processing` - Transaction is being processed
- `completed` - Transaction completed successfully
- `failed` - Transaction failed

**Example:**
```bash
npm run tx:update int-1766073463230 completed
npm run tx:update int-1766073463230 failed
```

## Authentication Scripts

### Fix Auth
Migrate legacy token parsing to standardized authentication.

**Usage:**
```bash
npm run fix:auth
```

## Requirements

All scripts require:
- `.env.local` file with Supabase credentials
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

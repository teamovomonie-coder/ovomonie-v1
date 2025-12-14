# Supabase Migration Guide

> Complete guide for migrating Ovomonie from Firestore to Supabase PostgreSQL backend

**Migration Date**: December 13, 2025  
**Database**: PostgreSQL via Supabase  
**Status**: Ready for Implementation

---

## Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new PostgreSQL project
3. Copy your **Project URL** and **Anon Key** from Settings → API
4. Copy your **Service Role Key** from the same location (keep it private!)

### 2. Update Environment Variables

Add to your `.env.local` and `.env`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: The Service Role Key should only be in `.env` (server-side) and never exposed to the client.

### 3. Run Database Migrations

1. Open Supabase SQL Editor
2. Copy the entire contents of [supabase-migrations.sql](supabase-migrations.sql)
3. Paste and execute in the SQL editor
4. Verify all tables are created

### 4. Test Connection

```bash
curl http://localhost:3000/api/health/supabase
```

Expected response:
```json
{
  "ok": true,
  "message": "Supabase connection healthy",
  "database": "PostgreSQL (Supabase)"
}
```

---

## Architecture

### Supabase Wrapper Pattern

The adapter layer (`src/lib/supabase-adapter.ts`) provides:

- **Firebase-compatible API**: Existing code continues to work unchanged
- **Automatic translation**: Firestore calls → PostgreSQL queries
- **Type safety**: Full TypeScript support
- **Real-time capabilities**: Supabase subscriptions for live updates

### File Structure

```
src/
├── lib/
│   ├── supabase.ts              # Client initialization
│   ├── supabase-adapter.ts      # Firebase ↔ Supabase bridge
│   ├── firebaseAdmin.ts         # Firebase Admin (keep for auth)
│   └── firebase.ts              # Client-side Firebase (keep for auth)
└── app/api/
    └── health/
        ├── firebase/            # Firebase health check
        └── supabase/            # Supabase health check (NEW)
```

---

## Migration Checklist

### Phase 1: Infrastructure (Completed ✅)
- [x] Remove MongoDB dependencies (`mongo.ts`, `mongo` health endpoint)
- [x] Add Supabase environment variables
- [x] Create Supabase wrapper/adapter
- [x] Create SQL migration script
- [x] Create Supabase health check endpoint

### Phase 2: Schema Setup
- [ ] Execute SQL migrations in Supabase
- [ ] Verify all tables and indexes created
- [ ] Set up RLS (Row Level Security) policies
- [ ] Create backup strategy

### Phase 3: Data Migration
- [ ] Export Firestore data to JSON
- [ ] Transform data to PostgreSQL format
- [ ] Bulk insert into Supabase
- [ ] Validate data integrity

### Phase 4: Feature Integration
- [ ] Update collection references if needed
- [ ] Test real-time features (notifications)
- [ ] Test transactions (loans, transfers)
- [ ] Test complex queries (filters, pagination)

### Phase 5: Testing & Deployment
- [ ] Run full test suite
- [ ] Load testing
- [ ] Canary deployment (10% traffic)
- [ ] Monitor error rates
- [ ] Full rollout

---

## Collection Mapping (Firestore → PostgreSQL)

| Firestore | PostgreSQL | Notes |
|-----------|-----------|-------|
| `users` | `users` | Core user table |
| `notifications` | `notifications` | Real-time notifications |
| `financialTransactions` | `financial_transactions` | Complete ledger |
| `loans` | `loans` | Loan tracking |
| `investments` | `investments` | Investment portfolio |
| `stockHoldings` | `stock_holdings` | Stock trading |
| `eventBookings` | `event_bookings` | Event reservations |
| `hotelBookings` | `hotel_bookings` | Hotel reservations |
| `flightBookings` | `flight_bookings` | Flight bookings |
| `rideBookings` | `ride_bookings` | Ride bookings |
| `communityPosts` | `community_posts` | Forum posts |
| `events` | `events` | Event management |
| `invoices` | `invoices` | Business invoicing |
| `products` | `products` | Inventory items |
| `suppliers` | `suppliers` | Vendor info |
| `categories` | `categories` | Product categories |
| `locations` | `locations` | Warehouse/store locations |
| `inventoryTransactions` | `inventory_transactions` | Stock movements |
| `supportTickets` | `support_tickets` | Customer support |
| `payrollBatches` | `payroll_batches` | Payroll processing |
| `posRequests` | `pos_requests` | POS terminal requests |

### Subcollections (Naming Convention: `parent_child`)

| Firestore | PostgreSQL |
|-----------|-----------|
| `users/{userId}/virtualCards` | `users_virtualCards` |
| `users/{userId}/cardOrders` | `users_cardOrders` |

---

## API Usage Examples

### Reading Data

```typescript
import { supabase } from '@/lib/supabase';

// Get a user by ID
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Get all user transactions
const { data: transactions } = await supabase
  .from('financial_transactions')
  .select('*')
  .eq('user_id', userId)
  .order('timestamp', { ascending: false });

// Complex query with filters
const { data: loans } = await supabase
  .from('loans')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'Active')
  .gte('start_date', '2024-01-01');
```

### Writing Data

```typescript
// Insert new record
const { data: newUser, error } = await supabase
  .from('users')
  .insert([{
    phone: '+2348012345678',
    full_name: 'John Doe',
    account_number: '1234567890',
    balance: 0,
    login_pin_hash: 'scrypt:hash',
    kyc_tier: 1,
    is_agent: false,
    status: 'active'
  }])
  .select()
  .single();

// Update record
const { error: updateError } = await supabase
  .from('users')
  .update({ balance: 50000000 })
  .eq('id', userId);

// Delete record
const { error: deleteError } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);
```

### Real-time Subscriptions

```typescript
// Subscribe to real-time changes
const subscription = supabase
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload.new);
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## Performance Optimization

### Indexes
All indexes are included in the migration script:
- Single-field indexes on commonly filtered columns
- Composite indexes for multi-column queries
- Timestamp indexes for ordering

### Connection Pooling
Supabase includes built-in connection pooling via PgBouncer. No configuration needed.

### Row Level Security (RLS)
Create RLS policies to ensure users can only access their own data:

```sql
-- Example: Users can only read their own records
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING (auth.uid() = id);
```

---

## Troubleshooting

### Connection Issues

**Error**: `SUPABASE_SERVICE_ROLE_KEY is not set`
- **Solution**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is in `.env` (server-side only)

**Error**: `Supabase connection failed`
- **Solution**: Verify URL and API keys are correct in Supabase dashboard

### Data Issues

**Missing tables after migration**
- **Solution**: Run SQL migration script again in Supabase SQL editor

**Timestamp mismatches**
- **Solution**: All timestamps use UTC. Convert on client if needed

---

## Security Best Practices

1. **Service Role Key**: Only in `.env`, never commit to git
2. **Anon Key**: Can be public, used for client-side operations
3. **RLS Policies**: Enable row-level security for sensitive tables
4. **Backups**: Supabase auto-backs up daily; configure retention
5. **SSL/TLS**: All connections encrypted by default

---

## Rollback Plan

If you need to rollback:

1. **Keep Firestore running** during initial migration
2. **Sync both** (Firestore and Supabase) for verification period
3. **If issues arise**: Switch API routes back to Firebase
4. **Delete Supabase data** only after validation period (2-4 weeks)

---

## Support & Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Reference](https://www.postgresql.org/docs/)
- [Supabase Database API](https://supabase.com/docs/reference/javascript/introduction)

---

## Next Steps

1. **Get Service Role Key** from user
2. **Update `.env` files** with credentials
3. **Run SQL migrations** in Supabase
4. **Test health endpoint**: `/api/health/supabase`
5. **Run full test suite** to verify all operations
6. **Deploy to staging** first
7. **Monitor and validate** before production rollout

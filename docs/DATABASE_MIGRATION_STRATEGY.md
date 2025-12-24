# Database Migration Strategy: Firebase to Supabase

## Current State
The application currently uses both Firebase Firestore and Supabase PostgreSQL, creating complexity and potential data inconsistencies.

## Migration Plan

### Phase 1: Immediate Actions (COMPLETED)
- ✅ Standardized database service layer in `src/lib/db.ts`
- ✅ Added proper error handling and logging
- ✅ Removed loose TypeScript types
- ✅ Created comprehensive test coverage

### Phase 2: Data Migration (REQUIRED)
1. **Audit Current Firebase Usage**
   - 80+ files currently    - Main collections: users, transactions, notifications, inventory, events, etc.

2. **Create Migration Scripts**
   ```bash
   # Export Firebase data
   npm run migrate:export-firebase
   
   # Import to Supabase
   npm run migrate:import-supabase
   
   # Verify data integrity
   npm run migrate:verify
   ```

3. **Update API Routes**
   - Replace Firebase imports with Supabase service calls
   - Update 50+ API route files
   - Maintain backward compatibility during transition

### Phase 3: Service Layer Consolidation (IN PROGRESS)
- ✅ Created unified database service in `src/lib/db.ts`
- ✅ Added proper TypeScript interfaces
- ⏳ Need to update all API routes to use new service layer

### Phase 4: Firebase Removal
1. Remove Firebase dependencies from package.json
2. Delete Firebase configuration files
3. Remove Firebase imports from all files
4. Update environment variables

## Required Supabase Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  account_number VARCHAR(20) UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0,
  kyc_tier INTEGER DEFAULT 0,
  is_agent BOOLEAN DEFAULT false,
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  login_pin_hash TEXT,
  transaction_pin_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial transactions table
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  category VARCHAR(50),
  type VARCHAR(10) CHECK (type IN ('debit', 'credit')),
  amount DECIMAL(15,2),
  reference VARCHAR(100) UNIQUE,
  narration TEXT,
  party_name VARCHAR(255),
  party_account VARCHAR(50),
  balance_after DECIMAL(15,2),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  body TEXT,
  category VARCHAR(50),
  type VARCHAR(50),
  amount DECIMAL(15,2),
  reference VARCHAR(100),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  recipient_name VARCHAR(255),
  sender_name VARCHAR(255),
  metadata JSONB
);
```

## Migration Commands

Add these to package.json:
```json
{
  "scripts": {
    "migrate:export-firebase": "node scripts/migrate-export-firebase.js",
    "migrate:import-supabase": "node scripts/migrate-import-supabase.js",
    "migrate:verify": "node scripts/migrate-verify.js",
    "migrate:cleanup": "node scripts/migrate-cleanup.js"
  }
}
```

## Risk Mitigation
1. **Backup Strategy**: Export all Firebase data before migration
2. **Rollback Plan**: Keep Firebase configuration until migration is verified
3. **Testing**: Comprehensive testing of all endpoints post-migration
4. **Monitoring**: Enhanced logging during migration period

## Timeline
- **Week 1**: Complete data export and Supabase schema setup
- **Week 2**: Migrate core API routes (auth, transactions, users)
- **Week 3**: Migrate remaining features (inventory, events, etc.)
- **Week 4**: Testing, verification, and Firebase cleanup

## Success Criteria
- ✅ All data successfully migrated to Supabase
- ✅ All API endpoints working with Supabase
- ✅ No Firebase dependencies remaining
- ✅ Performance maintained or improved
- ✅ All tests passing
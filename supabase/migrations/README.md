# Database Migrations

## Running Migrations

### Option 1: Supabase CLI (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref agzdjkhifsqsiowllnqa

# Run migrations
supabase db push
```

### Option 2: Manual SQL Execution
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/agzdjkhifsqsiowllnqa
2. Navigate to SQL Editor
3. Copy and paste the SQL from migration files in order
4. Execute each migration

### Option 3: Direct psql
```bash
psql "postgresql://postgres:[password]@db.agzdjkhifsqsiowllnqa.supabase.co:5432/postgres" -f supabase/migrations/20250101000000_create_saved_cards.sql
```

## Migration Files

- `20250101000000_create_saved_cards.sql` - Creates saved_cards table for storing tokenized payment cards

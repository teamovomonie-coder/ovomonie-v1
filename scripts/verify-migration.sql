-- ============================================================
-- VIRTUAL CARD SYSTEM - DATABASE VERIFICATION
-- Run this in Supabase SQL Editor to verify migration
-- ============================================================

-- Test 1: Check if tables exist
SELECT 
  '✅ Tables Check' as test,
  COUNT(*) as found,
  '3 expected' as expected
FROM information_schema.tables 
WHERE table_name IN ('card_requests', 'virtual_cards', 'card_transactions');

-- Test 2: List all virtual card tables
SELECT 
  '📋 Virtual Card Tables' as info,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_name IN ('card_requests', 'virtual_cards', 'card_transactions')
ORDER BY table_name;

-- Test 3: Check if functions exist
SELECT 
  '✅ Functions Check' as test,
  COUNT(*) as found,
  '3 expected' as expected
FROM information_schema.routines 
WHERE routine_name IN (
  'create_virtual_card_request',
  'complete_virtual_card_creation',
  'refund_card_creation'
);

-- Test 4: List all virtual card functions
SELECT 
  '📋 Virtual Card Functions' as info,
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines 
WHERE routine_name LIKE '%virtual_card%'
ORDER BY routine_name;

-- Test 5: Check indexes
SELECT 
  '📋 Indexes' as info,
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('card_requests', 'virtual_cards', 'card_transactions')
ORDER BY tablename, indexname;

-- Test 6: Check constraints
SELECT 
  '📋 Constraints' as info,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('card_requests', 'virtual_cards', 'card_transactions')
ORDER BY tc.table_name, tc.constraint_type;

-- Test 7: Sample data check (should be empty initially)
SELECT '📊 Data Check' as info;

SELECT 'card_requests' as table_name, COUNT(*) as row_count FROM card_requests
UNION ALL
SELECT 'virtual_cards', COUNT(*) FROM virtual_cards
UNION ALL
SELECT 'card_transactions', COUNT(*) FROM card_transactions;

-- ============================================================
-- EXPECTED RESULTS:
-- ============================================================
-- Test 1: found = 3
-- Test 2: 3 tables listed (card_requests, virtual_cards, card_transactions)
-- Test 3: found = 3
-- Test 4: 3 functions listed
-- Test 5: Multiple indexes per table
-- Test 6: Multiple constraints (PRIMARY KEY, CHECK, FOREIGN KEY)
-- Test 7: All counts = 0 (no data yet)
-- ============================================================

-- If any test fails, run the migration:
-- Copy content from: supabase/migrations/20250126000001_virtual_cards.sql
-- Paste here and execute

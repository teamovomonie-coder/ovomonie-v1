# Security Questions Feature - Manual Test Guide

## Prerequisites
1. Run the migration in Supabase SQL Editor:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/20250127000002_create_security_questions.sql`
   - Execute the SQL

2. Start the dev server:
   ```bash
   npm run dev
   ```

## Test Steps

### Test 1: Set Security Questions (First Time)
1. Login to the app
2. Navigate to Settings → Security Questions
3. Select 3 different security questions from the dropdowns
4. Enter answers for each question
5. Click "Save Questions"
6. **Expected**: Success toast appears, answers are cleared but questions remain selected
7. **Verify in Database**: Check `security_questions` table - should have 1 row with your user_id

### Test 2: Retrieve Existing Questions
1. Refresh the page or navigate away and back
2. **Expected**: The 3 questions you selected should be pre-populated in the dropdowns
3. **Expected**: Answer fields should be empty (for security)

### Test 3: Update Security Questions
1. Change one or more questions
2. Enter new answers
3. Click "Save Questions"
4. **Expected**: Success toast appears
5. **Verify in Database**: Check `security_questions` table - `updated_at` timestamp should be recent

### Test 4: Validation Tests
1. Try to save without filling all fields
   - **Expected**: Error toast "Please answer all security questions"

2. Try to select the same question twice
   - **Expected**: Error toast "Please select different questions"

3. Try to save without being logged in
   - **Expected**: 401 Unauthorized error

## Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- View all security questions (without hashed answers)
SELECT id, user_id, question1, question2, question3, created_at, updated_at 
FROM security_questions;

-- Verify answers are hashed (should see bcrypt hashes starting with $2a$)
SELECT user_id, 
       LEFT(answer1_hash, 20) as answer1_preview,
       LEFT(answer2_hash, 20) as answer2_preview,
       LEFT(answer3_hash, 20) as answer3_preview
FROM security_questions;
```

## API Testing (Optional)

Use the smoke test script:
1. Login and get your auth token from browser DevTools:
   - Open DevTools → Application → Local Storage
   - Copy the value of `ovo-auth-token`

2. Edit `smoke-test-security-questions.js`:
   - Replace `AUTH_TOKEN` with your actual token

3. Run the test:
   ```bash
   node smoke-test-security-questions.js
   ```

## Success Criteria
✅ Questions can be created and saved to database
✅ Questions are retrieved on page load
✅ Questions can be updated
✅ Answers are hashed with bcrypt (never stored in plain text)
✅ Validation prevents duplicate questions
✅ Validation requires all fields
✅ RLS policies prevent unauthorized access
✅ UI shows appropriate success/error messages

## Troubleshooting

**Issue**: "Unauthorized" error
- **Fix**: Make sure you're logged in and have a valid token

**Issue**: Database error
- **Fix**: Ensure migration was run successfully in Supabase

**Issue**: Questions not loading
- **Fix**: Check browser console for errors, verify API endpoint is accessible

**Issue**: Can't save questions
- **Fix**: Check that all 3 questions are different and all answers are filled

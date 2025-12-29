-- Create security_questions table
CREATE TABLE IF NOT EXISTS security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  question1 TEXT NOT NULL,
  answer1_hash TEXT NOT NULL,
  question2 TEXT NOT NULL,
  answer2_hash TEXT NOT NULL,
  question3 TEXT NOT NULL,
  answer3_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON security_questions(user_id);

-- Enable RLS
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own security questions" ON security_questions;
DROP POLICY IF EXISTS "Users can insert their own security questions" ON security_questions;
DROP POLICY IF EXISTS "Users can update their own security questions" ON security_questions;

-- RLS Policies
CREATE POLICY "Users can view their own security questions"
  ON security_questions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own security questions"
  ON security_questions FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own security questions"
  ON security_questions FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

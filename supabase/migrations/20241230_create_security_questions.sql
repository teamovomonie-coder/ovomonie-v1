-- Create security_questions table with proper UUID reference
CREATE TABLE IF NOT EXISTS security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question1 TEXT NOT NULL,
  answer1_hash TEXT NOT NULL,
  question2 TEXT NOT NULL,
  answer2_hash TEXT NOT NULL,
  question3 TEXT NOT NULL,
  answer3_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON security_questions(user_id);

-- Enable RLS
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY security_questions_select ON security_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY security_questions_insert ON security_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY security_questions_update ON security_questions
  FOR UPDATE USING (auth.uid() = user_id);
-- ============================================================
-- HighView SEP — AI Coach Tables
-- Run this in your Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================

-- Chat sessions (one per conversation)
CREATE TABLE IF NOT EXISTS ai_coach_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  scenario TEXT NOT NULL,
  name TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_coach_sessions(user_email, scenario);

-- Session notes (3-bullet summaries)
CREATE TABLE IF NOT EXISTS ai_coach_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  scenario TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_notes_user ON ai_coach_notes(user_email);

-- Student profiles (AI coaching preferences + living student model)
CREATE TABLE IF NOT EXISTS ai_coach_profiles (
  user_email TEXT PRIMARY KEY,
  field TEXT,
  target_role TEXT,
  school TEXT,
  student_model JSONB DEFAULT '{}'::jsonb,
  weekly_checkin_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly check-ins
CREATE TABLE IF NOT EXISTS ai_coach_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  followed_through TEXT,
  confidence_rating INTEGER,
  focus_this_week TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_checkins_user ON ai_coach_checkins(user_email);

-- Skill score snapshots (for sparkline history)
CREATE TABLE IF NOT EXISTS ai_coach_score_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  scenario TEXT NOT NULL,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_scores_user ON ai_coach_score_snapshots(user_email);

-- Migration: 20260908_question_reports.sql
-- Description: Create question_reports table with RLS policies and indexes for post-exam review reporting.

CREATE TABLE IF NOT EXISTS public.question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON public.question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON public.question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_attempt_id ON public.question_reports(attempt_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON public.question_reports(created_at DESC);

-- Unique index to prevent duplicate reports by the same student on the same attempt for the same question
CREATE UNIQUE INDEX IF NOT EXISTS uq_question_reports_user_attempt_question 
  ON public.question_reports(user_id, attempt_id, question_id);

-- Enable Row Level Security
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- Students can view their own reports
DROP POLICY IF EXISTS "Users can view own question reports" ON public.question_reports;
CREATE POLICY "Users can view own question reports"
  ON public.question_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Students can submit reports for themselves only
DROP POLICY IF EXISTS "Users can insert own question reports" ON public.question_reports;
CREATE POLICY "Users can insert own question reports"
  ON public.question_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins have full access (view, update status, add notes, manage)
DROP POLICY IF EXISTS "Admins have full access to question reports" ON public.question_reports;
CREATE POLICY "Admins have full access to question reports"
  ON public.question_reports
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

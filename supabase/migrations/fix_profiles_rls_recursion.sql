-- =========================================================================
-- EXAM CAGO MIGRATION: FIX PROFILES RLS INFINITE RECURSION
-- File: supabase/migrations/fix_profiles_rls_recursion.sql
-- =========================================================================
-- Root Cause:
-- Policies on public.profiles and related tables were querying public.profiles
-- via inline subqueries: (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin').
-- When evaluating RLS on public.profiles (or on public.subjects/chapters which check admin status),
-- PostgreSQL entered an infinite recursion loop (Error 42P17).
--
-- Solution:
-- 1. Create a trusted SECURITY DEFINER helper function public.is_admin() with a safe search_path.
--    Because it executes with the privileges of its owner (postgres), it queries public.profiles
--    without triggering Row Level Security, completely eliminating recursion.
-- 2. Drop all legacy/recursive admin policies across all application tables.
-- 3. Re-create clean, non-recursive RLS policies using public.is_admin(auth.uid()).
-- 4. Preserve full public catalog read access, student isolated access, and admin management.
-- 5. Guarantee RLS remains ENABLED on all tables.
-- =========================================================================

-- 1. SECURE HELPER FUNCTION: CHECK ADMIN ROLE WITHOUT RLS RECURSION
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  -- If not logged in, user cannot be admin
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Bypasses RLS because function is SECURITY DEFINER owned by postgres
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'admin'
  );
END;
$$;

-- Ensure ownership and execution permissions
ALTER FUNCTION public.is_admin(UUID) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

-- 2. CLEAN UP ALL LEGACY POLICIES ON public.profiles DYNAMICALLY
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. RECREATE CLEAN, NON-RECURSIVE POLICIES ON public.profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. CATALOG TABLES (subjects, chapters, exam_configs): PUBLIC READ + ADMIN FULL ACCESS
-- Subjects
DROP POLICY IF EXISTS "Public subjects read access" ON public.subjects;
DROP POLICY IF EXISTS "Admins have full access to subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins full access on subjects" ON public.subjects;

CREATE POLICY "Public subjects read access"
  ON public.subjects
  FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to subjects"
  ON public.subjects
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Chapters
DROP POLICY IF EXISTS "Public chapters read access" ON public.chapters;
DROP POLICY IF EXISTS "Admins have full access to chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins full access on chapters" ON public.chapters;

CREATE POLICY "Public chapters read access"
  ON public.chapters
  FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to chapters"
  ON public.chapters
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Exam Configs
DROP POLICY IF EXISTS "Public exam configs read access" ON public.exam_configs;
DROP POLICY IF EXISTS "Admins have full access to exam configs" ON public.exam_configs;
DROP POLICY IF EXISTS "Admins full access on exam_configs" ON public.exam_configs;

CREATE POLICY "Public exam configs read access"
  ON public.exam_configs
  FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to exam configs"
  ON public.exam_configs
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. QUESTION BANK TABLES: ADMIN ONLY (Students access strictly via RPC snapshots)
-- Questions
DROP POLICY IF EXISTS "Admins have full access to questions" ON public.questions;
DROP POLICY IF EXISTS "Admins full access on questions" ON public.questions;

CREATE POLICY "Admins have full access to questions"
  ON public.questions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Question Options
DROP POLICY IF EXISTS "Admins have full access to question options" ON public.question_options;
DROP POLICY IF EXISTS "Admins full access on question_options" ON public.question_options;

CREATE POLICY "Admins have full access to question options"
  ON public.question_options
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Scenario Questions
DROP POLICY IF EXISTS "Admins have full access to scenario questions" ON public.scenario_questions;
DROP POLICY IF EXISTS "Admins full access on scenario_questions" ON public.scenario_questions;

CREATE POLICY "Admins have full access to scenario questions"
  ON public.scenario_questions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Large Questions
DROP POLICY IF EXISTS "Admins have full access to large questions" ON public.large_questions;
DROP POLICY IF EXISTS "Admins full access on large_questions" ON public.large_questions;

CREATE POLICY "Admins have full access to large questions"
  ON public.large_questions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Bulk Imports
DROP POLICY IF EXISTS "Admins have full access to bulk imports" ON public.bulk_imports;
DROP POLICY IF EXISTS "Admins full access on bulk_imports" ON public.bulk_imports;

CREATE POLICY "Admins have full access to bulk imports"
  ON public.bulk_imports
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. STUDENT TOKEN & REFERRAL POLICIES
-- Token Accounts
DROP POLICY IF EXISTS "Users can view own token account" ON public.token_accounts;
DROP POLICY IF EXISTS "Admins have full access to token accounts" ON public.token_accounts;

CREATE POLICY "Users can view own token account"
  ON public.token_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to token accounts"
  ON public.token_accounts
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Token Transactions
DROP POLICY IF EXISTS "Users can view own token transactions" ON public.token_transactions;
DROP POLICY IF EXISTS "Admins have full access to token transactions" ON public.token_transactions;

CREATE POLICY "Users can view own token transactions"
  ON public.token_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to token transactions"
  ON public.token_transactions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins have full access to referrals" ON public.referrals;

CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Admins have full access to referrals"
  ON public.referrals
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. EXAM ATTEMPTS, ATTEMPT QUESTIONS, AND ATTEMPT ANSWERS POLICIES
-- Exam Attempts
DROP POLICY IF EXISTS "Users can view own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Users can insert own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Users can update own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Admins have full access to exam attempts" ON public.exam_attempts;

CREATE POLICY "Users can view own exam attempts"
  ON public.exam_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam attempts"
  ON public.exam_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam attempts"
  ON public.exam_attempts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to exam attempts"
  ON public.exam_attempts
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Attempt Questions
DROP POLICY IF EXISTS "Users can view attempt questions of their attempts" ON public.attempt_questions;
DROP POLICY IF EXISTS "Admins have full access to attempt questions" ON public.attempt_questions;

CREATE POLICY "Users can view attempt questions of their attempts"
  ON public.attempt_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE id = attempt_questions.attempt_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to attempt questions"
  ON public.attempt_questions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Attempt Answers
DROP POLICY IF EXISTS "Users can view and edit attempt answers of their attempts" ON public.attempt_answers;
DROP POLICY IF EXISTS "Admins have full access to attempt answers" ON public.attempt_answers;

CREATE POLICY "Users can view and edit attempt answers of their attempts"
  ON public.attempt_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE id = attempt_answers.attempt_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to attempt answers"
  ON public.attempt_answers
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 8. RE-AFFIRM ROW LEVEL SECURITY IS ENABLED ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.large_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_imports ENABLE ROW LEVEL SECURITY;

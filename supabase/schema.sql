-- EXAM CAGO Complete PostgreSQL Database Schema & Migration Script
-- Designed for Supabase with Row Level Security (RLS)

-- 1. EXTENSIONS & FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  chapter_number INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_subject_chapter_num UNIQUE(subject_id, chapter_number)
);

-- 5. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'scenario', 'large')),
  marks INT NOT NULL DEFAULT 2,
  explanation TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUESTION OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_letter TEXT NOT NULL CHECK (option_letter IN ('A', 'B', 'C', 'D')),
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_question_option_letter UNIQUE(question_id, option_letter)
);

-- 7. SCENARIO QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.scenario_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  scenario_title TEXT NOT NULL,
  scenario_text TEXT NOT NULL,
  sub_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LARGE QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.large_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  case_title TEXT NOT NULL,
  case_text TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'financial_statements' CHECK (template_type IN ('financial_statements', 'cash_flow', 'audit_report', 'other')),
  question_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXAM CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS public.exam_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'full_book' CHECK (exam_type IN ('chapter', 'full_book')),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  duration_minutes INT NOT NULL DEFAULT 90,
  mcq_count INT NOT NULL DEFAULT 0,
  mcq_marks_each INT NOT NULL DEFAULT 2,
  scenario_count INT NOT NULL DEFAULT 0,
  scenario_marks_each INT NOT NULL DEFAULT 15,
  large_count INT NOT NULL DEFAULT 0,
  large_marks_each INT NOT NULL DEFAULT 20,
  total_marks INT NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TOKEN ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.token_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 1 CHECK (balance >= 0),
  last_daily_claim_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TOKEN TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('welcome_bonus', 'daily_claim', 'exam_deduction', 'referral_bonus', 'admin_grant', 'refund')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  reward_tokens INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_no_self_referral CHECK (referrer_id <> referred_id)
);

-- 13. EXAM ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_config_id UUID NOT NULL REFERENCES public.exam_configs(id) ON DELETE RESTRICT,
  exam_type TEXT NOT NULL,
  title TEXT NOT NULL,
  total_questions INT NOT NULL,
  total_marks INT NOT NULL,
  duration_minutes INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'expired', 'cancelled')),
  score NUMERIC(5,2) DEFAULT 0,
  is_passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ATTEMPT QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.attempt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order INT NOT NULL,
  marks INT NOT NULL,
  question_snapshot JSONB NOT NULL,
  CONSTRAINT unique_attempt_order UNIQUE(attempt_id, question_order)
);

-- 15. ATTEMPT ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  text_answer TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_correct BOOLEAN,
  marks_obtained NUMERIC(5,2) DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_attempt_question UNIQUE(attempt_id, question_id)
);

-- 16. BULK IMPORTS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.bulk_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('xlsx', 'csv', 'json')),
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  invalid_rows INT NOT NULL DEFAULT 0,
  duplicate_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_questions_subject_chapter ON public.questions(subject_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_search ON public.questions(subject_id, chapter_id, is_active, question_type);
CREATE INDEX IF NOT EXISTS idx_questions_created ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON public.exam_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON public.attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- SEED THE 7 ICAB CERTIFICATE LEVEL SUBJECTS
INSERT INTO public.subjects (id, name, slug, code, description, display_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'Accounting', 'accounting', 'ACC', 'Financial accounting fundamentals, double-entry bookkeeping, trial balance, and financial statement preparation.', 1),
('a0000000-0000-0000-0000-000000000002', 'Management Information', 'management-information', 'MI', 'Cost accounting, budgeting, variance analysis, forecasting, and managerial decision support.', 2),
('a0000000-0000-0000-0000-000000000003', 'Business Technology and Finance', 'business-technology-and-finance', 'BTF', 'Business organizational structure, economic environment, financial markets, and business management.', 3),
('a0000000-0000-0000-0000-000000000004', 'Tax', 'tax', 'TAX', 'Income tax principles, corporate tax, withholding tax, VAT rules, and tax computation frameworks.', 4),
('a0000000-0000-0000-0000-000000000005', 'Assurance', 'assurance', 'ASR', 'Audit concepts, internal controls, audit evidence, professional ethics, and assurance engagement procedures.', 5),
('a0000000-0000-0000-0000-000000000006', 'Business Law', 'business-law', 'BLAW', 'Contract law, Companies Act framework, partnership laws, negotiable instruments, and commercial legal guidelines.', 6),
('a0000000-0000-0000-0000-000000000007', 'Information Technology', 'information-technology', 'IT', 'Information systems, computer hardware/software, cybersecurity, database management, and IT controls in business.', 7)
ON CONFLICT (name) DO NOTHING;

-- SEED DEFAULT EXAM CONFIGURATIONS
INSERT INTO public.exam_configs (subject_id, name, exam_type, duration_minutes, mcq_count, mcq_marks_each, scenario_count, scenario_marks_each, large_count, large_marks_each, total_marks) VALUES
('a0000000-0000-0000-0000-000000000001', 'Accounting Full Book Exam', 'full_book', 90, 40, 2, 0, 0, 1, 20, 100),
('a0000000-0000-0000-0000-000000000002', 'Management Information Full Book Exam', 'full_book', 90, 35, 2, 2, 15, 0, 0, 100),
('a0000000-0000-0000-0000-000000000003', 'Business Technology and Finance Full Book Exam', 'full_book', 90, 50, 2, 0, 0, 0, 0, 100),
('a0000000-0000-0000-0000-000000000004', 'Tax Full Book Exam', 'full_book', 90, 35, 2, 2, 15, 0, 0, 100),
('a0000000-0000-0000-0000-000000000005', 'Assurance Full Book Exam', 'full_book', 90, 50, 2, 0, 0, 0, 0, 100),
('a0000000-0000-0000-0000-000000000006', 'Business Law Full Book Exam', 'full_book', 60, 25, 2, 0, 0, 0, 0, 50),
('a0000000-0000-0000-0000-000000000007', 'Information Technology Full Book Exam', 'full_book', 60, 25, 2, 0, 0, 0, 0, 50)
ON CONFLICT DO NOTHING;

-- SEED CHAPTERS FOR EACH SUBJECT
INSERT INTO public.chapters (subject_id, name, slug, chapter_number, description) VALUES
('a0000000-0000-0000-0000-000000000001', 'Introduction to Accounting & Double Entry', 'intro-accounting-double-entry', 1, 'Basic accounting principles, debit/credit rules, and ledger recording.'),
('a0000000-0000-0000-0000-000000000001', 'Trial Balance & Rectification of Errors', 'trial-balance-rectification', 2, 'Extracting trial balances and adjusting journal entries for errors.'),
('a0000000-0000-0000-0000-000000000001', 'Financial Statements Preparation', 'financial-statements-prep', 3, 'Income statement, statement of financial position, and year-end adjustments.'),

('a0000000-0000-0000-0000-000000000002', 'Cost Classification and Behavior', 'cost-classification-behavior', 1, 'Direct vs indirect costs, fixed vs variable costs, and cost centers.'),
('a0000000-0000-0000-0000-000000000002', 'Budgeting and Control', 'budgeting-control', 2, 'Operational budgets, cash budgets, and flexible budgeting techniques.'),

('a0000000-0000-0000-0000-000000000003', 'Business Environment & Structure', 'business-environment-structure', 1, 'Types of business organizations and macroeconomic environment factors.'),

('a0000000-0000-0000-0000-000000000004', 'Basic Principles of Income Tax', 'basic-principles-income-tax', 1, 'Tax rates, assessment years, and total income calculations.'),

('a0000000-0000-0000-0000-000000000005', 'Audit Framework and Ethics', 'audit-framework-ethics', 1, 'IFAC code of ethics, audit objectives, and engagement letters.'),

('a0000000-0000-0000-0000-000000000006', 'Law of Contract', 'law-of-contract', 1, 'Offer, acceptance, consideration, legal capacity, and remedies for breach.'),

('a0000000-0000-0000-0000-000000000007', 'Information Systems & Data Management', 'information-systems-data', 1, 'Hardware, software, relational databases, and enterprise resource planning.')
ON CONFLICT DO NOTHING;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_imports ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: PUBLIC ACCESS FOR READ-ONLY DATA
CREATE POLICY "Public subjects read access" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public chapters read access" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Public exam configs read access" ON public.exam_configs FOR SELECT USING (true);

-- RLS POLICIES: PROFILES & TOKENS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own token account" ON public.token_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own token transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- RLS POLICIES: EXAM ATTEMPTS
CREATE POLICY "Users can view own exam attempts" ON public.exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exam attempts" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exam attempts" ON public.exam_attempts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view attempt questions of their attempts" ON public.attempt_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_questions.attempt_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view and edit attempt answers of their attempts" ON public.attempt_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
);

-- RLS POLICIES: ADMIN FULL ACCESS
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to question options" ON public.question_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to subjects" ON public.subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to chapters" ON public.chapters FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to exam configs" ON public.exam_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access to bulk imports" ON public.bulk_imports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- AUTOMATIC USER REGISTRATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_user_id UUID;
  provided_ref_code TEXT;
BEGIN
  -- Generate unique referral code (e.g. CAGO-XXXXXX)
  ref_code := 'CAGO-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 6));
  
  -- Extract optional referral code from metadata if present
  provided_ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF provided_ref_code IS NOT NULL AND provided_ref_code <> '' THEN
    SELECT id INTO referrer_user_id FROM public.profiles WHERE referral_code = provided_ref_code;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    ref_code,
    referrer_user_id
  );

  -- Create token account with 1 welcome token
  INSERT INTO public.token_accounts (user_id, balance)
  VALUES (NEW.id, 1);

  -- Record transaction for welcome bonus
  INSERT INTO public.token_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 1, 'welcome_bonus', 'Welcome bonus token on registration');

  -- Reward referrer if valid
  IF referrer_user_id IS NOT NULL AND referrer_user_id <> NEW.id THEN
    -- Add referral record
    INSERT INTO public.referrals (referrer_id, referred_id, reward_tokens, status)
    VALUES (referrer_user_id, NEW.id, 1, 'completed')
    ON CONFLICT (referred_id) DO NOTHING;

    -- Update referrer token balance
    UPDATE public.token_accounts
    SET balance = balance + 1
    WHERE user_id = referrer_user_id;

    -- Record referral transaction for referrer
    INSERT INTO public.token_transactions (user_id, amount, transaction_type, description)
    VALUES (referrer_user_id, 1, 'referral_bonus', 'Bonus token for referring new student: ' || NEW.email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER ON AUTH USERS INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ATOMIC EXAM LAUNCHER RPC FUNCTION
CREATE OR REPLACE FUNCTION public.start_exam_attempt_rpc(
  p_user_id UUID,
  p_subject_id UUID,
  p_exam_config_id UUID,
  p_chapter_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INT;
  v_config RECORD;
  v_attempt_id UUID;
  v_mcq_req INT;
  v_scenario_req INT;
  v_large_req INT;
  v_mcq_count INT;
  v_scenario_count INT;
  v_large_count INT;
  v_mcq_record RECORD;
  v_scen_record RECORD;
  v_large_record RECORD;
  v_order INT := 1;
  v_started_at TIMESTAMPTZ := NOW();
  v_expires_at TIMESTAMPTZ;
  v_sanitized_snapshot JSONB;
  v_sanitized_options JSONB;
BEGIN
  -- A. Lock token account row to prevent concurrent race conditions
  SELECT balance INTO v_balance
  FROM public.token_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient token balance. You need at least 1 token to attempt an exam.'
    );
  END IF;

  -- B. Fetch Exam Configuration
  SELECT * INTO v_config
  FROM public.exam_configs
  WHERE id = p_exam_config_id AND is_active = true;

  IF v_config.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or inactive exam configuration.'
    );
  END IF;

  v_mcq_req := COALESCE(v_config.mcq_count, 0);
  v_scenario_req := COALESCE(v_config.scenario_count, 0);
  v_large_req := COALESCE(v_config.large_count, 0);

  -- C. Validate MCQ availability
  IF v_mcq_req > 0 THEN
    IF p_chapter_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_mcq_count
      FROM public.questions
      WHERE subject_id = p_subject_id AND chapter_id = p_chapter_id AND is_active = true AND question_type = 'mcq';
    ELSE
      SELECT COUNT(*) INTO v_mcq_count
      FROM public.questions
      WHERE subject_id = p_subject_id AND is_active = true AND question_type = 'mcq';
    END IF;

    IF v_mcq_count < v_mcq_req THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Not enough active MCQs available (%s required, %s found). Cannot start exam.', v_mcq_req, v_mcq_count)
      );
    END IF;
  END IF;

  -- D. Validate Scenario questions availability
  IF v_scenario_req > 0 THEN
    SELECT COUNT(*) INTO v_scenario_count
    FROM public.questions
    WHERE subject_id = p_subject_id AND is_active = true AND question_type = 'scenario';

    IF v_scenario_count < v_scenario_req THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Not enough active scenario case studies available (%s required, %s found). Cannot start exam.', v_scenario_req, v_scenario_count)
      );
    END IF;
  END IF;

  -- E. Validate Large accounting questions availability
  IF v_large_req > 0 THEN
    SELECT COUNT(*) INTO v_large_count
    FROM public.questions
    WHERE subject_id = p_subject_id AND is_active = true AND question_type = 'large';

    IF v_large_count < v_large_req THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Not enough active 20-mark accounting problem sets available (%s required, %s found). Cannot start exam.', v_large_req, v_large_count)
      );
    END IF;
  END IF;

  -- F. Deduct 1 Token atomically
  UPDATE public.token_accounts
  SET balance = balance - 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.token_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'exam_deduction', 'Attempting exam: ' || v_config.name);

  -- G. Calculate server deadlines
  v_expires_at := v_started_at + (v_config.duration_minutes || ' minutes')::interval;

  -- H. Create Exam Attempt Record
  INSERT INTO public.exam_attempts (
    user_id,
    subject_id,
    exam_config_id,
    exam_type,
    title,
    total_questions,
    total_marks,
    duration_minutes,
    started_at,
    expires_at,
    status
  )
  VALUES (
    p_user_id,
    p_subject_id,
    p_exam_config_id,
    v_config.exam_type,
    v_config.name,
    v_mcq_req + v_scenario_req + v_large_req,
    v_config.total_marks,
    v_config.duration_minutes,
    v_started_at,
    v_expires_at,
    'in_progress'
  )
  RETURNING id INTO v_attempt_id;

  -- I. Select & Insert MCQs with sanitized options (NO is_correct exposed)
  IF v_mcq_req > 0 THEN
    FOR v_mcq_record IN
      SELECT q.id, q.question_text, q.marks, q.explanation
      FROM public.questions q
      WHERE q.subject_id = p_subject_id
        AND (p_chapter_id IS NULL OR q.chapter_id = p_chapter_id)
        AND q.is_active = true
        AND q.question_type = 'mcq'
      ORDER BY RANDOM()
      LIMIT v_mcq_req
    LOOP
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', opt.id,
          'option_letter', opt.option_letter,
          'option_text', opt.option_text
        ) ORDER BY opt.option_letter ASC
      ) INTO v_sanitized_options
      FROM public.question_options opt
      WHERE opt.question_id = v_mcq_record.id;

      v_sanitized_snapshot := jsonb_build_object(
        'id', v_mcq_record.id,
        'question_text', v_mcq_record.question_text,
        'question_type', 'mcq',
        'marks', v_mcq_record.marks,
        'explanation', v_mcq_record.explanation,
        'options', COALESCE(v_sanitized_options, '[]'::jsonb)
      );

      INSERT INTO public.attempt_questions (attempt_id, question_id, question_order, marks, question_snapshot)
      VALUES (v_attempt_id, v_mcq_record.id, v_order, v_config.mcq_marks_each, v_sanitized_snapshot);

      v_order := v_order + 1;
    END LOOP;
  END IF;

  -- J. Select & Insert Scenario Questions
  IF v_scenario_req > 0 THEN
    FOR v_scen_record IN
      SELECT q.id, q.question_text, q.marks, sq.scenario_title, sq.scenario_text, sq.sub_questions
      FROM public.questions q
      JOIN public.scenario_questions sq ON sq.question_id = q.id
      WHERE q.subject_id = p_subject_id AND q.is_active = true AND q.question_type = 'scenario'
      ORDER BY RANDOM()
      LIMIT v_scenario_req
    LOOP
      v_sanitized_snapshot := jsonb_build_object(
        'id', v_scen_record.id,
        'question_text', v_scen_record.question_text,
        'question_type', 'scenario',
        'marks', v_config.scenario_marks_each,
        'scenario_title', v_scen_record.scenario_title,
        'scenario_text', v_scen_record.scenario_text,
        'sub_questions', v_scen_record.sub_questions
      );

      INSERT INTO public.attempt_questions (attempt_id, question_id, question_order, marks, question_snapshot)
      VALUES (v_attempt_id, v_scen_record.id, v_order, v_config.scenario_marks_each, v_sanitized_snapshot);

      v_order := v_order + 1;
    END LOOP;
  END IF;

  -- K. Select & Insert Large Accounting Questions
  IF v_large_req > 0 THEN
    FOR v_large_record IN
      SELECT q.id, q.question_text, q.marks, lq.case_title, lq.case_text, lq.template_type, lq.question_data
      FROM public.questions q
      JOIN public.large_questions lq ON lq.question_id = q.id
      WHERE q.subject_id = p_subject_id AND q.is_active = true AND q.question_type = 'large'
      ORDER BY RANDOM()
      LIMIT v_large_req
    LOOP
      v_sanitized_snapshot := jsonb_build_object(
        'id', v_large_record.id,
        'question_text', v_large_record.question_text,
        'question_type', 'large',
        'marks', v_config.large_marks_each,
        'case_title', v_large_record.case_title,
        'case_text', v_large_record.case_text,
        'template_type', v_large_record.template_type,
        'question_data', v_large_record.question_data
      );

      INSERT INTO public.attempt_questions (attempt_id, question_id, question_order, marks, question_snapshot)
      VALUES (v_attempt_id, v_large_record.id, v_order, v_config.large_marks_each, v_sanitized_snapshot);

      v_order := v_order + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id
  );
END;
$$;


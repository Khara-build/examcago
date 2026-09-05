-- EXAM CAGO Phase 3 Migration Script
-- Production Exam Engine RPC and Anti-Cheat Question Snapshot Sanitization

-- 1. UPDATE EXAM ATTEMPTS STATUS CONSTRAINT
ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_status_check;
ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_status_check 
  CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'expired', 'cancelled'));

-- 2. CREATE ATOMIC EXAM LAUNCHER RPC FUNCTION
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

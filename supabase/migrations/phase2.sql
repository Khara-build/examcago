-- EXAM CAGO Phase 2 Migration Script
-- Adds Indexes, Duplicate Column, and Atomic Batch Import Function

-- 1. ADD DUPLICATE ROWS COLUMN TO BULK IMPORTS
ALTER TABLE public.bulk_imports ADD COLUMN IF NOT EXISTS duplicate_rows INT NOT NULL DEFAULT 0;

-- 2. CREATE INDEXES FOR FAST SEARCHING AND PAGINATION
CREATE INDEX IF NOT EXISTS idx_questions_search ON public.questions(subject_id, chapter_id, is_active, question_type);
CREATE INDEX IF NOT EXISTS idx_questions_created ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_num ON public.chapters(subject_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_exam_configs_subject ON public.exam_configs(subject_id, is_active);

-- 3. ATOMIC BULK IMPORT PL/PGSQL FUNCTION
CREATE OR REPLACE FUNCTION public.import_mcq_batch(
  p_admin_id UUID,
  p_file_name TEXT,
  p_file_type TEXT,
  p_total_rows INT,
  p_valid_rows INT,
  p_invalid_rows INT,
  p_duplicate_rows INT,
  p_rows JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_import_id UUID;
  v_imported_count INT := 0;
  v_row JSONB;
  v_q_id UUID;
  v_correct_letter TEXT;
BEGIN
  -- Insert audit log header
  INSERT INTO public.bulk_imports (
    admin_id, file_name, file_type, total_rows, valid_rows, invalid_rows, duplicate_rows, imported_rows, status
  ) VALUES (
    p_admin_id, p_file_name, p_file_type, p_total_rows, p_valid_rows, p_invalid_rows, p_duplicate_rows, 0, 'processing'
  ) RETURNING id INTO v_import_id;

  -- Atomic Loop through all rows
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    -- Insert question
    INSERT INTO public.questions (
      subject_id,
      chapter_id,
      question_text,
      question_type,
      marks,
      explanation,
      is_active
    ) VALUES (
      (v_row->>'subject_id')::UUID,
      CASE WHEN (v_row->>'chapter_id') IS NOT NULL AND (v_row->>'chapter_id') <> '' THEN (v_row->>'chapter_id')::UUID ELSE NULL END,
      v_row->>'question_text',
      'mcq',
      COALESCE((v_row->>'marks')::INT, 2),
      v_row->>'explanation',
      TRUE
    ) RETURNING id INTO v_q_id;

    v_correct_letter := UPPER(v_row->>'correct_answer');

    -- Insert options A, B, C, D
    INSERT INTO public.question_options (question_id, option_letter, option_text, is_correct)
    VALUES
      (v_q_id, 'A', v_row->>'option_a', v_correct_letter = 'A'),
      (v_q_id, 'B', v_row->>'option_b', v_correct_letter = 'B'),
      (v_q_id, 'C', v_row->>'option_c', v_correct_letter = 'C'),
      (v_q_id, 'D', v_row->>'option_d', v_correct_letter = 'D');

    v_imported_count := v_imported_count + 1;
  END LOOP;

  -- Finalize audit log
  UPDATE public.bulk_imports
  SET imported_rows = v_imported_count,
      status = 'completed'
  WHERE id = v_import_id;

  RETURN jsonb_build_object(
    'success', true,
    'import_id', v_import_id,
    'imported_count', v_imported_count
  );
EXCEPTION WHEN OTHERS THEN
  -- PL/pgSQL automatically rolls back all inserts in this transaction if an exception occurs
  RAISE EXCEPTION 'Atomic import transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

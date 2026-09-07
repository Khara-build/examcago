-- Special Question Architecture Migration
-- Adds Mode A (Standard 50 MCQ) and Mode B (Special Questions ON) configurations
-- for Accounting, Management Information, and Taxation.

-- 1. Update Mode A Full Book Exam Configs (50 MCQ * 2 = 100 marks, 90 mins)
UPDATE public.exam_configs
SET 
  mcq_count = 50,
  mcq_marks_each = 2,
  scenario_count = 0,
  large_count = 0,
  total_marks = 100,
  duration_minutes = 90
WHERE id IN (
  'b0000000-0000-0000-0000-000000000001', -- Accounting Mode A
  'b0000000-0000-0000-0000-000000000002', -- Management Information Mode A
  'b0000000-0000-0000-0000-000000000004'  -- Taxation Mode A
);

-- 2. Insert Mode B Full Book Exam Configs (Special Questions ON)
INSERT INTO public.exam_configs (
  id,
  subject_id,
  name,
  exam_type,
  duration_minutes,
  mcq_count,
  mcq_marks_each,
  scenario_count,
  scenario_marks_each,
  large_count,
  large_marks_each,
  total_marks,
  is_active
)
VALUES
  -- Accounting Mode B: 40 MCQ (80 marks) + 1 Large (20 marks) = 100 marks
  (
    'b0000000-0000-0000-0001-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Accounting Full Book Exam (with Large Question)',
    'full_book',
    90,
    40,
    2,
    0,
    15,
    1,
    20,
    100,
    true
  ),
  -- MI Mode B: 35 MCQ (70 marks) + 2 Scenarios (30 marks) = 100 marks
  (
    'b0000000-0000-0000-0001-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Management Information Full Book Exam (with Scenarios)',
    'full_book',
    90,
    35,
    2,
    2,
    15,
    0,
    20,
    100,
    true
  ),
  -- Taxation Mode B: 35 MCQ (70 marks) + 2 Scenarios (30 marks) = 100 marks
  (
    'b0000000-0000-0000-0001-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'Taxation Full Book Exam (with Scenarios)',
    'full_book',
    90,
    35,
    2,
    2,
    15,
    0,
    20,
    100,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  mcq_count = EXCLUDED.mcq_count,
  scenario_count = EXCLUDED.scenario_count,
  large_count = EXCLUDED.large_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes,
  is_active = EXCLUDED.is_active;

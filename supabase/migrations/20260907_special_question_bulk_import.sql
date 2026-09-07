-- Special Question Bulk Import Support Migration
-- Idempotent, non-destructive schema additions for Special Question imports and audit tracking.
-- DO NOT EXECUTE MANUALLY UNLESS EXPLICITLY DIRECTED.

-- 1. Extend bulk_imports table to track question_type ('mcq', 'accounting_large', 'scenario')
ALTER TABLE public.bulk_imports 
ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq';

-- 2. Performance indexes for Special Question lookups
CREATE INDEX IF NOT EXISTS idx_large_questions_question_id 
ON public.large_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_scenario_questions_question_id 
ON public.scenario_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_questions_special_type_active 
ON public.questions(subject_id, question_type, is_active);

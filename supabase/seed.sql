-- =========================================================================
-- EXAM CAGO — ICAB CERTIFICATE LEVEL SEED DATA SCRIPT
-- Safe & Idempotent (Can be executed multiple times without duplicating data)
-- =========================================================================

-- 1. SEED 7 ICAB CERTIFICATE LEVEL SUBJECTS
INSERT INTO public.subjects (id, name, slug, code, description, display_order, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Accounting', 'accounting', 'ACC', 'Financial accounting fundamentals, double-entry bookkeeping, trial balance, and financial statement preparation.', 1, true),
('a0000000-0000-0000-0000-000000000002', 'Management Information', 'management-information', 'MI', 'Cost accounting, budgeting, variance analysis, forecasting, and managerial decision support.', 2, true),
('a0000000-0000-0000-0000-000000000003', 'Business Technology and Finance', 'business-technology-and-finance', 'BTF', 'Business organizational structure, economic environment, financial markets, and business management.', 3, true),
('a0000000-0000-0000-0000-000000000004', 'Tax', 'tax', 'TAX', 'Income tax principles, corporate tax, withholding tax, VAT rules, and tax computation frameworks.', 4, true),
('a0000000-0000-0000-0000-000000000005', 'Assurance', 'assurance', 'ASR', 'Audit concepts, internal controls, audit evidence, professional ethics, and assurance engagement procedures.', 5, true),
('a0000000-0000-0000-0000-000000000006', 'Business Law', 'business-law', 'BLAW', 'Contract law, Companies Act framework, partnership laws, negotiable instruments, and commercial legal guidelines.', 6, true),
('a0000000-0000-0000-0000-000000000007', 'Information Technology', 'information-technology', 'IT', 'Information systems, computer hardware/software, cybersecurity, database management, and IT controls in business.', 7, true)
ON CONFLICT (name) DO NOTHING;

-- 2. SEED DEFAULT EXAM CONFIGURATIONS
INSERT INTO public.exam_configs (subject_id, name, exam_type, duration_minutes, mcq_count, mcq_marks_each, scenario_count, scenario_marks_each, large_count, large_marks_each, total_marks, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Accounting Full Book Exam', 'full_book', 90, 40, 2, 0, 0, 1, 20, 100, true),
('a0000000-0000-0000-0000-000000000002', 'Management Information Full Book Exam', 'full_book', 90, 35, 2, 2, 15, 0, 0, 100, true),
('a0000000-0000-0000-0000-000000000003', 'Business Technology and Finance Full Book Exam', 'full_book', 90, 50, 2, 0, 0, 0, 0, 100, true),
('a0000000-0000-0000-0000-000000000004', 'Tax Full Book Exam', 'full_book', 90, 35, 2, 2, 15, 0, 0, 100, true),
('a0000000-0000-0000-0000-000000000005', 'Assurance Full Book Exam', 'full_book', 90, 50, 2, 0, 0, 0, 0, 100, true),
('a0000000-0000-0000-0000-000000000006', 'Business Law Full Book Exam', 'full_book', 60, 25, 2, 0, 0, 0, 0, 50, true),
('a0000000-0000-0000-0000-000000000007', 'Information Technology Full Book Exam', 'full_book', 60, 25, 2, 0, 0, 0, 0, 50, true)
ON CONFLICT DO NOTHING;

-- 3. SEED CHAPTERS FOR EACH SUBJECT
INSERT INTO public.chapters (id, subject_id, name, slug, chapter_number, description, is_active) VALUES
-- Accounting Chapters
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Introduction to Accounting & Double Entry', 'intro-accounting-double-entry', 1, 'Basic accounting principles, debit/credit rules, and ledger recording.', true),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Trial Balance & Rectification of Errors', 'trial-balance-rectification', 2, 'Extracting trial balances and adjusting journal entries for errors.', true),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Financial Statements Preparation', 'financial-statements-prep', 3, 'Income statement, statement of financial position, and year-end adjustments.', true),

-- Management Information Chapters
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Cost Classification and Behavior', 'cost-classification-behavior', 1, 'Direct vs indirect costs, fixed vs variable costs, and cost centers.', true),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Budgeting and Control', 'budgeting-control', 2, 'Operational budgets, cash budgets, and flexible budgeting techniques.', true),

-- Business Technology & Finance
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'Business Environment & Structure', 'business-environment-structure', 1, 'Types of business organizations and macroeconomic environment factors.', true),

-- Tax
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'Basic Principles of Income Tax', 'basic-principles-income-tax', 1, 'Tax rates, assessment years, and total income calculations.', true),

-- Assurance
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005', 'Audit Framework and Ethics', 'audit-framework-ethics', 1, 'IFAC code of ethics, audit objectives, and engagement letters.', true),

-- Business Law
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000006', 'Law of Contract', 'law-of-contract', 1, 'Offer, acceptance, consideration, legal capacity, and remedies for breach.', true),

-- Information Technology
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000007', 'Information Systems & Data Management', 'information-systems-data', 1, 'Hardware, software, relational databases, and enterprise resource planning.', true)
ON CONFLICT (subject_id, chapter_number) DO NOTHING;

-- 4. VERIFICATION QUERY (Will output the counts)
SELECT 
  (SELECT COUNT(*) FROM public.subjects) AS total_subjects,
  (SELECT COUNT(*) FROM public.chapters) AS total_chapters,
  (SELECT COUNT(*) FROM public.exam_configs) AS total_exam_configs;

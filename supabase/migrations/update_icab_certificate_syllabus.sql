-- =========================================================================
-- EXAM CAGO MIGRATION: FINAL ICAB CERTIFICATE LEVEL SYLLABUS UPDATE (85 CHAPTERS)
-- File: supabase/migrations/update_icab_certificate_syllabus.sql
-- =========================================================================
-- Subject Summary (7 Subjects):
-- 1. Accounting: 15 chapters
-- 2. Management Information: 11 chapters
-- 3. Business Technology and Finance: 14 chapters
-- 4. Taxation: 24 chapters (renamed from "Tax")
-- 5. Assurance: 16 chapters
-- 6. Business Law: 4 chapters
-- 7. Information Technology: 1 chapter ("IT PRO MAX")
-- Total Chapters: 85
-- =========================================================================

BEGIN;

-- 1. UPSERT THE 7 ICAB CERTIFICATE LEVEL SUBJECTS
INSERT INTO public.subjects (id, name, slug, code, description, display_order, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Accounting', 'accounting', 'ACC', 'Financial accounting fundamentals, double-entry bookkeeping, trial balance, and financial statement preparation.', 1, true),
('a0000000-0000-0000-0000-000000000002', 'Management Information', 'management-information', 'MI', 'Cost accounting, budgeting, variance analysis, forecasting, and managerial decision support.', 2, true),
('a0000000-0000-0000-0000-000000000003', 'Business Technology and Finance', 'business-technology-and-finance', 'BTF', 'Business organizational structure, economic environment, financial markets, and business management.', 3, true),
('a0000000-0000-0000-0000-000000000004', 'Taxation', 'taxation', 'TAX', 'Income tax principles, corporate tax, withholding tax, VAT rules, and tax computation frameworks.', 4, true),
('a0000000-0000-0000-0000-000000000005', 'Assurance', 'assurance', 'ASR', 'Audit concepts, internal controls, audit evidence, professional ethics, and assurance engagement procedures.', 5, true),
('a0000000-0000-0000-0000-000000000006', 'Business Law', 'business-law', 'BLAW', 'Contract law, Companies Act framework, partnership laws, negotiable instruments, and commercial legal guidelines.', 6, true),
('a0000000-0000-0000-0000-000000000007', 'Information Technology', 'information-technology', 'IT', 'Information systems, computer hardware/software, cybersecurity, database management, and IT controls in business.', 7, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 2. UPDATE EXAM CONFIGURATION FOR TAXATION (PRESERVING PARAMETERS)
UPDATE public.exam_configs
SET name = 'Taxation Full Book Exam'
WHERE id = 'b0000000-0000-0000-0000-000000000004';

-- 3. SAFE CLEANUP OF OBSOLETE CHAPTERS (NON-DESTRUCTIVE TO EXISTING QUESTIONS)
DO $$
DECLARE
  v_questions_count INT;
BEGIN
  SELECT COUNT(*) INTO v_questions_count FROM public.questions WHERE chapter_id IS NOT NULL;
  
  IF v_questions_count = 0 THEN
    -- If no questions depend on chapters, wipe obsolete chapters safely
    DELETE FROM public.chapters;
  ELSE
    -- If questions exist, only remove chapters that are unreferenced
    DELETE FROM public.chapters
    WHERE id NOT IN (
      SELECT id FROM public.questions WHERE chapter_id IS NOT NULL
    )
    AND id LIKE 'c0000000-0000-0000-0000-%';
  END IF;
END $$;

-- 4. UPSERT EXACT 85 CHAPTERS (DETERMINISTIC UUIDS & NUMBERING)
INSERT INTO public.chapters (id, subject_id, name, slug, chapter_number, is_active) VALUES
-- Accounting Chapters (15)
('c0000000-0000-0000-0001-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Introduction to accounting', 'introduction-to-accounting', 1, true),
('c0000000-0000-0000-0001-000000000002', 'a0000000-0000-0000-0000-000000000001', 'The accounting equation', 'the-accounting-equation', 2, true),
('c0000000-0000-0000-0001-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Recording financial transactions', 'recording-financial-transactions', 3, true),
('c0000000-0000-0000-0001-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Ledger accounting and double entry', 'ledger-accounting-and-double-entry', 4, true),
('c0000000-0000-0000-0001-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Preparing basic financial statements', 'preparing-basic-financial-statements', 5, true),
('c0000000-0000-0000-0001-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Errors and corrections to accounting records and financial statements', 'errors-and-corrections-to-accounting-records-and-financial-statements', 6, true),
('c0000000-0000-0000-0001-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Cost of sales and inventories', 'cost-of-sales-and-inventories', 7, true),
('c0000000-0000-0000-0001-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Irrecoverable debts and the allowance for receivables', 'irrecoverable-debts-and-the-allowance-for-receivables', 8, true),
('c0000000-0000-0000-0001-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Accruals and prepayments', 'accruals-and-prepayments', 9, true),
('c0000000-0000-0000-0001-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Non-current assets and depreciation', 'non-current-assets-and-depreciation', 10, true),
('c0000000-0000-0000-0001-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Company financial statements', 'company-financial-statements', 11, true),
('c0000000-0000-0000-0001-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Company financial statements under IFRS Standards', 'company-financial-statements-under-ifrs-standards', 12, true),
('c0000000-0000-0000-0001-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Statement of cash flows', 'statement-of-cash-flows', 13, true),
('c0000000-0000-0000-0001-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Sole trader and partnership financial statements under GAAP', 'sole-trader-and-partnership-financial-statements-under-gaap', 14, true),
('c0000000-0000-0000-0001-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Introduction to Public Financial Management', 'introduction-to-public-financial-management', 15, true),

-- Management Information Chapters (11)
('c0000000-0000-0000-0002-000000000001', 'a0000000-0000-0000-0000-000000000002', 'The fundamentals of costing', 'the-fundamentals-of-costing', 1, true),
('c0000000-0000-0000-0002-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Calculating unit costs (Part 1)', 'calculating-unit-costs-part-1', 2, true),
('c0000000-0000-0000-0002-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Calculating unit costs (Part 2)', 'calculating-unit-costs-part-2', 3, true),
('c0000000-0000-0000-0002-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Marginal costing and absorption costing', 'marginal-costing-and-absorption-costing', 4, true),
('c0000000-0000-0000-0002-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Pricing calculations', 'pricing-calculations', 5, true),
('c0000000-0000-0000-0002-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Budgeting', 'budgeting', 6, true),
('c0000000-0000-0000-0002-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Working capital', 'working-capital', 7, true),
('c0000000-0000-0000-0002-000000000008', 'a0000000-0000-0000-0000-000000000002', 'Performance management', 'performance-management', 8, true),
('c0000000-0000-0000-0002-000000000009', 'a0000000-0000-0000-0000-000000000002', 'Standard costing and variance analysis', 'standard-costing-and-variance-analysis', 9, true),
('c0000000-0000-0000-0002-000000000010', 'a0000000-0000-0000-0000-000000000002', 'Breakeven analysis and limiting factor analysis', 'breakeven-analysis-and-limiting-factor-analysis', 10, true),
('c0000000-0000-0000-0002-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Investment appraisal techniques', 'investment-appraisal-techniques', 11, true),

-- Business Technology and Finance Chapters (14)
('c0000000-0000-0000-0003-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Introduction to business', 'introduction-to-business', 1, true),
('c0000000-0000-0000-0003-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Managing a business', 'managing-a-business', 2, true),
('c0000000-0000-0000-0003-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Organizational and business structures', 'organizational-and-business-structures', 3, true),
('c0000000-0000-0000-0003-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Introduction to business strategy', 'introduction-to-business-strategy', 4, true),
('c0000000-0000-0000-0003-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Introduction to risk management', 'introduction-to-risk-management', 5, true),
('c0000000-0000-0000-0003-000000000006', 'a0000000-0000-0000-0000-000000000003', 'The finance function and financial information', 'the-finance-function-and-financial-information', 6, true),
('c0000000-0000-0000-0003-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Business finance', 'business-finance', 7, true),
('c0000000-0000-0000-0003-000000000008', 'a0000000-0000-0000-0000-000000000003', 'The accountancy profession', 'the-accountancy-profession', 8, true),
('c0000000-0000-0000-0003-000000000009', 'a0000000-0000-0000-0000-000000000003', 'Governance and ethics', 'governance-and-ethics', 9, true),
('c0000000-0000-0000-0003-000000000010', 'a0000000-0000-0000-0000-000000000003', 'Corporate governance', 'corporate-governance', 10, true),
('c0000000-0000-0000-0003-000000000011', 'a0000000-0000-0000-0000-000000000003', 'The economic environment of business and finance', 'the-economic-environment-of-business-and-finance', 11, true),
('c0000000-0000-0000-0003-000000000012', 'a0000000-0000-0000-0000-000000000003', 'External regulation of business', 'external-regulation-of-business', 12, true),
('c0000000-0000-0000-0003-000000000013', 'a0000000-0000-0000-0000-000000000003', 'Data analysis', 'data-analysis', 13, true),
('c0000000-0000-0000-0003-000000000014', 'a0000000-0000-0000-0000-000000000003', 'Developments in technology', 'developments-in-technology', 14, true),

-- Taxation Chapters (24)
('c0000000-0000-0000-0004-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Basic concepts of taxation and Introduction to Bangladesh income tax', 'basic-concepts-of-taxation-and-introduction-to-bangladesh-income-tax', 1, true),
('c0000000-0000-0000-0004-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Tax Administration and Taxes Appellate Tribunal', 'tax-administration-and-taxes-appellate-tribunal', 2, true),
('c0000000-0000-0000-0004-000000000003', 'a0000000-0000-0000-0000-000000000004', 'Charge of income tax', 'charge-of-income-tax', 3, true),
('c0000000-0000-0000-0004-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Income from employment', 'income-from-employment', 4, true),
('c0000000-0000-0000-0004-000000000005', 'a0000000-0000-0000-0000-000000000004', 'Income from rent', 'income-from-rent', 5, true),
('c0000000-0000-0000-0004-000000000006', 'a0000000-0000-0000-0000-000000000004', 'Agricultural income', 'agricultural-income', 6, true),
('c0000000-0000-0000-0004-000000000007', 'a0000000-0000-0000-0000-000000000004', 'Income from business', 'income-from-business', 7, true),
('c0000000-0000-0000-0004-000000000008', 'a0000000-0000-0000-0000-000000000004', 'Capital gains', 'capital-gains', 8, true),
('c0000000-0000-0000-0004-000000000009', 'a0000000-0000-0000-0000-000000000004', 'Income from financial assets', 'income-from-financial-assets', 9, true),
('c0000000-0000-0000-0004-000000000010', 'a0000000-0000-0000-0000-000000000004', 'Income from other sources', 'income-from-other-sources', 10, true),
('c0000000-0000-0000-0004-000000000011', 'a0000000-0000-0000-0000-000000000004', 'Depreciation and amortization allowances', 'depreciation-and-amortization-allowances', 11, true),
('c0000000-0000-0000-0004-000000000012', 'a0000000-0000-0000-0000-000000000004', 'Set off and carry forward of losses', 'set-off-and-carry-forward-of-losses', 12, true),
('c0000000-0000-0000-0004-000000000013', 'a0000000-0000-0000-0000-000000000004', 'Exemption and allowances (tax holiday / other exemption)', 'exemption-and-allowances-tax-holiday-other-exemption', 13, true),
('c0000000-0000-0000-0004-000000000014', 'a0000000-0000-0000-0000-000000000004', 'Deduction/collection of tax at source', 'deductioncollection-of-tax-at-source', 14, true),
('c0000000-0000-0000-0004-000000000015', 'a0000000-0000-0000-0000-000000000004', 'Advance payment of tax', 'advance-payment-of-tax', 15, true),
('c0000000-0000-0000-0004-000000000016', 'a0000000-0000-0000-0000-000000000004', 'Return of income', 'return-of-income', 16, true),
('c0000000-0000-0000-0004-000000000017', 'a0000000-0000-0000-0000-000000000004', 'Assessment', 'assessment', 17, true),
('c0000000-0000-0000-0004-000000000018', 'a0000000-0000-0000-0000-000000000004', 'Assessment of individuals', 'assessment-of-individuals', 18, true),
('c0000000-0000-0000-0004-000000000019', 'a0000000-0000-0000-0000-000000000004', 'Assessment of companies', 'assessment-of-companies', 19, true),
('c0000000-0000-0000-0004-000000000020', 'a0000000-0000-0000-0000-000000000004', 'Penalty and Prosecution', 'penalty-and-prosecution', 20, true),
('c0000000-0000-0000-0004-000000000021', 'a0000000-0000-0000-0000-000000000004', 'Appeal, Tribunal, Reference, Revision and ADR', 'appeal-tribunal-reference-revision-and-adr', 21, true),
('c0000000-0000-0000-0004-000000000022', 'a0000000-0000-0000-0000-000000000004', 'Professional Ethics', 'professional-ethics', 22, true),
('c0000000-0000-0000-0004-000000000023', 'a0000000-0000-0000-0000-000000000004', 'Value Added Tax', 'value-added-tax', 23, true),
('c0000000-0000-0000-0004-000000000024', 'a0000000-0000-0000-0000-000000000004', 'Customs Portion', 'customs-portion', 24, true),

-- Assurance Chapters (16)
('c0000000-0000-0000-0005-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Concept of and need for assurance', 'concept-of-and-need-for-assurance', 1, true),
('c0000000-0000-0000-0005-000000000002', 'a0000000-0000-0000-0000-000000000005', 'Process of assurance: obtaining an engagement', 'process-of-assurance-obtaining-an-engagement', 2, true),
('c0000000-0000-0000-0005-000000000003', 'a0000000-0000-0000-0000-000000000005', 'Process of assurance: planning the assignment', 'process-of-assurance-planning-the-assignment', 3, true),
('c0000000-0000-0000-0005-000000000004', 'a0000000-0000-0000-0000-000000000005', 'Process of assurance: evidence and reporting', 'process-of-assurance-evidence-and-reporting', 4, true),
('c0000000-0000-0000-0005-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Introduction to internal control', 'introduction-to-internal-control', 5, true),
('c0000000-0000-0000-0005-000000000006', 'a0000000-0000-0000-0000-000000000005', 'Revenue system', 'revenue-system', 6, true),
('c0000000-0000-0000-0005-000000000007', 'a0000000-0000-0000-0000-000000000005', 'Purchases system', 'purchases-system', 7, true),
('c0000000-0000-0000-0005-000000000008', 'a0000000-0000-0000-0000-000000000005', 'Employee costs', 'employee-costs', 8, true),
('c0000000-0000-0000-0005-000000000009', 'a0000000-0000-0000-0000-000000000005', 'Internal audit', 'internal-audit', 9, true),
('c0000000-0000-0000-0005-000000000010', 'a0000000-0000-0000-0000-000000000005', 'Documentation', 'documentation', 10, true),
('c0000000-0000-0000-0005-000000000011', 'a0000000-0000-0000-0000-000000000005', 'Evidence and sampling', 'evidence-and-sampling', 11, true),
('c0000000-0000-0000-0005-000000000012', 'a0000000-0000-0000-0000-000000000005', 'Written representations', 'written-representations', 12, true),
('c0000000-0000-0000-0005-000000000013', 'a0000000-0000-0000-0000-000000000005', 'Substantive procedures - key financial statement figures', 'substantive-procedures-key-figures', 13, true),
('c0000000-0000-0000-0005-000000000014', 'a0000000-0000-0000-0000-000000000005', 'Codes of professional ethics and regulatory issues', 'codes-of-professional-ethics-and-regulatory-issues', 14, true),
('c0000000-0000-0000-0005-000000000015', 'a0000000-0000-0000-0000-000000000005', 'Integrity, objectivity and independence', 'integrity-objectivity-and-independence', 15, true),
('c0000000-0000-0000-0005-000000000016', 'a0000000-0000-0000-0000-000000000005', 'Confidentiality', 'confidentiality', 16, true),

-- Business Law Chapters (4)
('c0000000-0000-0000-0006-000000000001', 'a0000000-0000-0000-0000-000000000006', 'Overview on the Companies Act, 1994', 'overview-on-the-companies-act-1994', 1, true),
('c0000000-0000-0000-0006-000000000002', 'a0000000-0000-0000-0000-000000000006', 'Overview on the Negotiable Instruments Act, 1881', 'overview-on-the-negotiable-instruments-act-1881', 2, true),
('c0000000-0000-0000-0006-000000000003', 'a0000000-0000-0000-0000-000000000006', 'Overview on the Partnership Act, 1932', 'overview-on-the-partnership-act-1932', 3, true),
('c0000000-0000-0000-0006-000000000004', 'a0000000-0000-0000-0000-000000000006', 'Overview on the Contract Act, 1872 and The Sale of Goods Act, 1930', 'overview-on-the-contract-act-1872-and-the-sale-of-goods-act-1930', 4, true),

-- Information Technology Chapter (1)
('c0000000-0000-0000-0007-000000000001', 'a0000000-0000-0000-0000-000000000007', 'IT PRO MAX', 'it-pro-max', 1, true)

ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  chapter_number = EXCLUDED.chapter_number,
  is_active = EXCLUDED.is_active;

COMMIT;

-- 5. VERIFICATION REPORT
SELECT 
  s.name AS subject_name,
  s.code AS subject_code,
  COUNT(c.id) AS chapter_count
FROM public.subjects s
LEFT JOIN public.chapters c ON c.subject_id = s.id
GROUP BY s.id, s.name, s.code, s.display_order
ORDER BY s.display_order ASC;

SELECT COUNT(*) AS total_chapters FROM public.chapters;

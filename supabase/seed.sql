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
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 2. SEED DEFAULT EXAM CONFIGURATIONS
-- Matching Finalized ICAB Exam Specifications:
-- Accounting: 40 MCQ (2 marks each) + 1 large question (20 marks) = 100 marks, 90 mins
-- Management Information: 35 MCQ (2 marks each) + 2 scenario questions (15 marks each) = 100 marks, 90 mins
-- Business Technology and Finance: 50 MCQ (2 marks each) = 100 marks, 90 mins (configurable)
-- Tax: 35 MCQ (2 marks each) + 2 scenario questions (15 marks each) = 100 marks, 90 mins
-- Assurance: 50 MCQ (2 marks each) = 100 marks, 90 mins (configurable)
-- Business Law: 25 MCQ (2 marks each) = 50 marks, 60 mins
-- Information Technology: 25 MCQ (2 marks each) = 50 marks, 60 mins

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
) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Accounting Full Book Exam', 'full_book', 90, 40, 2, 0, 0, 1, 20, 100, true),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Management Information Full Book Exam', 'full_book', 90, 35, 2, 2, 15, 0, 0, 100, true),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Business Technology and Finance Full Book Exam', 'full_book', 90, 50, 2, 0, 0, 0, 0, 100, true),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Tax Full Book Exam', 'full_book', 90, 35, 2, 2, 15, 0, 0, 100, true),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Assurance Full Book Exam', 'full_book', 90, 50, 2, 0, 0, 0, 0, 100, true),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Business Law Full Book Exam', 'full_book', 60, 25, 2, 0, 0, 0, 0, 50, true),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Information Technology Full Book Exam', 'full_book', 60, 25, 2, 0, 0, 0, 0, 50, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  duration_minutes = EXCLUDED.duration_minutes,
  mcq_count = EXCLUDED.mcq_count,
  mcq_marks_each = EXCLUDED.mcq_marks_each,
  scenario_count = EXCLUDED.scenario_count,
  scenario_marks_each = EXCLUDED.scenario_marks_each,
  large_count = EXCLUDED.large_count,
  large_marks_each = EXCLUDED.large_marks_each,
  total_marks = EXCLUDED.total_marks,
  is_active = EXCLUDED.is_active;

-- 3. SEED CHAPTERS FOR ALL 7 SUBJECTS (ICAB Certificate Level Syllabus)
INSERT INTO public.chapters (id, subject_id, name, slug, chapter_number, description, is_active) VALUES
-- Accounting Chapters (10)
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Introduction to Accounting & The Regulatory Framework', 'intro-accounting-framework', 1, 'Basic accounting concepts, IAS/IFRS framework, and underlying assumptions.', true),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'The Accounting Equation and Double-Entry System', 'accounting-equation-double-entry', 2, 'Debit and credit rules, ledger accounts, and dual aspect convention.', true),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Recording Transactions: Sales, Purchases, and Cash', 'recording-transactions', 3, 'Books of prime entry, trade discounts, cash books, and sales/purchases ledgers.', true),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Non-Current Assets and Depreciation', 'non-current-assets-depreciation', 4, 'Capital vs revenue expenditure, depreciation methods (straight-line, reducing balance), and disposals.', true),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Inventory Valuation', 'inventory-valuation', 5, 'IAS 2 rules, cost vs net realizable value (NRV), FIFO, and weighted average cost.', true),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Accruals, Prepayments, and Bad Debts', 'accruals-prepayments-bad-debts', 6, 'Matching concept adjustments, allowance for irrecoverable debts, and bad debt recovery.', true),
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Bank Reconciliation Statements', 'bank-reconciliation-statements', 7, 'Cash book updating, uncredited cheques, unpresented cheques, and reconciliation discrepancies.', true),
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Trial Balance and Rectification of Errors', 'trial-balance-rectification', 8, 'Extracting trial balances, suspense accounts, and correction of error journal entries.', true),
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Preparation of Financial Statements of Sole Traders', 'financial-statements-sole-traders', 9, 'Trading account, profit or loss statement, balance sheet, and drawings adjustments.', true),
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Preparation of Financial Statements of Limited Companies', 'financial-statements-companies', 10, 'Statement of comprehensive income, statement of financial position, share capital, and reserves.', true),

-- Management Information Chapters (7)
('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Cost Classification and Behavior', 'cost-classification-behavior', 1, 'Direct vs indirect costs, fixed vs variable costs, step costs, and cost centers.', true),
('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'Cost Accounting: Materials, Labor, and Overheads', 'cost-accounting-materials-labor-overheads', 2, 'EOQ, inventory control levels, labor remuneration schemes, and overhead absorption rates (OAR).', true),
('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000002', 'Absorption Costing and Marginal Costing', 'absorption-marginal-costing', 3, 'Comparison of profit under marginal vs absorption costing, and reconciliation of profit differences.', true),
('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'Cost-Volume-Profit (CVP) Analysis', 'cost-volume-profit-cvp-analysis', 4, 'Break-even point, margin of safety, contribution-to-sales ratio, and multi-product CVP.', true),
('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000002', 'Budgeting and Budgetary Control', 'budgeting-budgetary-control', 5, 'Functional budgets, master budget, cash budgets, fixed vs flexible budgets, and behavioral aspects.', true),
('c0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000002', 'Standard Costing and Basic Variance Analysis', 'standard-costing-variance-analysis', 6, 'Setting standards, material price/usage variances, and labor rate/efficiency variances.', true),
('c0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000002', 'Performance Measurement and Pricing', 'performance-measurement-pricing', 7, 'Financial and non-financial performance indicators, cost-plus pricing, and target costing.', true),

-- Business Technology & Finance Chapters (6)
('c0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000003', 'Business Organizations and Corporate Governance', 'business-organizations-governance', 1, 'Types of business entities, agency theory, stakeholder analysis, and corporate governance principles.', true),
('c0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000003', 'The Macroeconomic Environment and Government Policy', 'macroeconomic-environment-policy', 2, 'Fiscal policy, monetary policy, inflation, exchange rates, and international trade.', true),
('c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000003', 'Financial Markets, Banking, and Financial Institutions', 'financial-markets-institutions', 3, 'Money markets, capital markets, commercial banks, development financial institutions, and central bank roles.', true),
('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000003', 'Financial Management, Sources of Finance, and Capital Structure', 'financial-management-capital-structure', 4, 'Short-term vs long-term finance, equity vs debt financing, working capital management, and cost of capital.', true),
('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000003', 'Information Technology, Big Data, and E-Business', 'technology-big-data-ebusiness', 5, 'Disruptive technology, digital business models, big data analytics, and cloud computing in commerce.', true),
('c0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000003', 'Organizational Management, Leadership, and Strategy', 'management-leadership-strategy', 6, 'Strategic management process, SWOT/PESTEL analysis, leadership styles, and change management.', true),

-- Tax Chapters (8)
('c0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000004', 'Introduction to Taxation and Income Tax Framework', 'intro-taxation-framework', 1, 'Canons of taxation, Income Tax Act provisions, tax authorities, and assessment year concepts.', true),
('c0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000004', 'Scope of Total Income and Residential Status', 'scope-total-income-residential-status', 2, 'Determination of residential status, income deemed to accrue, and exempt incomes.', true),
('c0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000004', 'Salary Income Assessment', 'salary-income-assessment', 3, 'Allowances, perquisites, retirement benefits, exemptions, and computation of tax on salaries.', true),
('c0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000004', 'Income from House Property and Agriculture', 'income-house-property-agriculture', 4, 'Annual value determination, allowable deductions, statutory repair allowances, and agricultural income rules.', true),
('c0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000004', 'Income from Business or Profession', 'income-business-profession', 5, 'Admissible and inadmissible expenses, tax depreciation allowances, and disallowed deductions.', true),
('c0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000004', 'Capital Gains and Income from Other Sources', 'capital-gains-other-sources', 6, 'Computation of capital gains, cost of acquisition, dividend and interest income, and other source rules.', true),
('c0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000004', 'Corporate Taxation, TDS, and Advance Tax', 'corporate-taxation-tds-advance-tax', 7, 'Corporate tax rates, minimum tax, tax deducted at source (TDS), and advance tax payment rules.', true),
('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000004', 'Value Added Tax (VAT) and Supplementary Duty', 'vat-supplementary-duty', 8, 'VAT Act fundamentals, taxable supply, input tax credit, zero-rating, and VAT compliance filing.', true),

-- Assurance Chapters (7)
('c0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000005', 'Concept, Need, and Framework of Assurance', 'concept-need-framework-assurance', 1, 'Definition of assurance, statutory audits, reasonable vs limited assurance, and expectation gap.', true),
('c0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000005', 'Professional Ethics, Independence, and Quality Management', 'ethics-independence-quality-management', 2, 'IESBA/ICAB code of ethics, fundamental principles, threats to independence, and safeguards.', true),
('c0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000005', 'Engagement Acceptance, Planning, and Risk Assessment', 'acceptance-planning-risk-assessment', 3, 'Client acceptance, engagement letters, audit strategy, materiality, and audit risk model.', true),
('c0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000005', 'Internal Controls and Control Assessment', 'internal-controls-assessment', 4, 'Components of internal control, testing controls, walk-through tests, and communication of deficiencies.', true),
('c0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000005', 'Audit Evidence and Substantive Testing', 'audit-evidence-substantive-testing', 5, 'Sufficient appropriate audit evidence, assertions, analytical procedures, and audit sampling.', true),
('c0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000005', 'Substantive Procedures: Key Financial Statement Assertions', 'substantive-procedures-assertions', 6, 'Audit programs for revenue, inventory, receivables, bank balances, liabilities, and payroll.', true),
('c0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000005', 'Completion, Subsequent Events, and the Auditor''s Report', 'completion-subsequent-events-audit-report', 7, 'Subsequent events (IAS 10), going concern (ISA 570), unmodified vs modified audit opinions.', true),

-- Business Law Chapters (6)
('c0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000006', 'The Legal System and Sources of Commercial Law', 'legal-system-sources-commercial-law', 1, 'Court hierarchy, legislation, precedent, custom, and fundamental legal rights.', true),
('c0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000006', 'The Law of Contract: Formation, Terms, and Legality', 'law-of-contract-formation', 2, 'Offer, acceptance, consideration, intention to create legal relations, capacity, and void agreements.', true),
('c0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000006', 'Discharge of Contract and Remedies for Breach', 'discharge-contract-remedies', 3, 'Discharge by performance, agreement, frustration, breach, and damages remedies.', true),
('c0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000006', 'Law of Agency and The Partnership Act', 'law-of-agency-partnership', 4, 'Creation of agency, agent authority, partnership rights/duties, and dissolution of partnership.', true),
('c0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000006', 'The Companies Act: Formation, Capital, and Directors', 'companies-act-formation-management', 5, 'Incorporation, Memorandum & Articles of Association, share capital, directors'' duties, and meetings.', true),
('c0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000006', 'Negotiable Instruments Act and Commercial Regulations', 'negotiable-instruments-commercial-regulations', 6, 'Promissory notes, bills of exchange, cheques, crossing of cheques, endorsement, and dishonour.', true),

-- Information Technology Chapters (7)
('c0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000007', 'Information Systems in Business and Society', 'information-systems-business', 1, 'Data vs information, TPS, MIS, DSS, ESS, and strategic role of information systems.', true),
('c0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000007', 'Computer Hardware, Software, and Infrastructure', 'hardware-software-infrastructure', 2, 'CPU, memory, storage devices, operating systems, application software, and system software.', true),
('c0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000007', 'Telecommunications, Networks, and Cloud Infrastructure', 'networks-cloud-infrastructure', 3, 'LAN, WAN, topologies, protocols (TCP/IP), client-server models, and cloud computing (IaaS, PaaS, SaaS).', true),
('c0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000007', 'Relational Databases and Enterprise Data Management', 'databases-data-management', 4, 'DBMS concepts, relational model, normalization, SQL queries, data warehousing, and business intelligence.', true),
('c0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000007', 'Information Security, Controls, and Cyber Risk', 'information-security-cyber-risk', 5, 'Threats, malware, cryptography, firewalls, general vs application IT controls, and disaster recovery planning.', true),
('c0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000007', 'Enterprise Systems: ERP, CRM, and Supply Chain', 'enterprise-systems-erp-crm', 6, 'Integrated business software, ERP implementation lifecycle, CRM systems, and e-commerce architectures.', true),
('c0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000007', 'Emerging Digital Technologies: AI, Blockchain, and Fintech', 'emerging-technologies-ai-fintech', 7, 'Artificial intelligence in accounting, machine learning, robotic process automation (RPA), and blockchain ledgers.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  chapter_number = EXCLUDED.chapter_number,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 4. VERIFICATION QUERY (Confirms all 7 subjects and full syllabus seeded)
SELECT 
  (SELECT COUNT(*) FROM public.subjects) AS total_subjects,
  (SELECT COUNT(*) FROM public.chapters) AS total_chapters,
  (SELECT COUNT(*) FROM public.exam_configs) AS total_exam_configs;

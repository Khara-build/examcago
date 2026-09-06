export type UserRole = 'student' | 'admin';
export type QuestionType = 'mcq' | 'scenario' | 'large';
export type ExamType = 'chapter' | 'full_book';
export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'expired' | 'cancelled';
export type TransactionType = 'welcome_bonus' | 'daily_claim' | 'exam_deduction' | 'referral_bonus' | 'admin_grant' | 'refund' | 'purchase';
export type ImportFileType = 'xlsx' | 'csv' | 'json';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  chapter_number: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_letter: 'A' | 'B' | 'C' | 'D';
  option_text: string;
  is_correct: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  explanation: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  chapter?: Chapter;
  options?: QuestionOption[];
}

export interface ScenarioQuestion {
  id: string;
  question_id: string;
  scenario_title: string;
  scenario_text: string;
  sub_questions: Array<{
    id: string;
    text: string;
    options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
    correct_answer: string;
    marks: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface LargeQuestion {
  id: string;
  question_id: string;
  case_title: string;
  case_text: string;
  template_type: 'financial_statements' | 'cash_flow' | 'audit_report' | 'other';
  question_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ExamConfig {
  id: string;
  subject_id: string;
  name: string;
  exam_type: ExamType;
  chapter_id: string | null;
  duration_minutes: number;
  mcq_count: number;
  mcq_marks_each: number;
  scenario_count: number;
  scenario_marks_each: number;
  large_count: number;
  large_marks_each: number;
  total_marks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  chapter?: Chapter;
}

export interface TokenAccount {
  user_id: string;
  balance: number;
  last_daily_claim_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  description: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_tokens: number;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  referred_profile?: Profile;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  subject_id: string;
  exam_config_id: string;
  exam_type: ExamType;
  title: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  status: AttemptStatus;
  score: number;
  is_passed: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  exam_config?: ExamConfig;
}

export interface AttemptQuestion {
  id: string;
  attempt_id: string;
  question_id: string;
  question_order: number;
  marks: number;
  question_snapshot: Question & { options: QuestionOption[] };
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  text_answer: string | null;
  is_flagged: boolean;
  is_correct: boolean | null;
  marks_obtained: number;
  answered_at: string;
}

export interface BulkImportLog {
  id: string;
  admin_id: string | null;
  file_name: string;
  file_type: ImportFileType;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  imported_rows: number;
  status: ImportStatus;
  error_log: Array<{ row: number; error: string; data?: any }>;
  created_at: string;
}

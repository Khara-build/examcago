// Shared types and constants for Question Reporting System
// Safe for both client and server imports

export const ALLOWED_REPORT_REASONS = [
  'Correct answer appears to be wrong',
  'Question itself is incorrect',
  'More than one option appears correct',
  'One or more options are incorrect',
  'Explanation is incorrect',
  'Other',
] as const;

export type ReportReason = typeof ALLOWED_REPORT_REASONS[number];

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'rejected';

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { ALLOWED_REPORT_REASONS, ReportReason, ReportStatus } from '@/types/reports';

// Helper to verify admin role
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  return { user, isAdmin: profile?.role === 'admin', adminClient };
}

/**
 * Submits a question report from the exam result / review screen.
 * Strictly verifies the student owns the attempt, the attempt is completed,
 * and the reported question was actually part of the attempt snapshot.
 */
export async function submitQuestionReportAction({
  questionId,
  attemptId,
  reason,
  details,
}: {
  questionId: string;
  attemptId: string;
  reason: string;
  details?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to report a question.' };
  }

  // 1. Validate reason against whitelist
  if (!ALLOWED_REPORT_REASONS.includes(reason as ReportReason)) {
    return { error: 'Invalid report reason selected. Please select a valid reason from the list.' };
  }

  // 2. Validate details length
  const sanitizedDetails = details?.trim() || '';
  if (sanitizedDetails.length > 1500) {
    return { error: 'Additional details cannot exceed 1,500 characters.' };
  }

  const adminClient = createAdminClient();

  // 3. Verify student ownership of this attempt and ensure exam is submitted
  const { data: attempt, error: attemptError } = await adminClient
    .from('exam_attempts')
    .select('id, user_id, status')
    .eq('id', attemptId)
    .single();

  if (attemptError || !attempt) {
    return { error: 'Exam attempt not found.' };
  }

  if (attempt.user_id !== user.id) {
    return { error: 'Unauthorized. You can only report questions from your own exam attempts.' };
  }

  if (attempt.status === 'in_progress') {
    return { error: 'Questions can only be reported after an exam attempt has been submitted.' };
  }

  // 4. Verify that this specific question was in the student's attempt snapshot
  const { data: attemptQ, error: qError } = await adminClient
    .from('attempt_questions')
    .select('id')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (qError || !attemptQ) {
    return { error: 'This question does not belong to the specified exam attempt.' };
  }

  // 5. Prevent duplicate spam submission for the same student, attempt, and question
  const { data: existingReport } = await adminClient
    .from('question_reports')
    .select('id')
    .eq('user_id', user.id)
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (existingReport) {
    return { error: 'You have already submitted a report for this question on this attempt.' };
  }

  // 6. Insert new question report
  const { error: insertError } = await adminClient
    .from('question_reports')
    .insert({
      question_id: questionId,
      user_id: user.id,
      attempt_id: attemptId,
      reason,
      details: sanitizedDetails || null,
      status: 'open',
    });

  if (insertError) {
    console.error('[Question Report Insert Error]:', insertError.message);
    if (insertError.code === '23505') {
      return { error: 'You have already submitted a report for this question on this attempt.' };
    }
    return { error: 'Failed to record your question report. Please try again.' };
  }

  revalidatePath(`/exam/${attemptId}/result`);
  return { 
    success: true, 
    message: 'Report submitted. Thank you for helping us improve the question bank.' 
  };
}

/**
 * Checks which questions in an attempt have already been reported by the current user.
 */
export async function getAttemptReportedQuestionIdsAction(attemptId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { reportedQuestionIds: [] };

  const adminClient = createAdminClient();
  const { data: reports } = await adminClient
    .from('question_reports')
    .select('question_id')
    .eq('attempt_id', attemptId)
    .eq('user_id', user.id);

  const reportedQuestionIds = (reports || []).map((r) => r.question_id);
  return { reportedQuestionIds };
}

// ==================================================
// ADMIN QUESTION REPORT MANAGEMENT ACTIONS
// ==================================================

/**
 * Admin action to update report status and admin notes.
 */
export async function updateQuestionReportStatusAction({
  reportId,
  status,
  adminNote,
}: {
  reportId: string;
  status: 'open' | 'reviewing' | 'resolved' | 'rejected';
  adminNote?: string;
}) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const validStatuses = ['open', 'reviewing', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid report status.' };
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNote !== undefined) {
    updateData.admin_note = adminNote.trim() || null;
  }

  if (status === 'resolved' || status === 'rejected') {
    updateData.resolved_at = new Date().toISOString();
  } else {
    updateData.resolved_at = null;
  }

  const { error } = await adminClient
    .from('question_reports')
    .update(updateData)
    .eq('id', reportId);

  if (error) {
    console.error('[Update Question Report Error]:', error.message);
    return { error: error.message };
  }

  revalidatePath('/admin/questions/reports');
  return { success: true };
}

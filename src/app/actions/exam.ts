'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { evaluateExamAttempt } from '@/lib/exam/grading';

/**
 * Start an Exam Attempt using atomic DB procedure (start_exam_attempt_rpc)
 * Protects against race conditions, handles token deduction, and ensures
 * question availability before deducting tokens.
 */
export async function startExamAttemptAction(
  subjectId: string,
  examConfigId: string,
  chapterId: string | null = null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to start an examination.' };
  }

  const adminClient = createAdminClient();

  // Execute atomic RPC procedure for token deduction & attempt initialization
  const { data, error } = await adminClient.rpc('start_exam_attempt_rpc', {
    p_user_id: user.id,
    p_subject_id: subjectId,
    p_exam_config_id: examConfigId,
    p_chapter_id: chapterId || null,
  });

  if (error) {
    return { error: error.message || 'Failed to initialize examination.' };
  }

  const result = data as { success: boolean; error?: string; attempt_id?: string };

  if (!result.success || !result.attempt_id) {
    return { error: result.error || 'Could not start exam attempt.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/history');

  return { success: true, attemptId: result.attempt_id };
}

/**
 * Persists answer choice / text answer / flag state for a question in an active exam attempt.
 */
export async function saveAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  textAnswer: string | null = null,
  isFlagged: boolean = false
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized.' };

  const adminClient = createAdminClient();

  // Verify attempt ownership & active status
  const { data: attempt } = await adminClient
    .from('exam_attempts')
    .select('id, user_id, status, expires_at')
    .eq('id', attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    return { error: 'Attempt not found or unauthorized.' };
  }

  if (attempt.status !== 'in_progress') {
    return { error: 'Exam attempt has already been submitted or completed.' };
  }

  // Grace period of 10 seconds for network latency on timer expiration
  const maxAllowedTime = new Date(new Date(attempt.expires_at).getTime() + 10000);
  if (new Date() > maxAllowedTime) {
    return { error: 'Time limit for this exam has expired.' };
  }

  // Upsert answer record
  const { error: upsertErr } = await adminClient
    .from('attempt_answers')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      text_answer: textAnswer,
      is_flagged: isFlagged,
      answered_at: new Date().toISOString(),
    }, {
      onConflict: 'attempt_id,question_id',
    });

  if (upsertErr) {
    return { error: upsertErr.message };
  }

  return { success: true };
}

/**
 * Finalizes and grades an exam attempt server-side.
 * Evaluates MCQs against authoritative database correct keys,
 * computes total marks, updates attempt status, and records pass/fail.
 */
export async function submitExamAttemptAction(
  attemptId: string,
  isAutoSubmit: boolean = false
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized.' };

  const adminClient = createAdminClient();

  // 1. Fetch Attempt & Verification
  const { data: attempt } = await adminClient
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    return { error: 'Attempt not found.' };
  }

  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    return { success: true, score: attempt.score, isPassed: attempt.is_passed };
  }

  // 2. Fetch User Answers & Attempt Questions
  const { data: answers } = await adminClient
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId);

  const { data: attemptQuestions } = await adminClient
    .from('attempt_questions')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true });

  if (!attemptQuestions || attemptQuestions.length === 0) {
    return { error: 'No questions found for this attempt.' };
  }

  // Fetch MCQ options
  const mcqQuestionIds = attemptQuestions
    .filter((q) => (q.question_snapshot?.question_type || 'mcq') === 'mcq')
    .map((q) => q.question_id);

  let fullDbOptions: any[] = [];
  if (mcqQuestionIds.length > 0) {
    const { data: opts } = await adminClient
      .from('question_options')
      .select('*')
      .in('question_id', mcqQuestionIds);
    fullDbOptions = opts || [];
  }

  // Fetch Scenario data
  const scenarioQuestionIds = attemptQuestions
    .filter((q) => q.question_snapshot?.question_type === 'scenario')
    .map((q) => q.question_id);

  let fullDbScenarios: any[] = [];
  if (scenarioQuestionIds.length > 0) {
    const { data: scens } = await adminClient
      .from('scenario_questions')
      .select('*')
      .in('question_id', scenarioQuestionIds);
    fullDbScenarios = scens || [];
  }

  // Fetch Large Question data
  const largeQuestionIds = attemptQuestions
    .filter((q) => q.question_snapshot?.question_type === 'large')
    .map((q) => q.question_id);

  let fullDbLarge: any[] = [];
  if (largeQuestionIds.length > 0) {
    const { data: lgs } = await adminClient
      .from('large_questions')
      .select('*')
      .in('question_id', largeQuestionIds);
    fullDbLarge = lgs || [];
  }

  // 3. Authoritative Unified Evaluation
  const evaluation = evaluateExamAttempt(
    attemptQuestions,
    answers || [],
    fullDbOptions,
    fullDbScenarios,
    fullDbLarge
  );

  // 4. Parallel batch updates to attempt_answers
  const updatePromises = evaluation.questionGradings.map((grading) => {
    const userAns = answers?.find((a) => a.question_id === grading.questionId);
    if (userAns) {
      return adminClient
        .from('attempt_answers')
        .update({
          is_correct: grading.isCorrect,
          marks_obtained: grading.marksObtained,
        })
        .eq('id', userAns.id);
    }
    return Promise.resolve(null);
  });

  await Promise.all(updatePromises);

  const finalStatus = isAutoSubmit ? 'auto_submitted' : 'submitted';

  // 5. Finalize Attempt
  await adminClient
    .from('exam_attempts')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      score: evaluation.totalScore,
      is_passed: evaluation.isPassed,
    })
    .eq('id', attemptId);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/history');
  revalidatePath(`/exam/${attemptId}`);
  revalidatePath(`/exam/${attemptId}/result`);

  return { success: true, score: evaluation.totalScore, isPassed: evaluation.isPassed };
}

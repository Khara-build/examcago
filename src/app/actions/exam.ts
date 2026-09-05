'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

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

  let totalScore = 0;

  if (attemptQuestions && attemptQuestions.length > 0) {
    for (const qItem of attemptQuestions) {
      const qSnapshot = qItem.question_snapshot || {};
      const qType = qSnapshot.question_type || 'mcq';
      const userAnswer = answers?.find((a) => a.question_id === qItem.question_id);

      if (qType === 'mcq') {
        if (userAnswer && userAnswer.selected_option_id) {
          // Fetch authoritative correct option from database
          const { data: correctOption } = await adminClient
            .from('question_options')
            .select('id')
            .eq('question_id', qItem.question_id)
            .eq('is_correct', true)
            .maybeSingle();

          const isCorrect = !!(correctOption && correctOption.id === userAnswer.selected_option_id);
          const marksObtained = isCorrect ? (qItem.marks || 2) : 0;
          totalScore += marksObtained;

          await adminClient
            .from('attempt_answers')
            .update({
              is_correct: isCorrect,
              marks_obtained: marksObtained,
            })
            .eq('id', userAnswer.id);
        } else if (userAnswer) {
          await adminClient
            .from('attempt_answers')
            .update({
              is_correct: false,
              marks_obtained: 0,
            })
            .eq('id', userAnswer.id);
        }
      } else if (qType === 'scenario') {
        // Evaluate Scenario sub-questions
        if (userAnswer) {
          const { data: scenData } = await adminClient
            .from('scenario_questions')
            .select('sub_questions')
            .eq('question_id', qItem.question_id)
            .maybeSingle();

          let scenMarks = 0;
          let isCorrect = false;

          if (scenData && scenData.sub_questions && Array.isArray(scenData.sub_questions)) {
            let parsedUserAns: Record<string, string> = {};
            try {
              if (userAnswer.text_answer) {
                parsedUserAns = JSON.parse(userAnswer.text_answer);
              }
            } catch (e) {
              parsedUserAns = {};
            }

            const totalSub = scenData.sub_questions.length;
            const marksPerSub = (qItem.marks || 15) / (totalSub || 1);
            let correctSubCount = 0;

            scenData.sub_questions.forEach((sq: any) => {
              const uChoice = parsedUserAns[sq.id];
              if (uChoice && sq.correct_answer && uChoice.trim().toUpperCase() === sq.correct_answer.trim().toUpperCase()) {
                correctSubCount += 1;
              }
            });

            scenMarks = Math.round(correctSubCount * marksPerSub * 100) / 100;
            isCorrect = correctSubCount === totalSub;
          }

          totalScore += scenMarks;

          await adminClient
            .from('attempt_answers')
            .update({
              is_correct: isCorrect,
              marks_obtained: scenMarks,
            })
            .eq('id', userAnswer.id);
        }
      } else if (qType === 'large') {
        // Evaluate 20-mark Large Accounting question
        if (userAnswer && userAnswer.text_answer) {
          const { data: largeData } = await adminClient
            .from('large_questions')
            .select('question_data')
            .eq('question_id', qItem.question_id)
            .maybeSingle();

          let largeMarks = 0;
          const maxMarks = qItem.marks || 20;

          if (largeData && largeData.question_data && largeData.question_data.solution_key) {
            const expectedText = String(largeData.question_data.solution_key).toLowerCase();
            const userText = userAnswer.text_answer.toLowerCase();

            if (userText.includes(expectedText) || expectedText.includes(userText)) {
              largeMarks = maxMarks;
            } else if (userAnswer.text_answer.trim().length > 50) {
              largeMarks = Math.round(maxMarks * 0.75); // Award partial credit for comprehensive attempt
            }
          } else if (userAnswer.text_answer.trim().length > 30) {
            largeMarks = Math.round(maxMarks * 0.7);
          }

          totalScore += largeMarks;

          await adminClient
            .from('attempt_answers')
            .update({
              is_correct: largeMarks >= (maxMarks * 0.5),
              marks_obtained: largeMarks,
            })
            .eq('id', userAnswer.id);
        }
      }
    }
  }

  const isPassed = totalScore >= (attempt.total_marks * 0.5);
  const finalStatus = isAutoSubmit ? 'auto_submitted' : 'submitted';

  // 3. Finalize Attempt
  await adminClient
    .from('exam_attempts')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      score: totalScore,
      is_passed: isPassed,
    })
    .eq('id', attemptId);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/history');
  revalidatePath(`/exam/${attemptId}`);

  return { success: true, score: totalScore, isPassed };
}

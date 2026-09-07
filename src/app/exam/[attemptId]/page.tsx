import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { submitExamAttemptAction } from '@/app/actions/exam';
import { getAttemptWithServerTime } from '@/lib/exam/timer';
import { Metadata } from 'next';
import { ExamWorkspace } from './ExamWorkspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Active Examination Session',
  robots: {
    index: false,
    follow: false,
  },
};

interface ExamPageProps {
  params: Promise<{
    attemptId: string;
  }>;
}

export default async function ExamPage({ params }: ExamPageProps) {
  const resolvedParams = await params;
  const attemptId = resolvedParams.attemptId;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/exam/${attemptId}`);
  }

  // Fetch Attempt with authoritative server time synchronization
  const attemptResult = await getAttemptWithServerTime(attemptId);

  if (!attemptResult || !attemptResult.attempt || attemptResult.attempt.user_id !== user.id) {
    notFound();
  }

  const { attempt, remainingSeconds } = attemptResult;

  // Redirect to results if already submitted or auto-submitted
  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    redirect(`/exam/${attemptId}/result`);
  }

  // Check if deadline has passed while student was away (authoritative server-time comparison)
  if (remainingSeconds <= 0) {
    await submitExamAttemptAction(attemptId, true);
    redirect(`/exam/${attemptId}/result`);
  }

  const adminClient = createAdminClient();

  // Fetch Attempt Questions ordered
  const { data: questions } = await adminClient
    .from('attempt_questions')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true });

  // Security: Sanitize question snapshots to prevent leaking explanations or answers to active test-takers
  const sanitizedQuestions = questions?.map((q: any) => {
    if (q.question_snapshot && typeof q.question_snapshot === 'object') {
      const { explanation, correct_answer, ...cleanSnapshot } = q.question_snapshot;

      // Sanitize sub_questions in scenario questions
      if (Array.isArray(cleanSnapshot.sub_questions)) {
        cleanSnapshot.sub_questions = cleanSnapshot.sub_questions.map((sq: any) => {
          const { correct_answer: _ca, explanation: _exp, ...cleanSq } = sq;
          return cleanSq;
        });
      }

      // Sanitize structured numerical fields in large questions
      if (cleanSnapshot.question_data && Array.isArray(cleanSnapshot.question_data.fields)) {
        cleanSnapshot.question_data = {
          ...cleanSnapshot.question_data,
          fields: cleanSnapshot.question_data.fields.map((f: any) => {
            const { correct_value: _cv, ...cleanField } = f;
            return cleanField;
          }),
        };
      }

      return { ...q, question_snapshot: cleanSnapshot };
    }
    return q;
  }) || [];

  // Fetch Existing Answers
  const { data: answers } = await adminClient
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId);

  return (
    <ExamWorkspace
      attempt={attempt}
      initialQuestions={sanitizedQuestions}
      initialAnswers={answers || []}
      initialRemainingSeconds={remainingSeconds}
    />
  );
}

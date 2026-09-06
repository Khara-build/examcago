import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { submitExamAttemptAction } from '@/app/actions/exam';
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

  const adminClient = createAdminClient();

  // Fetch Attempt
  const { data: attempt } = await adminClient
    .from('exam_attempts')
    .select('*, subject:subjects(*)')
    .eq('id', attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    notFound();
  }

  // Redirect to results if already submitted or auto-submitted
  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    redirect(`/exam/${attemptId}/result`);
  }

  // Check if deadline has passed while student was away
  if (new Date() > new Date(attempt.expires_at)) {
    await submitExamAttemptAction(attemptId, true);
    redirect(`/exam/${attemptId}/result`);
  }

  // Fetch Attempt Questions ordered
  const { data: questions } = await adminClient
    .from('attempt_questions')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true });

  // Security: Sanitize question snapshots to prevent leaking explanations or answers to active test-takers
  const sanitizedQuestions = questions?.map((q: any) => {
    if (q.question_snapshot && typeof q.question_snapshot === 'object') {
      const { explanation, ...cleanSnapshot } = q.question_snapshot;
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
    />
  );
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { SpecialQuestionsManager } from './SpecialQuestionsManager';

export const dynamic = 'force-dynamic';

export default async function SpecialQuestionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/admin/questions/special');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  // Fetch canonical subjects for special questions: Accounting, Management Information, Taxation
  const { data: subjects } = await adminClient
    .from('subjects')
    .select('*')
    .in('name', ['Accounting', 'Management Information', 'Taxation'])
    .order('name');

  const subjectIds = (subjects || []).map((s) => s.id);

  // Fetch chapters for these subjects
  const { data: chapters } = await adminClient
    .from('chapters')
    .select('*')
    .in('subject_id', subjectIds)
    .order('chapter_number');

  // Fetch all Accounting Large Questions
  const { data: largeQuestions } = await adminClient
    .from('large_questions')
    .select('*, question:questions(*, subject:subjects(*), chapter:chapters(*))')
    .order('created_at', { ascending: false });

  // Fetch all Scenario Questions
  const { data: scenarioQuestions } = await adminClient
    .from('scenario_questions')
    .select('*, question:questions(*, subject:subjects(*), chapter:chapters(*))')
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      <SpecialQuestionsManager
        subjects={subjects || []}
        chapters={chapters || []}
        largeQuestions={largeQuestions || []}
        scenarioQuestions={scenarioQuestions || []}
      />
    </div>
  );
}

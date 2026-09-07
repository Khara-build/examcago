import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { SpecialBulkImportWorkflow } from './SpecialBulkImportWorkflow';

export const dynamic = 'force-dynamic';

export default async function SpecialBulkImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/admin/questions/special/import');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: subjects } = await adminClient
    .from('subjects')
    .select('id, name, code, slug')
    .in('name', ['Accounting', 'Management Information', 'Taxation'])
    .order('name');

  const subjectIds = (subjects || []).map((s) => s.id);

  const { data: chapters } = await adminClient
    .from('chapters')
    .select('id, name, subject_id, chapter_number')
    .in('subject_id', subjectIds)
    .order('chapter_number');

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      <SpecialBulkImportWorkflow
        subjects={subjects || []}
        chapters={chapters || []}
      />
    </div>
  );
}

import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { SubjectManager } from './SubjectManager';
import { BookOpen } from 'lucide-react';

export default async function AdminSubjectsPage() {
  const adminClient = createAdminClient();

  const { data: subjects } = await adminClient
    .from('subjects')
    .select('*, chapters(count)')
    .order('display_order');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-brand-red" />
          ICAB Subjects Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Database-driven subject directory supporting full CRUD, active status toggles, and safe deletion controls.
        </p>
      </div>

      <SubjectManager initialSubjects={subjects || []} />
    </div>
  );
}

import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ChapterManager } from './ChapterManager';
import { Layers } from 'lucide-react';

export default async function AdminChaptersPage() {
  const adminClient = createAdminClient();

  const { data: subjects } = await adminClient.from('subjects').select('id, name, code').order('display_order');
  const { data: chapters } = await adminClient.from('chapters').select('*, subject:subjects(*)').order('chapter_number');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="h-6 w-6 text-brand-red" />
          Chapter Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Organize syllabus topics into chapters and maintain strict subject-chapter relational integrity.
        </p>
      </div>

      <ChapterManager
        initialSubjects={subjects || []}
        initialChapters={chapters || []}
      />
    </div>
  );
}

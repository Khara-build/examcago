import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { LargeQuestionManager } from './LargeQuestionManager';
import { FileText } from 'lucide-react';

export default async function AdminLargeQuestionsPage() {
  const adminClient = createAdminClient();

  const { data: subjects } = await adminClient.from('subjects').select('id, name, code').order('display_order');
  const { data: chapters } = await adminClient.from('chapters').select('id, name, subject_id, chapter_number').order('chapter_number');
  const { data: largeQuestions } = await adminClient.from('large_questions').select('*, question:questions(*, subject:subjects(*))');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand-red" />
          Large Questions Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Create and manage 20-mark Accounting problem sets (Financial Statements, Cash Flow, Audit Reports).
        </p>
      </div>

      <LargeQuestionManager
        subjects={subjects || []}
        chapters={chapters || []}
        largeQuestions={largeQuestions || []}
      />
    </div>
  );
}

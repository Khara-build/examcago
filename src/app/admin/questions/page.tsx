import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { QuestionBankManager } from './QuestionBankManager';
import { HelpCircle } from 'lucide-react';

interface QuestionsPageProps {
  searchParams: Promise<{
    search?: string;
    subject?: string;
    chapter?: string;
    status?: string;
    type?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminQuestionsPage({ searchParams }: QuestionsPageProps) {
  const params = await searchParams;
  const adminClient = createAdminClient();

  const search = params.search || '';
  const subjectId = params.subject || 'all';
  const chapterId = params.chapter || 'all';
  const status = params.status || 'all';
  const questionType = params.type || 'all';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.max(10, parseInt(params.limit || '10', 10));
  const offset = (page - 1) * limit;

  // Build Supabase query with filters
  let query = adminClient
    .from('questions')
    .select('*, subject:subjects(*), chapter:chapters(*), options:question_options(*)', { count: 'exact' });

  if (search) {
    query = query.or(`question_text.ilike.%${search}%,explanation.ilike.%${search}%`);
  }

  if (subjectId !== 'all') {
    query = query.eq('subject_id', subjectId);
  }

  if (chapterId !== 'all') {
    query = query.eq('chapter_id', chapterId);
  }

  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (questionType !== 'all') {
    query = query.eq('question_type', questionType);
  }

  const { data: questions, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Fetch subjects and chapters for filter dropdowns
  const { data: subjects } = await adminClient.from('subjects').select('id, name, code').order('display_order');
  const { data: chapters } = await adminClient.from('chapters').select('id, name, subject_id, chapter_number').order('chapter_number');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-brand-red" />
          MCQ Question Bank Repository
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Server-side paginated question bank management with search, subject/chapter filters, and single MCQ controls.
        </p>
      </div>

      <QuestionBankManager
        questions={questions || []}
        subjects={subjects || []}
        chapters={chapters || []}
        totalCount={count || 0}
        currentPage={page}
        limit={limit}
        currentSearch={search}
        currentSubject={subjectId}
        currentChapter={chapterId}
        currentStatus={status}
        currentType={questionType}
      />
    </div>
  );
}

import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { QuestionReportsManager } from './QuestionReportsManager';
import { Flag } from 'lucide-react';

interface ReportsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    reason?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminQuestionReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const adminClient = createAdminClient();

  const search = params.search || '';
  const status = params.status || 'all';
  const reason = params.reason || 'all';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.max(10, parseInt(params.limit || '15', 10));
  const offset = (page - 1) * limit;

  // Build query
  let query = adminClient
    .from('question_reports')
    .select(
      `
        *,
        question:questions(
          id,
          question_text,
          question_type,
          explanation,
          subject:subjects(id, name, code),
          chapter:chapters(id, name, chapter_number),
          options:question_options(id, option_letter, option_text, is_correct)
        ),
        user:profiles(id, email, full_name),
        attempt:exam_attempts(id, title, status, score, total_marks, created_at)
      `,
      { count: 'exact' }
    );

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (reason !== 'all') {
    query = query.eq('reason', reason);
  }

  if (search) {
    query = query.or(`reason.ilike.%${search}%,details.ilike.%${search}%`);
  }

  const { data: reports, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Quick KPI metrics counts
  const { count: openCount } = await adminClient
    .from('question_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  const { count: reviewingCount } = await adminClient
    .from('question_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'reviewing');

  const { count: resolvedCount } = await adminClient
    .from('question_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Flag className="h-6 w-6 text-brand-red" />
          Question Review Reports
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review, triage, and resolve student-submitted question corrections, errors, and syllabus challenges.
        </p>
      </div>

      <QuestionReportsManager
        reports={reports || []}
        totalCount={count || 0}
        openCount={openCount || 0}
        reviewingCount={reviewingCount || 0}
        resolvedCount={resolvedCount || 0}
        currentPage={page}
        limit={limit}
        currentSearch={search}
        currentStatus={status}
        currentReason={reason}
      />
    </div>
  );
}

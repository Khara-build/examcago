import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { startExamAttemptAction } from '@/app/actions/exam';
import { Metadata } from 'next';
import { BookOpen, Clock, Award, Play, CheckCircle2, Coins, ArrowLeft, AlertTriangle, Upload } from 'lucide-react';
import { ExamLauncherButton } from './ExamLauncherButton';

export const dynamic = 'force-dynamic';

interface SubjectPageProps {
  params: Promise<{
    subject: string;
  }>;
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.subject;

  const adminClient = createAdminClient();
  const { data: subject } = await adminClient
    .from('subjects')
    .select('name, code, description')
    .eq('slug', slug)
    .maybeSingle();

  if (!subject) {
    return {
      title: 'Subject Not Found',
    };
  }

  const title = `${subject.name} (${subject.code}) Exam Prep & Question Bank`;
  const description = subject.description || `Prepare for ICAB Certificate Level ${subject.name} with chapter tests, full book mock exams, and real examination simulation.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://examcago.com/subjects/${slug}`,
    },
    openGraph: {
      title: `${title} — EXAM CAGO`,
      description,
      url: `https://examcago.com/subjects/${slug}`,
    },
  };
}

export default async function SubjectDetailPage({ params }: SubjectPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.subject;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole = 'student';
  let tokenBalance = 0;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile) userRole = profile.role;
    const { data: tokenAcc } = await supabase.from('token_accounts').select('balance').eq('user_id', user.id).single();
    if (tokenAcc) tokenBalance = tokenAcc.balance;
  }

  // Fetch subject detail with resilient admin fallback
  let subject: any = null;
  const { data: userSub, error: userSubErr } = await supabase
    .from('subjects')
    .select('*, exam_configs(*), chapters(*)')
    .eq('slug', slug)
    .single();

  if (userSub) {
    subject = userSub;
  } else {
    const adminClient = createAdminClient();
    const { data: adminSub } = await adminClient
      .from('subjects')
      .select('*, exam_configs(*), chapters(*)')
      .eq('slug', slug)
      .single();
    subject = adminSub;
  }

  if (!subject) {
    notFound();
  }

  const fullBookConfig = subject.exam_configs?.find((c: any) => c.exam_type === 'full_book') || subject.exam_configs?.[0];
  const chapters = subject.chapters || [];

  // Query actual question bank availability for this subject
  const adminClient = createAdminClient();
  const { count: activeMcqCount } = await adminClient
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subject.id)
    .eq('is_active', true)
    .eq('question_type', 'mcq');

  const availableCount = activeMcqCount || 0;
  const requiredCount = fullBookConfig?.mcq_count || 40;
  const isQuestionBankReady = availableCount >= requiredCount;

  // Check special question availability (Accounting: Large; MI & TAX: Scenario)
  let specialQuestionType: 'scenario' | 'large' | null = null;
  let requiredSpecialCount = 0;
  const subSlug = subject.slug?.toLowerCase() || '';
  const subCode = subject.code?.toUpperCase() || '';

  if (subCode === 'ACC' || subSlug === 'accounting') {
    specialQuestionType = 'large';
    requiredSpecialCount = 1;
  } else if (subCode === 'MI' || subSlug === 'management-information' || subCode === 'TAX' || subSlug === 'taxation') {
    specialQuestionType = 'scenario';
    requiredSpecialCount = 2;
  }

  let activeSpecialCount = 0;
  if (specialQuestionType) {
    const { count: specialCount } = await adminClient
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subject.id)
      .eq('is_active', true)
      .eq('question_type', specialQuestionType);
    activeSpecialCount = specialCount || 0;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={user ? { email: user.email!, role: userRole } : null} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Back Link */}
        <Link href="/subjects" className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-red mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Subjects
        </Link>

        {/* Subject Header Banner */}
        <Card className="bg-white border-gray-300 shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-brand-red bg-red-50 border border-red-200 px-3 py-1 rounded">
                  {subject.code}
                </span>
                <Badge variant="brand">Certificate Level</Badge>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">{subject.name}</h1>
              <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                {subject.description}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="bg-red-50/50 p-4 rounded-lg border border-red-100 min-w-[200px] text-center space-y-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Your Token Balance
              </div>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-brand-red">
                <Coins className="h-6 w-6" />
                <span>{tokenBalance}</span>
              </div>
              <div className="text-[11px] text-gray-500">
                1 Token required per exam attempt
              </div>
            </div>
          </div>
        </Card>

        {/* Available Examination Modes */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-brand-red" />
          Choose Examination Mode
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Full Book Exam Card */}
          <Card hoverable className="border-gray-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="brand">Full Book Test</Badge>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                  <Clock className="h-3.5 w-3.5 text-brand-red" />
                  <span>{fullBookConfig?.duration_minutes || 90} Mins</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                {fullBookConfig?.name || `${subject.name} Full Book Examination`}
              </h3>

              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Total Marks: <strong>{fullBookConfig?.total_marks || 100} Marks</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>MCQ Question Count: <strong>{fullBookConfig?.mcq_count || 40} Questions</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Server Timed Countdown & Immediate Evaluation</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6">
              {fullBookConfig && (
                <ExamLauncherButton
                  subjectId={subject.id}
                  subjectCode={subject.code}
                  examConfigId={fullBookConfig.id}
                  isLoggedIn={!!user}
                  tokenBalance={tokenBalance}
                  availableQuestions={availableCount}
                  requiredQuestions={requiredCount}
                  isAdmin={userRole === 'admin'}
                  specialQuestionType={specialQuestionType}
                  specialQuestionCount={activeSpecialCount}
                  requiredSpecialCount={requiredSpecialCount}
                />
              )}
            </div>
          </Card>

          {/* Chapter Wise Practice Card */}
          <Card hoverable className="border-gray-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="neutral">Chapter Practice</Badge>
                <span className="text-xs font-semibold text-gray-600">
                  {chapters.length} Chapters Available
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                Chapter-Wise Practice Tests
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed">
                Focus your preparation on specific chapters to master individual concepts before taking full book examinations.
              </p>

              <div className="space-y-1.5">
                {chapters.slice(0, 3).map((ch: any) => (
                  <div key={ch.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-700 flex justify-between">
                    <span>Chapter {ch.chapter_number}: {ch.name}</span>
                  </div>
                ))}
                {chapters.length > 3 && (
                  <div className="text-[11px] text-gray-500 italic text-right">
                    + {chapters.length - 3} more chapters
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6">
              <Link href={`/subjects/${subject.slug}/chapters`}>
                <Button variant="outline" className="w-full justify-center">
                  Browse Chapter List
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

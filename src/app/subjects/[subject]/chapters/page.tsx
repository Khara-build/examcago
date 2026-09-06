import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { ExamLauncherButton } from '../ExamLauncherButton';

export const dynamic = 'force-dynamic';

interface ChaptersPageProps {
  params: Promise<{
    subject: string;
  }>;
}

export async function generateMetadata({ params }: ChaptersPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.subject;

  const adminClient = createAdminClient();
  const { data: subject } = await adminClient
    .from('subjects')
    .select('name, code')
    .eq('slug', slug)
    .maybeSingle();

  if (!subject) {
    return {
      title: 'Subject Chapters Not Found',
    };
  }

  const title = `${subject.name} (${subject.code}) Chapter Breakdown & Syllabus`;
  const description = `Complete chapter-by-chapter syllabus breakdown and practice test access for ICAB ${subject.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://examcago.com/subjects/${slug}/chapters`,
    },
    openGraph: {
      title: `${title} — EXAM CAGO`,
      description,
      url: `https://examcago.com/subjects/${slug}/chapters`,
    },
  };
}

export default async function SubjectChaptersPage({ params }: ChaptersPageProps) {
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
  const { data: userSub } = await supabase
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

  if (!subject) notFound();

  const chapters = subject.chapters || [];
  const examConfig = subject.exam_configs?.[0];

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={user ? { email: user.email!, role: userRole } : null} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full">
        <Link href={`/subjects/${subject.slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-red mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {subject.name}
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
              {subject.code}
            </span>
            <Badge variant="brand">Chapter Directory</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">{subject.name} Chapters</h1>
          <p className="text-sm text-gray-600 mt-1">
            Explore chapter-wise syllabus modules and take targeted practice exams.
          </p>
        </div>

        <div className="space-y-4">
          {chapters.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-sm text-gray-500">No chapters configured yet for this subject.</p>
            </Card>
          ) : (
            chapters.map((ch: any) => (
              <Card key={ch.id} hoverable className="border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-red text-white font-bold text-sm">
                    Ch {ch.chapter_number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{ch.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{ch.description || 'Standard ICAB chapter module'}</p>
                  </div>
                </div>

                <div className="sm:w-64 shrink-0">
                  {examConfig ? (
                    <ExamLauncherButton
                      subjectId={subject.id}
                      examConfigId={examConfig.id}
                      chapterId={ch.id}
                      isLoggedIn={!!user}
                      tokenBalance={tokenBalance}
                      label="Practice Chapter (1 Token)"
                      variant="outline"
                      size="sm"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Config missing</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

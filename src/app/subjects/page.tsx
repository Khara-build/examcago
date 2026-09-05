import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Clock, ArrowRight, AlertCircle, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
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

  // Fetch subjects with relation data
  let subjectList: any[] = [];
  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*, exam_configs(*), chapters(*)')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Subjects Page] Error fetching subjects via user client:', error.message);
      // Fallback to admin client in case of RLS or anon key permission edge cases
      const adminClient = createAdminClient();
      const { data: adminSubjects, error: adminErr } = await adminClient
        .from('subjects')
        .select('*, exam_configs(*), chapters(*)')
        .order('display_order', { ascending: true });

      if (adminErr) {
        console.error('[Subjects Page] Error fetching subjects via admin client:', adminErr.message);
      } else if (adminSubjects) {
        subjectList = adminSubjects;
      }
    } else if (subjects) {
      subjectList = subjects;
    }
  } catch (fetchErr) {
    console.error('[Subjects Page Exception]:', fetchErr);
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={user ? { email: user.email!, role: userRole } : null} tokens={tokenBalance} />

      <main className="flex-1 py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-10 text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="brand">Certificate Level Directory</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            ICAB Exam Subjects (7)
          </h1>
          <p className="text-gray-600 leading-relaxed text-sm">
            All subjects are configured dynamically according to ICAB Certificate Level examination standards. Select any subject to view full book exams or chapter-wise practice tests.
          </p>
        </div>

        {subjectList.length === 0 ? (
          <div className="max-w-xl mx-auto">
            <Card className="text-center p-8 border-amber-300 bg-amber-50/40 space-y-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 mx-auto">
                <Database className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">No Subjects Detected in Database</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  The subject table is currently empty or cannot be reached. If you have just created your Supabase project, please ensure your real API keys are in <code className="bg-white px-1.5 py-0.5 rounded border text-gray-800">.env.local</code> and run the seed script from <code className="bg-white px-1.5 py-0.5 rounded border text-gray-800">supabase/schema.sql</code>.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectList.map((sub: any) => {
              const config = sub.exam_configs?.[0] || { duration_minutes: 90, total_marks: 100, mcq_count: 40 };
              const chapterCount = sub.chapters?.length || 0;

              return (
                <Card key={sub.id} hoverable className="flex flex-col justify-between border-gray-300">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-3 py-1 rounded">
                        {sub.code}
                      </span>
                      <Badge variant="neutral" className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span>{config.duration_minutes} Mins</span>
                      </Badge>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">{sub.name}</h2>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">
                      {sub.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
                      <div>
                        <span className="text-gray-500 block">Exam Duration:</span>
                        <strong className="text-gray-900">{config.duration_minutes} Minutes</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Total Marks:</span>
                        <strong className="text-gray-900">{config.total_marks} Marks</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Question Types:</span>
                        <strong className="text-gray-900">{config.mcq_count} MCQs</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Chapters:</span>
                        <strong className="text-gray-900">{chapterCount} Chapters</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <Link href={`/subjects/${sub.slug}/chapters`} className="text-xs font-medium text-gray-600 hover:text-brand-red">
                      View Chapters
                    </Link>
                    <Link href={`/subjects/${sub.slug}`}>
                      <Button variant="primary" size="sm" className="gap-1.5">
                        Select Subject
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

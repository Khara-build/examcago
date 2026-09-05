import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, Clock, Award, ArrowRight, Coins } from 'lucide-react';

export default async function DashboardExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const { data: tokenAcc } = await supabase.from('token_accounts').select('balance').eq('user_id', user.id).single();
  const { data: subjects } = await supabase.from('subjects').select('*, exam_configs(*)').order('display_order', { ascending: true });

  const tokenBalance = tokenAcc?.balance || 0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email!, role: profile?.role }} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ICAB Exam Launcher</h1>
            <p className="text-xs text-gray-500 mt-1">
              Select an ICAB subject to start full-book exams or chapter-wise practice tests.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-md border border-red-200">
            <Coins className="h-4 w-4 text-brand-red" />
            <span className="text-xs text-gray-600 font-medium">Balance:</span>
            <strong className="text-sm font-bold text-brand-red">{tokenBalance} Tokens</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((sub: any) => {
            const config = sub.exam_configs?.[0] || { duration_minutes: 90, total_marks: 100, mcq_count: 40 };
            return (
              <Card key={sub.id} hoverable className="border-gray-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <Badge variant="neutral">{config.duration_minutes} Mins</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{sub.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-4">{sub.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{config.total_marks} Marks</span>
                  <Link href={`/subjects/${sub.slug}`}>
                    <Button variant="primary" size="sm" className="gap-1">
                      Configure Exam
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

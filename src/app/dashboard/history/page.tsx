import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { History, CheckCircle2, XCircle, ArrowRight, Clock, Play } from 'lucide-react';

export default async function DashboardHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const { data: tokenAcc } = await supabase.from('token_accounts').select('balance').eq('user_id', user.id).single();

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, subject:subjects(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const attemptList = attempts || [];
  const tokenBalance = tokenAcc?.balance || 0;

  const totalAttempts = attemptList.length;
  const passedAttempts = attemptList.filter(a => a.is_passed).length;
  const bestScore = attemptList.reduce((max, a) => Math.max(max, a.score || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email!, role: profile?.role }} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-6 w-6 text-brand-red" />
              Examination History
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Review all past exam attempts, score breakdown, and attempt performance.
            </p>
          </div>
          <Link href="/dashboard/exams">
            <Button variant="primary" size="sm" className="gap-2">
              Retake an Exam
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* History Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-gray-300">
            <span className="text-xs text-gray-500 font-medium">Total Exam Attempts</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{totalAttempts}</div>
          </Card>
          <Card className="p-4 border-gray-300">
            <span className="text-xs text-gray-500 font-medium">Passed Exams</span>
            <div className="text-2xl font-bold text-green-700 mt-1">{passedAttempts}</div>
          </Card>
          <Card className="p-4 border-gray-300">
            <span className="text-xs text-gray-500 font-medium">Highest Score Achieved</span>
            <div className="text-2xl font-bold text-brand-red mt-1">{bestScore} Marks</div>
          </Card>
        </div>

        {/* Attempt History Table */}
        <Card className="p-0 border-gray-300 overflow-hidden">
          {attemptList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <History className="h-10 w-10 text-gray-400 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">No exam attempts found in your history.</p>
              <Link href="/dashboard/exams">
                <Button variant="primary" size="sm" className="mt-2">
                  Take Your First Exam
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Attempt #</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Score / Marks</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {attemptList.map((att: any, idx: number) => {
                    const attemptNum = totalAttempts - idx;
                    const isSubmitted = att.status === 'submitted' || att.status === 'auto_submitted';
                    const isInProgress = att.status === 'in_progress';

                    return (
                      <tr key={att.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono text-gray-500">
                          #{attemptNum}
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          {att.subject?.name || att.title}
                        </td>
                        <td className="p-4 capitalize text-gray-600">
                          {att.exam_type.replace('_', ' ')}
                        </td>
                        <td className="p-4">
                          {isSubmitted ? (
                            att.is_passed ? (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" /> PASSED
                              </Badge>
                            ) : (
                              <Badge variant="danger" className="gap-1">
                                <XCircle className="h-3 w-3" /> FAILED
                              </Badge>
                            )
                          ) : (
                            <Badge variant="warning" className="gap-1 animate-pulse">
                              <Clock className="h-3 w-3" /> IN PROGRESS
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          {isSubmitted ? `${att.score} / ${att.total_marks}` : '-'}
                        </td>
                        <td className="p-4 text-gray-500">
                          {new Date(att.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          {isInProgress ? (
                            <Link href={`/exam/${att.id}`}>
                              <Button variant="primary" size="sm" className="gap-1 bg-brand-red hover:bg-brand-red-dark">
                                <Play className="h-3.5 w-3.5" /> Resume Exam
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/exam/${att.id}/result`}>
                              <Button variant="outline" size="sm">
                                View Result
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}

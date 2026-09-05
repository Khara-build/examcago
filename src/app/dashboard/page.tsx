import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { getBangladeshDateString } from '@/app/actions/tokens';
import { 
  Coins, 
  Award, 
  History, 
  Share2, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  User
} from 'lucide-react';
import { DailyClaimWidget } from './DailyClaimWidget';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null; // Middleware handles redirect

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: tokenAcc } = await supabase
    .from('token_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, subject:subjects(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('display_order', { ascending: true });

  const todayBD = await getBangladeshDateString();
  const alreadyClaimedToday = tokenAcc?.last_daily_claim_date === todayBD;
  const tokenBalance = tokenAcc?.balance || 0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email!, role: profile?.role }} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div>
            <span className="text-xs font-semibold text-brand-red uppercase tracking-wider">
              Student Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Welcome, {profile?.full_name || user.email?.split('@')[0]}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              ICAB Certificate Level Exam Portal • {user.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/exams">
              <Button variant="primary" size="md" className="gap-2 shadow-sm">
                <BookOpen className="h-4 w-4" />
                Launch Practice Exam
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Token Balance & Daily Claim Widget */}
          <Card className="border-gray-300 shadow-sm bg-gradient-to-br from-white to-red-50/40">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm">
                <Coins className="h-5 w-5" />
                <span>Token Wallet</span>
              </div>
              <Badge variant="brand">Active</Badge>
            </div>

            <div className="py-4 text-center">
              <div className="text-4xl font-extrabold text-brand-red mb-1">
                {tokenBalance}
              </div>
              <div className="text-xs text-gray-500">Available Exam Tokens</div>
            </div>

            <DailyClaimWidget
              tokenBalance={tokenBalance}
              alreadyClaimedToday={alreadyClaimedToday}
              todayBD={todayBD}
            />
          </Card>

          {/* Quick Referral Bonus Widget */}
          <Card className="border-gray-300 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                  <Share2 className="h-5 w-5 text-brand-red" />
                  <span>Referral Rewards</span>
                </div>
                <Badge variant="neutral">Earn +1 Token</Badge>
              </div>

              <div className="space-y-3 py-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Share your unique referral code with fellow ICAB students. Earn <strong>1 bonus token</strong> for every new student registration.
                </p>
                <div className="bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Code:</span>
                  <strong className="text-sm font-mono font-bold text-brand-red tracking-wider">
                    {profile?.referral_code || 'CAGO-XXXXXX'}
                  </strong>
                </div>
              </div>
            </div>

            <Link href="/dashboard/referral">
              <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 mt-2">
                Manage Referral Code
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>

          {/* Exam History Quick Summary */}
          <Card className="border-gray-300 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                  <History className="h-5 w-5 text-brand-red" />
                  <span>Exam Statistics</span>
                </div>
                <Badge variant="info">{attempts?.length || 0} Total</Badge>
              </div>

              <div className="py-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Exams Attempted:</span>
                  <strong className="text-gray-900">{attempts?.length || 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Passed Exams:</span>
                  <strong className="text-green-700">{attempts?.filter(a => a.is_passed)?.length || 0}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Latest Status:</span>
                  <strong className="text-gray-900">
                    {attempts?.[0] ? `${attempts[0].score}/${attempts[0].total_marks} Marks` : 'No attempts yet'}
                  </strong>
                </div>
              </div>
            </div>

            <Link href="/dashboard/history">
              <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 mt-2">
                View Full Exam History
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Recent Exam Attempts Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-red" />
              Recent Exam Attempts
            </h2>
            <Link href="/dashboard/history" className="text-xs font-semibold text-brand-red hover:underline">
              View All Attempts →
            </Link>
          </div>

          <Card className="p-0 border-gray-300 overflow-hidden">
            {!attempts || attempts.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <BookOpen className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">No exam attempts recorded yet.</p>
                <p className="text-xs text-gray-500">Choose an ICAB subject below to start your first exam attempt.</p>
                <Link href="/dashboard/exams">
                  <Button variant="primary" size="sm" className="mt-2">
                    Start Your First Exam
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Exam Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {attempts.map((att: any) => (
                      <tr key={att.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-900">
                          {att.subject?.name || att.title}
                        </td>
                        <td className="p-4 capitalize text-gray-600">
                          {att.exam_type.replace('_', ' ')}
                        </td>
                        <td className="p-4">
                          {att.status === 'submitted' ? (
                            att.is_passed ? (
                              <Badge variant="success">PASSED</Badge>
                            ) : (
                              <Badge variant="danger">FAILED</Badge>
                            )
                          ) : (
                            <Badge variant="warning">IN PROGRESS</Badge>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-gray-900">
                          {att.status === 'submitted' ? `${att.score} / ${att.total_marks}` : '-'}
                        </td>
                        <td className="p-4 text-gray-500">
                          {new Date(att.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/exam/${att.id}/result`}>
                            <Button variant="outline" size="sm">
                              View Result
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Available Subjects Quick Launcher Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Start Practice by Subject</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects?.map((sub: any) => (
              <Card key={sub.id} hoverable className="p-4 border-gray-300 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-brand-red bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    {sub.code}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-2">{sub.name}</h3>
                </div>
                <Link href={`/subjects/${sub.slug}`} className="mt-4">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                    <span>Select</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

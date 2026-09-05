import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { getBangladeshDateString } from '@/app/actions/tokens';
import { Coins, Sparkles, ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { DailyClaimWidget } from '../DailyClaimWidget';

export default async function DashboardTokensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const { data: tokenAcc } = await supabase.from('token_accounts').select('*').eq('user_id', user.id).single();

  const { data: transactions } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const todayBD = await getBangladeshDateString();
  const alreadyClaimedToday = tokenAcc?.last_daily_claim_date === todayBD;
  const tokenBalance = tokenAcc?.balance || 0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email!, role: profile?.role }} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Coins className="h-6 w-6 text-brand-red" />
              Token Wallet & Ledger
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Track token balance, daily claims, exam deductions, and referral rewards.
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center min-w-[180px]">
            <span className="text-xs text-gray-500 font-semibold uppercase">Current Balance</span>
            <div className="text-3xl font-extrabold text-brand-red mt-0.5">{tokenBalance} Tokens</div>
          </div>
        </div>

        {/* Daily Claim Box */}
        <Card className="border-gray-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Daily Free Token Claim
            </CardTitle>
          </CardHeader>
          <DailyClaimWidget
            tokenBalance={tokenBalance}
            alreadyClaimedToday={alreadyClaimedToday}
            todayBD={todayBD}
          />
        </Card>

        {/* Token Transaction Ledger */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5 text-brand-red" />
            Transaction History Ledger
          </h2>

          <Card className="p-0 border-gray-300 overflow-hidden">
            {!transactions || transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No token transactions logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Type</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {transactions.map((tx: any) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <Badge variant={isPositive ? 'success' : 'danger'} className="capitalize">
                              {tx.transaction_type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-800 font-medium">
                            {tx.description}
                          </td>
                          <td className={`p-4 font-mono font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                            {isPositive ? `+${tx.amount}` : tx.amount} Token
                          </td>
                          <td className="p-4 text-right text-gray-500">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

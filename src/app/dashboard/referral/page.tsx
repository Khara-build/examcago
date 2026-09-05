import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { Share2, Gift, Users, Copy, CheckCircle2 } from 'lucide-react';
import { ReferralCopyButton } from './ReferralCopyButton';

export default async function DashboardReferralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: tokenAcc } = await supabase.from('token_accounts').select('balance').eq('user_id', user.id).single();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, referred_profile:profiles!referred_id(*)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const refList = referrals || [];
  const tokenBalance = tokenAcc?.balance || 0;
  const referralCode = profile?.referral_code || 'CAGO-EXAM';
  const referralLink = `https://examcago.com/register?ref=${referralCode}`;

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email!, role: profile?.role }} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Referral Program</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Invite fellow ICAB candidates and earn 1 bonus exam token per successful sign up.
              </p>
            </div>
          </div>
        </div>

        {/* Share Referral Box */}
        <Card className="border-gray-300 shadow-sm space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Gift className="h-5 w-5 text-brand-red" />
              Your Unique Referral Link & Code
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Referral Code
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xl font-mono font-bold text-brand-red bg-red-50 px-4 py-2 rounded border border-red-200 tracking-wider">
                  {referralCode}
                </span>
                <ReferralCopyButton textToCopy={referralCode} label="Copy Code" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Direct Registration Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded text-gray-700 focus:outline-none"
                />
                <ReferralCopyButton textToCopy={referralLink} label="Copy Link" />
              </div>
            </div>
          </div>
        </Card>

        {/* Referral Rules */}
        <Card className="border-gray-300 space-y-3 bg-amber-50/40">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-700" />
            Referral Reward Rules
          </h3>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-5">
            <li>When a new student registers using your referral code, you automatically receive <strong>1 bonus token</strong>.</li>
            <li>Self-referrals and duplicate rewards for the same account are strictly prevented.</li>
            <li>Tokens earned from referrals never expire and remain in your account.</li>
          </ul>
        </Card>

        {/* Referred Students List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-red" />
            Referred Students ({refList.length})
          </h2>

          <Card className="p-0 border-gray-300 overflow-hidden">
            {refList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                You haven't referred any students yet. Share your code above to start earning bonus tokens!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Referred Student</th>
                      <th className="p-4">Reward</th>
                      <th className="p-4 text-right">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {refList.map((ref: any) => (
                      <tr key={ref.id} className="hover:bg-gray-50">
                        <td className="p-4 font-semibold text-gray-900">
                          {ref.referred_profile?.full_name || ref.referred_profile?.email || 'Registered Student'}
                        </td>
                        <td className="p-4 text-green-700 font-bold">
                          +{ref.reward_tokens} Token
                        </td>
                        <td className="p-4 text-right text-gray-500">
                          {new Date(ref.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
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

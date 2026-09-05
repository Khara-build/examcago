import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { Share2 } from 'lucide-react';

export default async function AdminReferralsPage() {
  const adminClient = createAdminClient();

  const { data: refs } = await adminClient
    .from('referrals')
    .select('*, referrer:profiles!referrer_id(*), referred:profiles!referred_id(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="h-6 w-6 text-brand-red" />
          Global Referral System Audit Log
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Monitor referrer and referee transactions and bonus token distributions.
        </p>
      </div>

      <Card className="p-0 border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="p-4">Referrer Student</th>
                <th className="p-4">Referred Student</th>
                <th className="p-4">Reward Token</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {refs?.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{r.referrer?.full_name || r.referrer?.email}</td>
                  <td className="p-4 font-medium text-gray-800">{r.referred?.full_name || r.referred?.email}</td>
                  <td className="p-4 text-green-700 font-bold">+{r.reward_tokens} Token</td>
                  <td className="p-4"><Badge variant="success">Completed</Badge></td>
                  <td className="p-4 text-right text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

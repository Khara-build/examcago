import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { Coins } from 'lucide-react';

export default async function AdminTokensPage() {
  const adminClient = createAdminClient();

  const { data: txs } = await adminClient
    .from('token_transactions')
    .select('*, profile:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Coins className="h-6 w-6 text-brand-red" />
          Global Token Ledger
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Complete ledger of daily token claims, exam deductions, and referral rewards.
        </p>
      </div>

      <Card className="p-0 border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Transaction Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {txs?.map((tx: any) => {
                const isPos = tx.amount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{tx.profile?.full_name || tx.profile?.email}</td>
                    <td className="p-4">
                      <Badge variant={isPos ? 'success' : 'danger'} className="capitalize">
                        {tx.transaction_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-700">{tx.description}</td>
                    <td className={`p-4 font-mono font-bold ${isPos ? 'text-green-700' : 'text-red-700'}`}>
                      {isPos ? `+${tx.amount}` : tx.amount} Token
                    </td>
                    <td className="p-4 text-right text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

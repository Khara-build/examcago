import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { grantUserTokensAction } from '@/app/actions/admin';
import { Users, Coins, Plus } from 'lucide-react';
import { AdminGrantTokensModal } from './AdminGrantTokensModal';

export default async function AdminUsersPage() {
  const adminClient = createAdminClient();

  const { data: users } = await adminClient
    .from('profiles')
    .select('*, token_accounts(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-red" />
          Registered Student Accounts ({users?.length || 0})
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Inspect student accounts, referral metrics, and adjust token balances securely.
        </p>
      </div>

      <Card className="p-0 border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="p-4">Student Name</th>
                <th className="p-4">Gmail Address</th>
                <th className="p-4">Role</th>
                <th className="p-4">Referral Code</th>
                <th className="p-4">Token Balance</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users?.map((u: any) => {
                const balance = u.token_accounts?.[0]?.balance ?? 0;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{u.full_name}</td>
                    <td className="p-4 text-gray-700">{u.email}</td>
                    <td className="p-4">
                      <Badge variant={u.role === 'admin' ? 'brand' : 'neutral'} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-semibold text-brand-red">{u.referral_code}</td>
                    <td className="p-4 font-bold text-gray-900">{balance} Tokens</td>
                    <td className="p-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <AdminGrantTokensModal targetUserId={u.id} userEmail={u.email} />
                    </td>
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

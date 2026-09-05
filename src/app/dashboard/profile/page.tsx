import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { User, Mail, Shield, Key, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Resilient profile fetch with adminClient fallback to prevent RLS recursion edge cases
  let profile: any = null;
  const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (userProfile) {
    profile = userProfile;
  } else {
    const adminClient = createAdminClient();
    const { data: adminProfile } = await adminClient.from('profiles').select('*').eq('id', user.id).single();
    profile = adminProfile;
  }

  // Resilient token account fetch
  let tokenBalance = 0;
  const { data: userTokenAcc } = await supabase.from('token_accounts').select('balance').eq('user_id', user.id).single();
  if (userTokenAcc) {
    tokenBalance = userTokenAcc.balance;
  } else {
    const adminClient = createAdminClient();
    const { data: adminTokenAcc } = await adminClient.from('token_accounts').select('balance').eq('user_id', user.id).single();
    if (adminTokenAcc) tokenBalance = adminTokenAcc.balance;
  }

  // Safe fallback values for UI display
  const userRole = profile?.role || user.user_metadata?.role || 'student';
  const memberSinceRaw = profile?.created_at || user.created_at;
  const memberSinceFormatted = memberSinceRaw && !isNaN(new Date(memberSinceRaw).getTime())
    ? new Date(memberSinceRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently Joined';

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email!, role: userRole }} tokens={tokenBalance} />

      <main className="flex-1 py-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-white font-bold text-xl">
            {(profile?.full_name || user.email || 'S')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Student Profile'}</h1>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        <Card className="border-gray-300 space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-brand-red" />
              Account Details
            </CardTitle>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block mb-1">Full Name</span>
              <strong className="text-gray-900 text-sm">{profile?.full_name}</strong>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block mb-1">Gmail Address</span>
              <strong className="text-gray-900 text-sm">{profile?.email}</strong>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block mb-1">Role Permission</span>
              <Badge variant={userRole === 'admin' ? 'brand' : 'neutral'} className="capitalize font-semibold">
                {userRole}
              </Badge>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block mb-1">Referral Code</span>
              <strong className="text-brand-red font-mono text-sm">{profile?.referral_code || 'N/A'}</strong>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block mb-1">Member Since</span>
              <span className="text-gray-900 font-medium">{memberSinceFormatted}</span>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block mb-1">Token Balance</span>
              <strong className="text-brand-red text-sm">{tokenBalance} Tokens</strong>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

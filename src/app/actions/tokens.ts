'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Helper to calculate current Bangladesh date string (YYYY-MM-DD)
export async function getBangladeshDateString(): Promise<string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Outputs YYYY-MM-DD
}

export async function claimDailyTokenAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  const todayBD = await getBangladeshDateString();
  const adminClient = createAdminClient();

  // Fetch current token account
  const { data: tokenAcc } = await adminClient
    .from('token_accounts')
    .select('balance, last_daily_claim_date')
    .eq('user_id', user.id)
    .single();

  if (!tokenAcc) {
    return { error: 'Token account not found.' };
  }

  if (tokenAcc.last_daily_claim_date === todayBD) {
    return { error: 'You have already claimed your free token for today. Please check back tomorrow!' };
  }

  // Update balance & last claim date
  const { error: updateError } = await adminClient
    .from('token_accounts')
    .update({
      balance: tokenAcc.balance + 1,
      last_daily_claim_date: todayBD,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Record ledger transaction
  await adminClient.from('token_transactions').insert({
    user_id: user.id,
    amount: 1,
    transaction_type: 'daily_claim',
    description: `Daily free token claimed for ${todayBD} (BD Local Time)`,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/tokens');

  return { success: true, newBalance: tokenAcc.balance + 1 };
}

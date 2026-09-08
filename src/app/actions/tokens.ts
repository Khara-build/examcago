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

  // 1. Try atomic PostgreSQL RPC if available
  try {
    const { data: rpcRes, error: rpcErr } = await adminClient.rpc('claim_daily_token', {
      p_user_id: user.id,
      p_claim_date: todayBD,
    });
    if (!rpcErr && rpcRes) {
      if (rpcRes.success) {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/tokens');
        return { success: true, newBalance: rpcRes.new_balance };
      } else if (rpcRes.error) {
        return { error: rpcRes.error };
      }
    }
  } catch {
    // Fall back to concurrency-safe application logic
  }

  // 2. Concurrency-safe fallback:
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

  // Concurrency-safe conditional update: update ONLY IF last_daily_claim_date is still not todayBD
  const { data: updatedRows, error: updateError } = await adminClient
    .from('token_accounts')
    .update({
      balance: tokenAcc.balance + 1,
      last_daily_claim_date: todayBD,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .or(`last_daily_claim_date.is.null,last_daily_claim_date.neq.${todayBD}`)
    .select('balance');

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return { error: 'You have already claimed your free token for today. Please check back tomorrow!' };
  }

  // Record ledger transaction atomically
  await adminClient.from('token_transactions').insert({
    user_id: user.id,
    amount: 1,
    transaction_type: 'daily_claim',
    description: `Daily free token claimed for ${todayBD} (BD Local Time)`,
  });

  // Reconcile and derive authoritative balance directly from ledger sum
  const { data: allTxs } = await adminClient
    .from('token_transactions')
    .select('amount')
    .eq('user_id', user.id);

  const authoritativeBalance = (allTxs || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  if (authoritativeBalance !== updatedRows[0]?.balance) {
    await adminClient
      .from('token_accounts')
      .update({
        balance: Math.max(0, authoritativeBalance),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/tokens');

  return { success: true, newBalance: authoritativeBalance };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { sendWelcomeEmail } from '@/lib/email';

function isRedirectError(err: any): boolean {
  return typeof err?.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT');
}

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl || supabaseUrl.includes('example.supabase.co')) {
    console.error('[Auth Error] Supabase URL is unconfigured or pointing to placeholder example.supabase.co');
    return { 
      error: 'Supabase is not configured yet. Please set your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.' 
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth Login Error]:', error.message);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { 
          error: 'Your Gmail address has not been confirmed yet. Please check your inbox, or disable email confirmation in Supabase Project Settings -> Authentication -> Providers -> Email.' 
        };
      }
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { error: 'Invalid Gmail address or password. Please check your credentials and try again.' };
      }
      return { error: error.message };
    }

    return { success: true, redirectTo };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    console.error('[Auth Login Exception]:', err);
    return { 
      error: 'Unable to connect to authentication server. Please check your internet connection and Supabase credentials in .env.local.' 
    };
  }
}

export async function registerAction(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const referralCode = (formData.get('referralCode') as string || '').trim().toUpperCase();
  const fullName = (formData.get('fullName') as string || '').trim();

  // Mandatory Gmail Validation Rule
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!gmailRegex.test(email)) {
    return { error: 'Only valid @gmail.com email addresses are allowed for registration.' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl || supabaseUrl.includes('example.supabase.co')) {
    console.error('[Auth Error] Supabase URL is unconfigured or pointing to placeholder example.supabase.co');
    return { 
      error: 'Supabase is not configured yet. Please set your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.' 
    };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://examcago.com' : 'http://localhost:3000');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
        data: {
          full_name: fullName || email.split('@')[0],
          referral_code: referralCode,
          role: 'student',
        },
      },
    });

    if (error) {
      console.error('[Auth SignUp Error]:', error.message);
      if (error.message.toLowerCase().includes('user already registered')) {
        return { error: 'An account with this Gmail address already exists. Please sign in instead.' };
      }
      return { error: error.message };
    }

    if (data?.user) {
      const userId = data.user.id;

      // Resilient Fallback: Ensure profile & token account exist in case DB trigger is missing/pending
      try {
        await ensureUserProfileAndTokens({
          userId,
          email,
          fullName: fullName || email.split('@')[0],
          referralCode,
        });
      } catch (profileErr) {
        console.warn('[Profile Fallback Warning]:', profileErr);
      }

      // Check whether session exists (email confirmation disabled vs enabled)
      if (data.session) {
        redirect('/dashboard');
      } else {
        redirect(`/login?registered=confirm_email&email=${encodeURIComponent(email)}`);
      }
    }

    return { success: true };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    console.error('[Auth Register Exception]:', err);
    return { 
      error: 'Unable to connect to authentication server. Please check your internet connection and Supabase credentials in .env.local.' 
    };
  }
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[Auth SignOut Error]:', err);
  }
  redirect('/login');
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!email || !gmailRegex.test(email)) {
    return { error: 'Please enter a valid @gmail.com address.' };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://examcago.com' : 'http://localhost:3000');
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('[Auth Reset Password Error]:', error.message);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Auth Reset Password Exception]:', err);
    return { error: 'Failed to send recovery email. Please try again.' };
  }
}

export async function updatePasswordAction(formData: FormData) {
  const password = (formData.get('password') as string || '');
  const confirmPassword = (formData.get('confirmPassword') as string || '');

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Both passwords must match.' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No active recovery session found. Please click the reset link in your email again.' };
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('[Auth Update Password Error]:', error.message);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Auth Update Password Exception]:', err);
    return { error: 'Failed to update password. Please try again.' };
  }
}

export async function ensureUserProfileAndTokens({
  userId,
  email,
  fullName,
  referralCode,
}: {
  userId: string;
  email: string;
  fullName?: string;
  referralCode?: string;
}) {
  const adminClient = createAdminClient();
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    // Ensure token account exists even if profile already existed
    const { data: existingTokenAcc } = await adminClient
      .from('token_accounts')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingTokenAcc) {
      await adminClient.from('token_accounts').insert({
        user_id: userId,
        balance: 1,
      });
      await adminClient.from('token_transactions').insert({
        user_id: userId,
        amount: 1,
        transaction_type: 'welcome_bonus',
        description: 'Welcome bonus token on registration',
      });
    }

    return { profile: existingProfile, isNew: false };
  }

  // Profile does not exist: create it cleanly
  const generatedRefCode = 'CAGO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  let referrerUserId: string | null = null;
  if (referralCode) {
    const { data: refUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle();
    if (refUser) referrerUserId = refUser.id;
  }

  const { data: newProfile, error: profileInsertError } = await adminClient
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: fullName || email.split('@')[0],
      role: 'student',
      referral_code: generatedRefCode,
      referred_by: referrerUserId,
    })
    .select('id, role')
    .single();

  if (profileInsertError) {
    console.warn('[ensureUserProfileAndTokens Insert Error]:', profileInsertError.message);
  }

  // Provision token account
  const { data: existingTokenAcc } = await adminClient
    .from('token_accounts')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingTokenAcc) {
    await adminClient.from('token_accounts').insert({
      user_id: userId,
      balance: 1,
    });
    await adminClient.from('token_transactions').insert({
      user_id: userId,
      amount: 1,
      transaction_type: 'welcome_bonus',
      description: 'Welcome bonus token on registration',
    });
  }

  // Reward Referrer if valid
  if (referrerUserId && referrerUserId !== userId) {
    const { data: existingRef } = await adminClient
      .from('referrals')
      .select('id')
      .eq('referred_id', userId)
      .maybeSingle();

    if (!existingRef) {
      await adminClient.from('referrals').insert({
        referrer_id: referrerUserId,
        referred_id: userId,
        reward_tokens: 1,
        status: 'completed',
      });
      await adminClient.from('token_transactions').insert({
        user_id: referrerUserId,
        amount: 1,
        transaction_type: 'referral_bonus',
        description: `Bonus token for referring new student: ${email}`,
      });
      const { data: refTxs } = await adminClient
        .from('token_transactions')
        .select('amount')
        .eq('user_id', referrerUserId);
      const newRefBalance = (refTxs || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      await adminClient.from('token_accounts').upsert({
        user_id: referrerUserId,
        balance: Math.max(0, newRefBalance),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Dispatch Welcome Email asynchronously without blocking
  sendWelcomeEmail({ to: email, name: fullName }).catch((e) => {
    console.warn('[Welcome Email Non-blocking Error]:', e);
  });

  return { profile: newProfile || { id: userId, role: 'student' }, isNew: true };
}


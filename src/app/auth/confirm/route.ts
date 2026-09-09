import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserProfileAndTokens } from '@/app/actions/auth';

const VALID_EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
] as const;

/**
 * Sanitizes redirect destination to prevent open redirect vulnerabilities.
 * Ensures the destination is strictly a safe relative path.
 */
function sanitizeRedirectUrl(next: string | null): string {
  if (!next) return '/dashboard';
  const trimmed = next.trim();

  // Must start with exactly one '/' and not contain protocol or relative slash tricks
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\')
  ) {
    try {
      const parsed = new URL(trimmed, 'https://examcago.com');
      if (parsed.origin === 'https://examcago.com') {
        return parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      return '/dashboard';
    }
  }
  return '/dashboard';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const typeParam = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = requestUrl.searchParams.get('next');
  const origin = requestUrl.origin;

  // Check for error parameters returned from provider or Supabase
  const errorParam = requestUrl.searchParams.get('error') || requestUrl.searchParams.get('error_description');
  if (errorParam) {
    console.error('[Auth Confirm Provider Error]:', errorParam);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  const safeNext = sanitizeRedirectUrl(next);

  // Validate token_hash and type parameters
  if (token_hash && typeParam && VALID_EMAIL_OTP_TYPES.includes(typeParam)) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type: typeParam,
      token_hash,
    });

    if (!error) {
      // 1. Password Recovery Flow
      if (typeParam === 'recovery' || (next && next.includes('reset-password'))) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      // 2. Email Confirmation / Signup Flow
      const user = data?.user || (await supabase.auth.getUser()).data?.user;

      if (user && user.email) {
        const email = user.email.toLowerCase().trim();
        const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);

        // Security Policy: Only valid @gmail.com accounts are permitted
        if (!isGmail) {
          console.warn(`[Confirm Policy Rejection]: Non-Gmail address attempted confirmation: ${email}`);
          await supabase.auth.signOut();
          const errorMsg = 'Only valid @gmail.com email addresses are allowed to sign in to Exam CAGO.';
          return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
        }

        try {
          const { profile } = await ensureUserProfileAndTokens({
            userId: user.id,
            email,
            fullName: user.user_metadata?.full_name || user.user_metadata?.name,
            referralCode: user.user_metadata?.referral_code,
          });

          // If user has admin role, redirect to /admin unless a custom non-dashboard route was requested
          if (profile?.role === 'admin') {
            const adminDestination = safeNext && safeNext !== '/dashboard' ? safeNext : '/admin';
            return NextResponse.redirect(`${origin}${adminDestination}`);
          }
        } catch (e: any) {
          console.warn('[Confirm User Profile Provisioning Warning]:', e?.message || e);
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    } else {
      console.error('[Auth Confirm OTP Error]:', error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message || 'Invalid or expired confirmation link.')}`
      );
    }
  }

  // Fallback for missing or invalid parameters
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Invalid or expired confirmation link.')}`
  );
}

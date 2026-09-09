import { createClient } from '@/lib/supabase/server';
import { ensureUserProfileAndTokens } from '@/app/actions/auth';
import { NextResponse } from 'next/server';

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
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');
  const referral = requestUrl.searchParams.get('ref');
  const origin = requestUrl.origin;

  // Check for error parameters returned from provider or Supabase
  const errorParam = requestUrl.searchParams.get('error') || requestUrl.searchParams.get('error_description');
  if (errorParam) {
    console.error('[Auth Callback Provider Error]:', errorParam);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  const safeNext = sanitizeRedirectUrl(next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 1. Password Recovery Flow
      if (type === 'recovery' || (next && next.includes('reset-password'))) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      // 2. OAuth or Email Confirmation Flow
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.email) {
        const email = user.email.toLowerCase().trim();
        const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);

        // Security Policy: Only valid @gmail.com accounts are permitted
        if (!isGmail) {
          console.warn(`[OAuth Policy Rejection]: Non-Gmail address attempted Google sign-in: ${email}`);
          // Terminate the authenticated session immediately
          await supabase.auth.signOut();
          const errorMsg = 'Only valid @gmail.com email addresses are allowed to sign in to Exam CAGO.';
          return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
        }

        try {
          const { profile } = await ensureUserProfileAndTokens({
            userId: user.id,
            email,
            fullName: user.user_metadata?.full_name || user.user_metadata?.name,
            referralCode: referral || user.user_metadata?.referral_code,
          });

          // If user has admin role, redirect to /admin unless a custom non-dashboard route was requested
          if (profile?.role === 'admin') {
            const adminDestination = safeNext && safeNext !== '/dashboard' ? safeNext : '/admin';
            return NextResponse.redirect(`${origin}${adminDestination}`);
          }
        } catch (e: any) {
          console.warn('[OAuth User Profile Provisioning Warning]:', e?.message || e);
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    } else {
      console.error('[Auth Callback Session Error]:', error.message);
      if (type === 'recovery' || (next && next.includes('reset-password'))) {
        return NextResponse.redirect(`${origin}/auth/reset-password?error=${encodeURIComponent(error.message)}`);
      }
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Fallback if no code is provided
  return NextResponse.redirect(`${origin}/login`);
}


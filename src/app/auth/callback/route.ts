import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/auth/reset-password';
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const destination = (type === 'recovery' || next.includes('reset-password'))
        ? '/auth/reset-password'
        : next;
      return NextResponse.redirect(`${origin}${destination}`);
    } else {
      console.error('[Auth Callback Error]:', error.message);
      return NextResponse.redirect(`${origin}/auth/reset-password?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If no code parameter was provided, redirect to reset-password
  return NextResponse.redirect(`${origin}/auth/reset-password`);
}

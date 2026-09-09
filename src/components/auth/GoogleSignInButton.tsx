'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  redirectTo?: string;
  referralCode?: string;
  onError?: (error: string) => void;
  className?: string;
}

export function GoogleSignInButton({
  redirectTo = '/dashboard',
  referralCode,
  onError,
  className = '',
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    if (onError) onError('');

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      
      const callbackUrl = new URL(`${origin}/auth/callback`);
      if (redirectTo) {
        callbackUrl.searchParams.set('next', redirectTo);
      }
      if (referralCode && referralCode.trim()) {
        callbackUrl.searchParams.set('ref', referralCode.trim().toUpperCase());
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[Google OAuth Error]:', error.message);
        if (onError) onError(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[Google OAuth Exception]:', err);
      const message = err?.message || 'Failed to initiate Google authentication. Please try again.';
      if (onError) onError(message);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      aria-label="Continue with Google"
      className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          {/* Official Google 'G' Multicolor Logo SVG */}
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15C6.23 6.85 8.88 4.75 12 4.75z"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

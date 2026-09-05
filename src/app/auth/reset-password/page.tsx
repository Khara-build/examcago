'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // 1. Check for URL error parameters from Supabase redirect
    const urlError = searchParams.get('error') || searchParams.get('error_description');
    if (urlError) {
      setError(decodeURIComponent(urlError));
      setIsReady(true);
      return;
    }

    // 2. Check for hash fragments containing recovery token or error (implicit flow support)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        setError(decodeURIComponent(hashError));
        setIsReady(true);
        return;
      }
    }

    // 3. Handle PKCE code if directly passed to this route
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeErr }) => {
        if (exchangeErr) {
          console.error('[Auth Exchange Error]:', exchangeErr);
          setError(exchangeErr.message);
        }
        setIsReady(true);
      });
      return;
    }

    // 4. Listen for auth state changes (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsReady(true);
        setError(null);
      }
    });

    // 5. Check if an active session is already present
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      } else {
        // Allow a short buffer for client-side token extraction from hash/cookies
        setTimeout(() => {
          setIsReady(true);
        }, 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!password) {
      setError('New password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Both passwords must match.');
      return;
    }

    setIsLoading(true);

    try {
      // Secure password update via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('[Update Password Error]:', updateError);
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Successful update
      setIsSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    } catch (err: any) {
      console.error('[Update Password Exception]:', err);
      setError('An unexpected error occurred while updating your password. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg border-gray-300">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red text-white mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {isSuccess ? 'Password Updated!' : 'Set New Password'}
        </CardTitle>
        <CardDescription>
          {isSuccess
            ? 'Your account password has been successfully reset'
            : 'Enter and confirm your new account password'}
        </CardDescription>
      </CardHeader>

      {/* Success View */}
      {isSuccess && (
        <div className="space-y-6 pt-2 text-center">
          <div className="p-4 rounded-md bg-green-50 border border-green-200 text-xs text-green-800 space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Password Changed Successfully</span>
            </div>
            <p className="text-gray-600">
              Your password has been updated securely. You can now log in to Exam CAGO using your new credentials.
            </p>
          </div>

          <Link href="/login" className="block w-full">
            <Button variant="primary" size="lg" className="w-full gap-2 bg-brand-red hover:bg-brand-red-dark">
              Sign In to Your Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Reset Form View */}
      {!isSuccess && (
        <>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Must be at least 6 characters.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter your new password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 bg-brand-red hover:bg-brand-red-dark"
              isLoading={isLoading}
            >
              Update Password
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-brand-red hover:underline">
              Back to Sign In
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="text-center text-xs text-gray-500 py-10">Loading Password Reset Form...</div>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

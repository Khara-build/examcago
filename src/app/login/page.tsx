'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { loginAction } from '@/app/actions/auth';
import { BookOpen, AlertCircle } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append('redirectTo', redirectTo);

    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  const registered = searchParams.get('registered');
  const registeredEmail = searchParams.get('email');

  return (
    <Card className="shadow-lg border-gray-300">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red text-white mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Student Sign In</CardTitle>
        <CardDescription>
          Access your ICAB exam portal & question banks
        </CardDescription>
      </CardHeader>

      {registered && (
        <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-xs text-green-800 space-y-1">
          <strong className="block font-semibold">Registration Successful!</strong>
          <p>
            Your account has been created with 1 Free Token.
            {registered === 'confirm_email'
              ? ` If your Supabase project requires email verification, please check ${registeredEmail || 'your Gmail inbox'} to confirm your address before signing in.`
              : ' You can now sign in with your Gmail credentials.'}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Gmail Address
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="student@gmail.com"
            className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Password
            </label>
          </div>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
          />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
          Sign In to EXAM CAGO
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        Don't have a student account?{' '}
        <Link href="/register" className="font-semibold text-brand-red hover:underline">
          Register with Gmail
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="text-center text-xs text-gray-500 py-10">Loading Sign In Form...</div>}>
            <LoginFormContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

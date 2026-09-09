'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { registerAction } from '@/app/actions/auth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { BookOpen, AlertCircle, Gift } from 'lucide-react';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const initialReferral = searchParams.get('ref') || '';

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState(initialReferral);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string || '').trim().toLowerCase();

    // Client-side quick check for @gmail.com
    if (!email.endsWith('@gmail.com')) {
      setError('Only valid @gmail.com email addresses are allowed for registration.');
      return;
    }

    setIsLoading(true);

    const result = await registerAction(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg border-gray-300">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red text-white mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Student Registration</CardTitle>
        <CardDescription>
          Create your ICAB Certificate Level account
        </CardDescription>
      </CardHeader>

      <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
        <Gift className="h-4 w-4 shrink-0 text-amber-700" />
        <span>Get <strong>1 Free Welcome Token</strong> immediately upon registration!</span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google OAuth Option */}
      <div className="space-y-4 mb-4">
        <GoogleSignInButton 
          redirectTo="/dashboard" 
          referralCode={referralCode}
          onError={(err) => setError(err)} 
        />

        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">OR REGISTER WITH EMAIL</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            required
            placeholder="e.g. Tanvir Ahmed"
            className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Gmail Address <span className="text-brand-red font-bold">(@gmail.com only)</span>
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="yourname@gmail.com"
            className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">
            Must end with @gmail.com
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="Min 6 chars"
              className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Repeat password"
              className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            name="referralCode"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="e.g. CAGO-A1B2C3"
            className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white uppercase"
          />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
          Create Account & Claim Token
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand-red hover:underline">
          Sign In
        </Link>
      </div>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="text-center text-xs text-gray-500 py-10">Loading Registration Form...</div>}>
            <RegisterFormContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

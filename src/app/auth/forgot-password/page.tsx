'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { requestPasswordResetAction } from '@/app/actions/auth';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordResetAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-gray-300">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red text-white mb-3">
                <Mail className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
              <CardDescription>
                We'll send a secure password recovery link to your Gmail inbox
              </CardDescription>
            </CardHeader>

            {isSuccess ? (
              <div className="space-y-6 pt-2 text-center">
                <div className="p-4 rounded-md bg-green-50 border border-green-200 text-xs text-green-800 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Recovery Email Sent</span>
                  </div>
                  <p className="text-gray-600">
                    If an account with <strong>{email}</strong> exists, you will receive an email containing a link to reset your password.
                  </p>
                  <p className="text-[11px] text-gray-500 pt-1">
                    Please check your inbox and spam folder. Click the link to set your new password.
                  </p>
                </div>

                <Link href="/login" className="block w-full">
                  <Button variant="outline" size="md" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
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
                      Registered Gmail Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full mt-2 bg-brand-red hover:bg-brand-red-dark"
                    isLoading={isLoading}
                  >
                    Send Recovery Link
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

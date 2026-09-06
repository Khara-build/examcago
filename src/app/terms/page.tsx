import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { FileText, ShieldAlert, CheckCircle2, Scale, Coins } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Exam CAGO. Review our platform guidelines, token rules, and educational usage terms.',
  alternates: {
    canonical: 'https://examcago.com/terms',
  },
};

export default async function TermsOfServicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole = 'student';
  let tokenBalance = 0;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile) userRole = profile.role;
    const { data: tokenAcc } = await supabase.from('token_accounts').select('balance').eq('user_id', user.id).single();
    if (tokenAcc) tokenBalance = tokenAcc.balance;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={user ? { email: user.email!, role: userRole } : null} tokens={tokenBalance} />

      <main className="flex-1 py-12 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-brand-red border border-red-200">
            <Scale className="h-4 w-4" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Last updated: September 6, 2026. Please read these terms carefully before utilizing Exam CAGO services.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-gray-300 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-red" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing Exam CAGO (examcago.com) or creating a student account, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-red" />
              2. Educational Purpose & Independence
            </h2>
            <p>
              Exam CAGO is an independent online learning and practice portal designed to assist candidates preparing for the Institute of Chartered Accountants of Bangladesh (ICAB) Certificate Level examinations. While our content aligns with published syllabuses, Exam CAGO is an independent platform and does not officially confer ICAB credentials or official test certifications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Coins className="h-4 w-4 text-brand-red" />
              3. Token System & Examination Attempts
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Daily Free Token:</strong> Each registered student account is eligible to claim one (1) free token per Bangladesh calendar day (Asia/Dhaka timezone).</li>
              <li><strong>Token Accumulation:</strong> Unused tokens do not expire daily and accumulate in your account balance.</li>
              <li><strong>Attempt Cost:</strong> Starting any examination attempt deducts exactly one (1) token atomically via our server-side ledger.</li>
              <li><strong>Fair Use:</strong> Attempting to manipulate balances, bypass atomic checks, or exploit automated scripts is strictly prohibited and subject to account suspension.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand-red" />
              4. Prohibited Conduct
            </h2>
            <p>
              Users agree not to engage in unauthorized data scraping, reverse engineering, distributed denial-of-service attempts, or sharing account access credentials with multiple parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Scale className="h-4 w-4 text-brand-red" />
              5. Limitation of Liability
            </h2>
            <p>
              Exam CAGO provides study materials, practice questions, and timed mock tests on an &quot;as-is&quot; basis. We strive for high accuracy and continuous availability, but do not guarantee error-free or uninterrupted operation. Exam CAGO is not liable for indirect or consequential damages arising from platform usage.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

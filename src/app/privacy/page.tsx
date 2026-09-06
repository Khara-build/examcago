import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { ShieldCheck, Lock, Eye, FileText, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Exam CAGO. Learn how we collect, protect, and handle student data and platform cookies.',
  alternates: {
    canonical: 'https://examcago.com/privacy',
  },
};

export default async function PrivacyPolicyPage() {
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
            <ShieldCheck className="h-4 w-4" />
            <span>Trust & Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Last updated: September 6, 2026. This policy outlines how Exam CAGO handles and protects your information.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-gray-300 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand-red" />
              1. Information We Collect
            </h2>
            <p>
              Exam CAGO collects minimal personal information necessary to deliver our educational exam simulation services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Account Information:</strong> Your name and email address provided during registration.</li>
              <li><strong>Academic & Exam Activity:</strong> Selected answer choices, timestamps, exam attempt durations, and scores to compute your performance results and maintain your exam history.</li>
              <li><strong>Platform Ledger:</strong> Token transactions and daily token claim history required to operate our attempt access system.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-red" />
              2. How Your Information Is Used
            </h2>
            <p>
              Collected data is used strictly for legitimate educational and service functions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>To provide authenticated access to your student dashboard, question banks, and exams.</li>
              <li>To accurately evaluate exam responses and generate detailed performance reviews.</li>
              <li>To prevent fraudulent attempts, multiple simultaneous logins, and double-spending of exam tokens.</li>
              <li>To maintain platform security, system reliability, and database integrity.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-red" />
              3. Cookies and Advertising Technologies
            </h2>
            <p>
              Exam CAGO uses essential cookies required for session persistence, CSRF security, and user authentication.
            </p>
            <p>
              In the future, our platform may partner with third-party advertising vendors (such as Google AdSense) to support our free educational resources. These third-party vendors may use cookies, web beacons, or similar technologies to serve non-personalized or personalized advertisements based on user interactions on this and other websites. Users can manage or disable cookies at any time through their individual browser settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-red" />
              4. Data Protection & Security
            </h2>
            <p>
              We implement industry-standard database row-level security (RLS), encrypted transmission via SSL/TLS, and server-side credential isolation. Service-role credentials and correct exam answers are securely kept on our servers and never exposed to client-side code during an active exam.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-red" />
              5. Contact & Privacy Inquiries
            </h2>
            <p>
              If you have any questions or concerns regarding our privacy practices or wish to request data updates, please contact our administration team via our dedicated <a href="/contact" className="text-brand-red font-medium hover:underline">Contact Page</a>.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

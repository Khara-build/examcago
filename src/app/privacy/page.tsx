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
              <li><strong>Account Information:</strong> Your full name, registered Gmail address, and assigned referral code.</li>
              <li><strong>Academic & Exam Activity:</strong> Exam attempts, question snapshots, selected answers, completion timestamps, attempt durations, and marks earned to calculate results and maintain your comprehensive exam history.</li>
              <li><strong>Platform Ledger & Referrals:</strong> Token transactions, daily claim records, and referral reward relationships necessary to operate our token access system.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-red" />
              2. How Your Information Is Used
            </h2>
            <p>
              Collected data is used strictly for legitimate educational, operational, and service delivery functions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>To provide authenticated access to your student dashboard, subject materials, and practice exams.</li>
              <li>To accurately evaluate exam responses, generate detailed performance breakdowns, and display historical progress.</li>
              <li>To maintain fair platform access, prevent multiple concurrent logins, and eliminate double-spending of exam tokens.</li>
              <li>To maintain platform security, system reliability, and database integrity.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-red" />
              3. Cookies and Future Advertising Technologies
            </h2>
            <p>
              Exam CAGO currently uses only essential cookies required for session persistence, CSRF security, and user authentication.
            </p>
            <p>
              Google AdSense is not currently active on Exam CAGO. In the future, our platform may partner with third-party advertising vendors (such as Google AdSense) to help support free educational access for students. If activated in the future, these vendors may utilize cookies, web beacons, or similar technologies to serve non-personalized or personalized advertisements based on user visits. Users can manage or disable non-essential cookies at any time via browser settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-red" />
              4. Third-Party Infrastructure & Data Security
            </h2>
            <p>
              Exam CAGO utilizes reputable third-party cloud infrastructure and platform providers to securely host and operate our services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Supabase:</strong> For managed cloud database storage, user authentication, and strict Row-Level Security (RLS) enforcement.</li>
              <li><strong>Vercel:</strong> For secure web application hosting, SSL/TLS edge delivery, and serverless compute execution.</li>
            </ul>
            <p className="pt-1">
              We implement industry-standard database row-level security, encrypted data transmission via SSL/TLS, and server-side credential isolation. Service-role credentials, correct exam answer keys, and authoritative grading logic remain on our servers and are never exposed to client-side code during an active examination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-red" />
              5. Contact & Privacy Inquiries
            </h2>
            <p>
              If you have questions or concerns regarding our privacy practices, please contact our support team at <strong className="text-gray-900">support.cago@gmail.com</strong> or via our dedicated <a href="/contact" className="text-brand-red font-medium hover:underline">Contact Page</a>.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { Mail, MessageSquare, HelpCircle, MapPin, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — Exam CAGO Support',
  description: 'Get in touch with the Exam CAGO team for student support, platform inquiries, or syllabus feedback.',
  alternates: {
    canonical: 'https://examcago.com/contact',
  },
};

export default async function ContactPage() {
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
            <Mail className="h-4 w-4" />
            <span>Student Support & Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Contact Exam CAGO
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Have questions about an exam, your student account, or platform features? Our support team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-gray-300 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-red" />
              Direct Support Email
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              For general inquiries, account verification issues, or reporting question bank corrections:
            </p>
            <div className="p-3 bg-red-50/50 rounded border border-red-200 text-sm font-semibold text-brand-red">
              support@examcago.com
            </div>
            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Typical response time: within 24–48 business hours.
            </p>
          </Card>

          <Card className="p-6 border-gray-300 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-red" />
              Service Coverage
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Exam CAGO operates exclusively for candidates pursuing professional qualifications under ICAB in Bangladesh.
            </p>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-700 space-y-1">
              <div><strong>Region:</strong> Dhaka, Bangladesh</div>
              <div><strong>Timezone:</strong> Asia/Dhaka (UTC+6)</div>
              <div><strong>Target Level:</strong> ICAB Certificate Level</div>
            </div>
          </Card>
        </div>

        {/* Quick FAQ Card */}
        <Card className="p-6 sm:p-8 border-gray-300 space-y-4 text-xs text-gray-700 leading-relaxed">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-red" />
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <strong className="text-gray-900 block font-semibold">How do I claim my daily free token?</strong>
              <p className="text-gray-600">
                Log into your student dashboard and click &quot;Claim Daily Free Token&quot;. You are eligible for 1 token per Bangladesh calendar day.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-900 block font-semibold">Do tokens expire if not used?</strong>
              <p className="text-gray-600">
                No. Unused tokens accumulate in your balance and can be utilized whenever you choose to take an exam.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-900 block font-semibold">How are mock exams scored?</strong>
              <p className="text-gray-600">
                Exam CAGO uses a unified deterministic grading engine with official ICAB mark weightings and instant question-by-question answer reviews.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-900 block font-semibold">How can I reset my password?</strong>
              <p className="text-gray-600">
                Use the &quot;Forgot Password&quot; link on the login page to receive a secure recovery link to your registered Gmail address.
              </p>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

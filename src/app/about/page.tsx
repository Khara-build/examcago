import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, Award, Target, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Exam CAGO',
  description: 'Learn about Exam CAGO, the dedicated examination and question bank system for ICAB Certificate Level candidates in Bangladesh.',
  alternates: {
    canonical: 'https://examcago.com/about',
  },
};

export default async function AboutPage() {
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
            <BookOpen className="h-4 w-4" />
            <span>Our Educational Mission</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            About EXAM CAGO
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Dedicated online examination and question bank system engineered specifically for ICAB Certificate Level candidates.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-gray-300 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-red" />
              Empowering Chartered Accountancy Students
            </h2>
            <p>
              The Institute of Chartered Accountants of Bangladesh (ICAB) Certificate Level examination is a challenging milestone for aspiring accountants. Preparing for computer-based testing requires consistent, disciplined practice with realistic time constraints and instant feedback.
            </p>
            <p>
              Exam CAGO was built to bridge the gap between textbook studying and realistic exam conditions. We provide structured, chapter-by-chapter questions and full-book mock exams that reflect actual exam duration, marking schemes, and question patterns.
            </p>
          </section>

          <section className="space-y-4 pt-2 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-red" />
              Core Architecture & Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-1">
                <strong className="text-gray-900 block font-bold text-sm">7 Core Subjects</strong>
                <p className="text-gray-600">Accounting, Management Information, Business Technology & Finance, Taxation, Assurance, Business Law, and Information Technology.</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-1">
                <strong className="text-gray-900 block font-bold text-sm">85 Verified Chapters</strong>
                <p className="text-gray-600">Complete syllabus coverage mapped directly to the official ICAB curriculum structure.</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-1">
                <strong className="text-gray-900 block font-bold text-sm">Deterministic Grading</strong>
                <p className="text-gray-600">Instant, single-source scoring engine that evaluates responses with 100% mathematical consistency.</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-1">
                <strong className="text-gray-900 block font-bold text-sm">Daily Free Practice</strong>
                <p className="text-gray-600">Every student receives a free exam token every Bangladesh local day, ensuring daily access to revision.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-red" />
              Our Philosophy: Simple UI, Powerful Backend
            </h2>
            <p>
              We believe a student portal should be distraction-free. Exam CAGO focuses on clean typography, responsive navigation, fast page loads, and intuitive testing workflows without unnecessary menus, popups, or confusing layouts.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <Link href="/subjects">
              <Button variant="primary" size="md" className="gap-2 bg-brand-red hover:bg-brand-red-dark">
                Explore Subjects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="md">
                Contact Support
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

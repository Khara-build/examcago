import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Award, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  Zap, 
  Users,
  Mail,
  Megaphone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Master Your ICAB Exams Online — Practice MCQs & Full Book Mocks',
  description: 'Practice all 85 syllabus chapters across 7 ICAB Certificate Level subjects with realistic exam simulation, instant scoring, and comprehensive explanations.',
  alternates: {
    canonical: 'https://examcago.com',
  },
  openGraph: {
    title: 'Master Your ICAB Exams Online — EXAM CAGO',
    description: 'Premier question bank and mock examination portal for ICAB Certificate Level candidates in Bangladesh.',
    url: 'https://examcago.com',
  },
};

export default async function HomePage() {
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

  // Fetch ICAB Subjects from DB
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*, exam_configs(*)')
    .order('display_order', { ascending: true });

  const displaySubjects = subjects || [
    { id: '1', name: 'Accounting', code: 'ACC', slug: 'accounting', description: 'Financial accounting, double-entry bookkeeping, trial balance, and financial statement preparation.', exam_configs: [{ duration_minutes: 90, total_marks: 100, mcq_count: 40 }] },
    { id: '2', name: 'Management Information', code: 'MI', slug: 'management-information', description: 'Cost accounting, budgeting, variance analysis, forecasting, and managerial decision support.', exam_configs: [{ duration_minutes: 90, total_marks: 100, mcq_count: 35 }] },
    { id: '3', name: 'Business Technology and Finance', code: 'BTF', slug: 'business-technology-and-finance', description: 'Business organizational structure, economic environment, financial markets, and management.', exam_configs: [{ duration_minutes: 90, total_marks: 100, mcq_count: 50 }] },
    { id: '4', name: 'Taxation', code: 'TAX', slug: 'taxation', description: 'Income tax principles, corporate tax, withholding tax, VAT rules, and tax computation.', exam_configs: [{ duration_minutes: 90, total_marks: 100, mcq_count: 35 }] },
    { id: '5', name: 'Assurance', code: 'ASR', slug: 'assurance', description: 'Audit concepts, internal controls, audit evidence, professional ethics, and assurance procedures.', exam_configs: [{ duration_minutes: 90, total_marks: 100, mcq_count: 50 }] },
    { id: '6', name: 'Business Law', code: 'BLAW', slug: 'business-law', description: 'Contract law, Companies Act framework, partnership laws, and commercial legal guidelines.', exam_configs: [{ duration_minutes: 60, total_marks: 50, mcq_count: 25 }] },
    { id: '7', name: 'Information Technology', code: 'IT', slug: 'information-technology', description: 'Information systems, computer hardware/software, cybersecurity, and IT controls in business.', exam_configs: [{ duration_minutes: 60, total_marks: 50, mcq_count: 25 }] },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={user ? { email: user.email!, role: userRole } : null} tokens={tokenBalance} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-brand-red border border-red-200">
                <ShieldCheck className="h-4 w-4" />
                <span>Dedicated Exam Engine for ICAB Certificate Level</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Master Your ICAB Exams with <span className="text-brand-red">EXAM CAGO</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                The premier online examination and question bank system specifically engineered for ICAB Certificate Level candidates. Practice chapter-wise question sets or attempt realistic timed full-book examinations.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <Link href="/dashboard">
                    <Button variant="primary" size="lg" className="gap-2 shadow-sm">
                      Go to Student Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button variant="primary" size="lg" className="gap-2 shadow-sm">
                        Create Free Student Account
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        Student Sign In
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/subjects">
                  <Button variant="ghost" size="lg" className="text-gray-700">
                    Browse All 7 Subjects
                  </Button>
                </Link>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-red" />
                  <span>7 Full Subjects</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-red" />
                  <span>1 Free Daily Token</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-red" />
                  <span>Real Exam Interface</span>
                </div>
              </div>
            </div>

            {/* Hero Quick Start Card */}
            <div className="lg:col-span-5">
              <Card className="border-gray-300 shadow-lg bg-gradient-to-b from-white to-red-50/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-brand-red" />
                      <span className="font-semibold text-gray-900">ICAB Certificate Level Exam Prep</span>
                    </div>
                    <Badge variant="brand">100% English</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-md bg-white border border-gray-200 flex items-start gap-3">
                      <Zap className="h-5 w-5 text-brand-red mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">Timed Exam Engine</div>
                        <div className="text-xs text-gray-500">Fixed server-side countdown timers matching ICAB guidelines.</div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-md bg-white border border-gray-200 flex items-start gap-3">
                      <Coins className="h-5 w-5 text-brand-red mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">1 Free Daily Token</div>
                        <div className="text-xs text-gray-500">Claim 1 free exam token every day.</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-md bg-white border border-gray-200 flex items-start gap-3">
                      <Users className="h-5 w-5 text-brand-red mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">Referral Rewards</div>
                        <div className="text-xs text-gray-500">Share your referral link to earn bonus exam tokens per student.</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <span className="text-xs text-gray-400">Website: examcago.com</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor / Advertising Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-2xl border border-red-200/90 bg-gradient-to-r from-red-50/80 via-amber-50/40 to-white p-5 sm:p-7 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 min-h-[140px] sm:min-h-[150px]">
          {/* Left Column: Content & CTA */}
          <div className="flex-1 space-y-2.5 text-left w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-red bg-red-100/90 border border-red-200 px-2.5 py-0.5 rounded-sm shadow-2xs">
                PARTNER WITH US
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Advertise with Exam CAGO
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl">
              Reach ICAB Certificate Level students and showcase your brand, products or services.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="mailto:support.cago@gmail.com"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand-red text-white text-xs font-semibold hover:bg-brand-red-light transition-colors shadow-xs"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Interested? Contact us</span>
              </a>
              <a
                href="mailto:support.cago@gmail.com"
                className="text-xs text-gray-500 hover:text-brand-red transition-colors font-medium"
              >
                support.cago@gmail.com
              </a>
            </div>
          </div>

          {/* Middle: Promotional Megaphone Visual */}
          <div className="hidden lg:flex items-center justify-center shrink-0 px-2">
            <div className="w-14 h-14 rounded-full bg-red-100/70 border border-red-200/80 flex items-center justify-center text-brand-red shadow-2xs">
              <Megaphone className="h-6 w-6" />
            </div>
          </div>

          {/* Right Column: Prominent Brand Ad Placeholder */}
          <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0">
            <div className="w-full sm:w-60 md:w-64 lg:w-72 h-28 sm:h-32 rounded-xl border-2 border-dashed border-red-300/90 bg-white/95 px-5 py-4 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="text-xs sm:text-sm font-extrabold tracking-widest text-brand-red uppercase">
                YOUR BRAND
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-gray-400 tracking-wider mt-0.5">
                AD HERE
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">
                Featured Sponsor Placement
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7 ICAB Subjects Section */}
      <section className="pt-6 sm:pt-8 pb-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <Badge variant="brand">Syllabus Coverage</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            7 ICAB Certificate Level Subjects
          </h2>
          <p className="text-gray-600">
            Select any subject to explore chapter-wise questions, view full book test configurations, and launch your practice exam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySubjects.map((sub: any) => {
            const config = sub.exam_configs?.[0] || { duration_minutes: 90, total_marks: 100 };
            return (
              <Card key={sub.id} hoverable className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{config.duration_minutes} Mins</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{sub.name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {sub.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <div className="text-xs text-gray-500">
                    Total: <strong className="text-gray-900">{config.total_marks || 100} Marks</strong>
                  </div>
                  <Link href={`/subjects/${sub.slug}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      Start Exam
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

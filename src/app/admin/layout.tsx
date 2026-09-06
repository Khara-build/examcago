import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { 
  Shield, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Upload, 
  FileText, 
  Sliders, 
  Users, 
  History, 
  Coins, 
  Share2, 
  Database,
  ArrowLeft
} from 'lucide-react';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const navItems = [
    { name: 'Overview', href: '/admin', icon: Shield },
    { name: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    { name: 'Chapters', href: '/admin/chapters', icon: Layers },
    { name: 'Question Bank', href: '/admin/questions', icon: HelpCircle },
    { name: 'Bulk Import', href: '/admin/questions/import', icon: Upload },
    { name: 'Scenario Questions', href: '/admin/scenarios', icon: FileText },
    { name: 'Large Questions', href: '/admin/large-questions', icon: FileText },
    { name: 'Exam Configs', href: '/admin/exams', icon: Sliders },
    { name: 'User Accounts', href: '/admin/users', icon: Users },
    { name: 'Exam Attempts', href: '/admin/attempts', icon: History },
    { name: 'Token Ledger', href: '/admin/tokens', icon: Coins },
    { name: 'Referral System', href: '/admin/referrals', icon: Share2 },
    { name: 'Import History', href: '/admin/imports', icon: Database },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-offwhite">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white border-r border-slate-800 shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-red font-bold text-white text-xs">
              AD
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-none">EXAM CAGO</span>
              <span className="text-[10px] text-amber-400 font-medium">Admin Control Panel</span>
            </div>
          </div>

          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit
          </Link>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-65px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                <Icon className="h-4 w-4 text-brand-red shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Admin Viewport */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}

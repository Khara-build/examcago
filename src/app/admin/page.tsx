import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { BookOpen, Layers, HelpCircle, Upload, Users, History, Coins, Share2 } from 'lucide-react';

export default async function AdminOverviewPage() {
  const adminClient = createAdminClient();

  const { count: subjectCount } = await adminClient.from('subjects').select('*', { count: 'exact', head: true });
  const { count: chapterCount } = await adminClient.from('chapters').select('*', { count: 'exact', head: true });
  const { count: questionCount } = await adminClient.from('questions').select('*', { count: 'exact', head: true });
  const { count: userCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true });
  const { count: attemptCount } = await adminClient.from('exam_attempts').select('*', { count: 'exact', head: true });
  const { count: importCount } = await adminClient.from('bulk_imports').select('*', { count: 'exact', head: true });

  const metrics = [
    { title: 'Subjects', value: subjectCount || 0, href: '/admin/subjects', icon: BookOpen, color: 'text-blue-600' },
    { title: 'Chapters', value: chapterCount || 0, href: '/admin/chapters', icon: Layers, color: 'text-indigo-600' },
    { title: 'MCQ Question Bank', value: questionCount || 0, href: '/admin/questions', icon: HelpCircle, color: 'text-brand-red' },
    { title: 'Registered Students', value: userCount || 0, href: '/admin/users', icon: Users, color: 'text-emerald-600' },
    { title: 'Exam Attempts Logged', value: attemptCount || 0, href: '/admin/attempts', icon: History, color: 'text-amber-600' },
    { title: 'Bulk Imports', value: importCount || 0, href: '/admin/imports', icon: Upload, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-xs text-gray-500 mt-1">
            EXAM CAGO System Administration & Question Bank Management
          </p>
        </div>

        <Link href="/admin/questions/import">
          <Button variant="primary" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Question Importer
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.title} hoverable className="border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">{m.title}</span>
                <Icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div className="text-3xl font-extrabold text-gray-900 my-1">{m.value}</div>
              <Link href={m.href} className="text-xs font-semibold text-brand-red hover:underline block mt-3">
                Manage {m.title} →
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

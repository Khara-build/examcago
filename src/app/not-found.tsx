'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-offwhite p-4">
      <Card className="max-w-md w-full text-center p-8 space-y-6 border-gray-300 shadow-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-200 mx-auto text-brand-red">
          <BookOpen className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
            404 — Page Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Page Not Found
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            The examination page, subject, or question bank resource you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" size="md" className="w-full justify-center gap-2 bg-brand-red hover:bg-brand-red-dark">
              <ArrowLeft className="h-4 w-4" />
              Return to Student Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

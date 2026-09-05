'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { startExamAttemptAction } from '@/app/actions/exam';
import { Play, AlertCircle } from 'lucide-react';

interface ExamLauncherButtonProps {
  subjectId: string;
  examConfigId: string;
  chapterId?: string | null;
  isLoggedIn: boolean;
  tokenBalance: number;
  label?: string;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function ExamLauncherButton({
  subjectId,
  examConfigId,
  chapterId = null,
  isLoggedIn,
  tokenBalance,
  label,
  variant = 'primary',
  size = 'lg',
}: ExamLauncherButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartExam() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/subjects`);
      return;
    }

    if (tokenBalance < 1) {
      setError('Insufficient token balance. You need at least 1 token to start this exam.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await startExamAttemptAction(subjectId, examConfigId, chapterId);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.attemptId) {
      router.push(`/exam/${res.attemptId}`);
    }
  }

  const defaultLabel = isLoggedIn
    ? (chapterId ? 'Start Chapter Practice (1 Token)' : 'Start Full Book Exam (1 Token)')
    : 'Sign In to Start Exam';

  return (
    <div className="space-y-2 w-full">
      {error && (
        <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        variant={variant}
        size={size}
        className="w-full justify-center gap-2 shadow-sm"
        onClick={handleStartExam}
        isLoading={loading}
      >
        <Play className="h-4 w-4" />
        {label || defaultLabel}
      </Button>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { startExamAttemptAction } from '@/app/actions/exam';
import { Play, AlertCircle, AlertTriangle, Upload } from 'lucide-react';

interface ExamLauncherButtonProps {
  subjectId: string;
  examConfigId: string;
  chapterId?: string | null;
  isLoggedIn: boolean;
  tokenBalance: number;
  label?: string;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  availableQuestions?: number;
  requiredQuestions?: number;
  isAdmin?: boolean;
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
  availableQuestions,
  requiredQuestions,
  isAdmin = false,
}: ExamLauncherButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isQuestionBankInsufficient =
    availableQuestions !== undefined &&
    requiredQuestions !== undefined &&
    availableQuestions < requiredQuestions;

  async function handleStartExam() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/subjects`);
      return;
    }

    if (tokenBalance < 1) {
      setError('Insufficient token balance. You need at least 1 token to start this exam.');
      return;
    }

    if (isQuestionBankInsufficient) {
      setError(
        `Not enough active questions available (${availableQuestions} available, ${requiredQuestions} required). The question bank must be populated before exams can be started.`
      );
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
    <div className="space-y-3 w-full">
      {isQuestionBankInsufficient && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Question Bank Empty</p>
              <p className="text-amber-800 mt-0.5">
                This subject currently has {availableQuestions} questions ({requiredQuestions} required for full exam).
              </p>
            </div>
          </div>
          {isAdmin && (
            <Link
              href="/admin/questions/import"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-red hover:underline pt-1"
            >
              <Upload className="h-3 w-3" />
              Upload Question Bank via Bulk Import →
            </Link>
          )}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        variant={isQuestionBankInsufficient ? 'outline' : variant}
        size={size}
        className="w-full justify-center gap-2 shadow-sm"
        onClick={handleStartExam}
        isLoading={loading}
        disabled={isQuestionBankInsufficient && !isLoggedIn}
      >
        <Play className="h-4 w-4" />
        {label || defaultLabel}
      </Button>
    </div>
  );
}

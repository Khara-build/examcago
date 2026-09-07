'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { startExamAttemptAction } from '@/app/actions/exam';
import { Play, AlertCircle, AlertTriangle, Upload } from 'lucide-react';

interface ExamLauncherButtonProps {
  subjectId: string;
  subjectCode?: string;
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
  specialQuestionType?: 'scenario' | 'large' | null;
  specialQuestionCount?: number;
  requiredSpecialCount?: number;
}

export function ExamLauncherButton({
  subjectId,
  subjectCode,
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
  specialQuestionType = null,
  specialQuestionCount = 0,
  requiredSpecialCount = 0,
}: ExamLauncherButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeSpecial, setIncludeSpecial] = useState(false);

  const isSpecialAvailable =
    specialQuestionType !== null &&
    specialQuestionCount >= (requiredSpecialCount || 1);

  // If special is enabled, required MCQs might be lower (e.g. 40 or 35), but checking against base requiredQuestions
  const effectiveRequiredMCQs = includeSpecial
    ? (specialQuestionType === 'large' ? 40 : 35)
    : (requiredQuestions ?? 40);

  const isQuestionBankInsufficient =
    availableQuestions !== undefined &&
    availableQuestions < effectiveRequiredMCQs;

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
        `Not enough active questions available (${availableQuestions} available, ${effectiveRequiredMCQs} required). The question bank must be populated before exams can be started.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    const res = await startExamAttemptAction(subjectId, examConfigId, chapterId, includeSpecial);

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
      {/* Special Questions Mode Toggle (Only for Full Book exams in ACC, MI, TAX) */}
      {!chapterId && specialQuestionType && (
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <span>Include {specialQuestionType === 'large' ? 'Structured Numerical Question' : 'Scenario Case Studies'}</span>
            </div>

            {isSpecialAvailable ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-600">
                  {includeSpecial ? 'Mode B' : 'Mode A'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSpecial}
                    onChange={(e) => setIncludeSpecial(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                </label>
              </div>
            ) : (
              <span className="text-[10px] font-bold tracking-wide uppercase text-gray-600 bg-gray-200 border border-gray-300 px-2 py-0.5 rounded">
                OFF — Not available yet
              </span>
            )}
          </div>

          <div className="text-[11px] leading-relaxed">
            {isSpecialAvailable ? (
              includeSpecial ? (
                <div className="text-brand-red font-medium bg-red-50/70 p-2 rounded border border-red-100">
                  <strong>Mode B Selected:</strong>{' '}
                  {specialQuestionType === 'large'
                    ? '40 MCQs (80 marks) + 1 Structured Large Question (20 marks) = 100 marks'
                    : '35 MCQs (70 marks) + 2 Scenario Questions (30 marks) = 100 marks'}
                </div>
              ) : (
                <div className="text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <strong>Mode A (Default):</strong> 50 MCQs × 2 marks = 100 marks (Pure MCQ Mock Exam)
                </div>
              )
            ) : (
              <div className="text-gray-500 bg-white p-2 rounded border border-gray-200">
                Official {specialQuestionType === 'large' ? 'structured numerical' : 'scenario case study'} questions for this subject are currently in preparation. Taking exam in <strong>Mode A (50 MCQs × 2 = 100 marks)</strong>.
              </div>
            )}
          </div>
        </div>
      )}

      {isQuestionBankInsufficient && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Question Bank Empty</p>
              <p className="text-amber-800 mt-0.5">
                This subject currently has {availableQuestions} questions ({effectiveRequiredMCQs} required for this mode).
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

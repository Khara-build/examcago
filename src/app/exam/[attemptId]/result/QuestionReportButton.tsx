'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { submitQuestionReportAction } from '@/app/actions/reports';
import { ALLOWED_REPORT_REASONS, ReportReason } from '@/types/reports';
import { Flag, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

interface QuestionReportButtonProps {
  questionId: string;
  attemptId: string;
  questionNumber: number;
  initialReported?: boolean;
}

export function QuestionReportButton({
  questionId,
  attemptId,
  questionNumber,
  initialReported = false,
}: QuestionReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReported, setIsReported] = useState(initialReported);
  const [reason, setReason] = useState<ReportReason>(ALLOWED_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await submitQuestionReportAction({
        questionId,
        attemptId,
        reason,
        details,
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else if (res?.success) {
        setIsReported(true);
        setSuccessMessage(res.message || 'Report submitted. Thank you for helping us improve the question bank.');
        setIsLoading(false);
        setIsOpen(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while submitting your report.');
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      {successMessage ? (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      ) : isReported ? (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
          <span>Report Submitted (Under Review)</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-red font-medium transition-colors py-1 px-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
        >
          <Flag className="h-3.5 w-3.5" />
          <span>Report Question</span>
        </button>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-brand-red/10 text-brand-red">
                  <Flag className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="report-modal-title" className="text-sm font-bold text-gray-900">
                    Report Question #{questionNumber}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Help our academic review team maintain 100% syllabus accuracy.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Report Reason <span className="text-brand-red">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white text-gray-900 font-medium"
                >
                  {ALLOWED_REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Additional Details <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {details.length} / 1500
                  </span>
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 1500))}
                  rows={4}
                  placeholder="Provide reference citations, ICAB study manual chapter/page, or calculation corrections if applicable..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white text-gray-900 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-brand-red hover:bg-brand-red-dark"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

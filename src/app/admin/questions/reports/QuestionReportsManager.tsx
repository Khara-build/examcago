'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { updateQuestionReportStatusAction } from '@/app/actions/reports';
import { ALLOWED_REPORT_REASONS } from '@/types/reports';
import { 
  Flag, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Clock,
  Eye,
  Check,
  Ban,
  RotateCcw,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface QuestionReportsManagerProps {
  reports: any[];
  totalCount: number;
  openCount: number;
  reviewingCount: number;
  resolvedCount: number;
  currentPage: number;
  limit: number;
  currentSearch: string;
  currentStatus: string;
  currentReason: string;
}

export function QuestionReportsManager({
  reports,
  totalCount,
  openCount,
  reviewingCount,
  resolvedCount,
  currentPage,
  limit,
  currentSearch,
  currentStatus,
  currentReason,
}: QuestionReportsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleOpenReport = (report: any) => {
    setSelectedReport(report);
    setAdminNote(report.admin_note || '');
    setActionError(null);
    setActionSuccess(null);
  };

  const handleUpdateStatus = async (status: 'open' | 'reviewing' | 'resolved' | 'rejected') => {
    if (!selectedReport) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await updateQuestionReportStatusAction({
      reportId: selectedReport.id,
      status,
      adminNote,
    });

    if (res?.error) {
      setActionError(res.error);
      setActionLoading(false);
    } else {
      setActionSuccess(`Report status updated to ${status}.`);
      setActionLoading(false);
      setSelectedReport({
        ...selectedReport,
        status,
        admin_note: adminNote,
      });
      router.refresh();
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning">Open (New)</Badge>;
      case 'reviewing':
        return <Badge variant="brand">Reviewing</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'rejected':
        return <Badge variant="neutral">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-200">
          <span className="text-xs text-gray-500 block uppercase tracking-wider font-semibold">Total Reports</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{totalCount}</span>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50/40">
          <span className="text-xs text-amber-700 block uppercase tracking-wider font-semibold">Open / Triage</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">{openCount}</span>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50/40">
          <span className="text-xs text-blue-700 block uppercase tracking-wider font-semibold">Under Review</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">{reviewingCount}</span>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/40">
          <span className="text-xs text-emerald-700 block uppercase tracking-wider font-semibold">Resolved</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{resolvedCount}</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reason or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={currentStatus}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open (New)</option>
              <option value="reviewing">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div className="w-full md:w-56">
            <select
              value={currentReason}
              onChange={(e) => updateFilters({ reason: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white font-medium"
            >
              <option value="all">All Report Reasons</option>
              {ALLOWED_REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {(currentSearch || currentStatus !== 'all' || currentReason !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                router.push(pathname);
              }}
              className="text-xs text-gray-600 hover:text-red-700"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Subject / Chapter</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No question reports found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const q = report.question;
                  const u = report.user;
                  const dateStr = new Date(report.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 max-w-xs truncate font-medium text-gray-900">
                        {q?.question_text || 'Question missing or archived'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-gray-800 block text-[11px]">
                            {q?.subject?.name || '—'}
                          </span>
                          <span className="text-gray-500 text-[10px] block">
                            Ch {q?.chapter?.chapter_number}: {q?.chapter?.name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[11px] font-medium text-gray-900">
                          {u?.full_name || 'Student'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {u?.email || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-800 font-medium line-clamp-1">
                          {report.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReport(report)}
                          className="gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalCount} total reports)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updateFilters({ page: String(currentPage - 1) })}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => updateFilters({ page: String(currentPage + 1) })}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Review & Triage Drawer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-brand-red/10 text-brand-red">
                  <Flag className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      Report Review & Investigation
                    </h3>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    ID: {selectedReport.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {actionSuccess && (
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Student Report Section */}
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                    Student Challenge Details
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    Submitted by: <strong>{selectedReport.user?.email || 'Student'}</strong>
                  </span>
                </div>

                <div>
                  <strong className="text-gray-700 block">Reported Reason:</strong>
                  <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                    {selectedReport.reason}
                  </span>
                </div>

                {selectedReport.details && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <strong className="text-gray-700 block">Student Note:</strong>
                    <p className="text-gray-800 whitespace-pre-line leading-relaxed mt-0.5 bg-white p-2.5 rounded border border-amber-200">
                      {selectedReport.details}
                    </p>
                  </div>
                )}

                {selectedReport.attempt && (
                  <div className="text-[11px] text-gray-500 pt-1">
                    Context: Attempt <strong>"{selectedReport.attempt.title}"</strong> (Score: {selectedReport.attempt.score ?? 0}/{selectedReport.attempt.total_marks ?? 0})
                  </div>
                )}
              </div>

              {/* Question Details Section */}
              <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                    Active Question in Question Bank
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    {selectedReport.question?.subject?.name} • Ch {selectedReport.question?.chapter?.chapter_number}
                  </span>
                </div>

                <div className="text-sm font-semibold text-gray-900 bg-white p-3 rounded border border-gray-200 leading-relaxed">
                  {selectedReport.question?.question_text || 'Question text unavailable'}
                </div>

                {/* Options if MCQ */}
                {selectedReport.question?.options && selectedReport.question.options.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-gray-700 block">Options & Answers:</span>
                    {selectedReport.question.options.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded border flex items-center justify-between ${
                          opt.is_correct
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{opt.option_letter}.</span>
                          <span>{opt.option_text}</span>
                        </div>
                        {opt.is_correct && (
                          <Badge variant="success" className="text-[10px]">
                            Correct Answer
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {selectedReport.question?.explanation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 space-y-0.5">
                    <strong className="block font-semibold">Explanation:</strong>
                    <p className="leading-relaxed">{selectedReport.question.explanation}</p>
                  </div>
                )}

                {/* Direct Edit Button */}
                {selectedReport.question && (
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/admin/questions?search=${encodeURIComponent(selectedReport.question.question_text.slice(0, 35))}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Edit Question in Question Bank
                    </Link>
                  </div>
                )}
              </div>

              {/* Admin Note Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Admin Resolution Note
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Notes on academic verification, manual correction, or reason for rejecting report..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Historical attempts remain intact when question is updated.</span>
              </div>

              <div className="flex items-center gap-2">
                {selectedReport.status !== 'reviewing' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('reviewing')}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs"
                  >
                    Mark Reviewing
                  </Button>
                )}

                {selectedReport.status !== 'rejected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('rejected')}
                    className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
                  >
                    Reject
                  </Button>
                )}

                {selectedReport.status !== 'resolved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('resolved')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-xs gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark Resolved
                  </Button>
                )}

                {selectedReport.status === 'resolved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('open')}
                    className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

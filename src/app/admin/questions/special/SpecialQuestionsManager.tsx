'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Power, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Layers,
  HelpCircle,
  X,
  Plus
} from 'lucide-react';
import { toggleSpecialQuestionStatusAction, deleteSpecialQuestionAction } from '@/app/actions/import-special';

interface SpecialQuestionsManagerProps {
  subjects: any[];
  chapters: any[];
  largeQuestions: any[];
  scenarioQuestions: any[];
}

export function SpecialQuestionsManager({
  subjects,
  chapters,
  largeQuestions,
  scenarioQuestions,
}: SpecialQuestionsManagerProps) {
  const [activeTab, setActiveTab] = useState<'accounting' | 'mi' | 'taxation'>('accounting');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  // Filter datasets per subject tab
  const accountingQuestions = useMemo(() => {
    return largeQuestions.filter(
      (l) => l.question?.subject?.name === 'Accounting' || l.question?.subject?.code === 'ACC'
    );
  }, [largeQuestions]);

  const miScenarios = useMemo(() => {
    return scenarioQuestions.filter(
      (s) => s.question?.subject?.name === 'Management Information' || s.question?.subject?.code === 'MI'
    );
  }, [scenarioQuestions]);

  const taxScenarios = useMemo(() => {
    return scenarioQuestions.filter(
      (s) => s.question?.subject?.name === 'Taxation' || s.question?.subject?.code === 'TAX'
    );
  }, [scenarioQuestions]);

  // Active items based on selected tab
  const currentTabItems = useMemo(() => {
    if (activeTab === 'accounting') return accountingQuestions;
    if (activeTab === 'mi') return miScenarios;
    return taxScenarios;
  }, [activeTab, accountingQuestions, miScenarios, taxScenarios]);

  // Overall statistics
  const totalAll = largeQuestions.length + scenarioQuestions.length;
  const activeAll =
    largeQuestions.filter((l) => l.question?.is_active).length +
    scenarioQuestions.filter((s) => s.question?.is_active).length;
  const inactiveAll = totalAll - activeAll;

  // Filter items by search, chapter, status
  const filteredItems = useMemo(() => {
    return currentTabItems.filter((item) => {
      const q = item.question || {};
      const title = item.case_title || item.scenario_title || '';
      const prompt = q.question_text || '';
      const narrative = item.case_text || item.scenario_text || '';

      // Search match
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          title.toLowerCase().includes(term) ||
          prompt.toLowerCase().includes(term) ||
          narrative.toLowerCase().includes(term) ||
          (q.chapter?.name && q.chapter.name.toLowerCase().includes(term));
        if (!matches) return false;
      }

      // Chapter match
      if (selectedChapterId !== 'all' && q.chapter_id !== selectedChapterId) {
        return false;
      }

      // Status match
      if (statusFilter === 'active' && !q.is_active) return false;
      if (statusFilter === 'inactive' && q.is_active) return false;

      return true;
    });
  }, [currentTabItems, searchTerm, selectedChapterId, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handle Status Toggle (Soft Deactivation)
  async function handleToggleStatus(item: any) {
    const qId = item.question?.id;
    if (!qId) return;

    setActionLoading(qId);
    const res = await toggleSpecialQuestionStatusAction(qId, Boolean(item.question.is_active));
    setActionLoading(null);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', `Question status updated to ${item.question.is_active ? 'Inactive' : 'Active'}.`);
      item.question.is_active = !item.question.is_active;
    }
  }

  // Handle Safe Delete
  async function handleDelete(item: any) {
    const qId = item.question?.id;
    if (!qId) return;

    const confirmed = confirm(
      'Are you sure you want to delete this question? Deletion is permanently prevented if students have attempted this question.'
    );
    if (!confirmed) return;

    setActionLoading(qId);
    const res = await deleteSpecialQuestionAction(qId);
    setActionLoading(null);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Question deleted successfully.');
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-xs font-semibold shadow-md ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-red animate-pulse" />
            <span className="text-xs font-bold text-brand-red uppercase tracking-wider">
              Special Question Bank
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Special Questions Management
          </h1>
          <p className="text-xs text-gray-600 max-w-2xl">
            Manage Accounting 20-mark structured numerical calculation questions and Management Information & Taxation 15-mark case study scenarios (7 child tasks).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/questions/special/import">
            <Button variant="primary" size="md" className="gap-2 shadow-sm bg-brand-red hover:bg-brand-red-dark">
              <Upload className="h-4 w-4" />
              Bulk Import Special Questions
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-gray-200">
          <div className="text-xs text-gray-500 font-semibold">Total Special Questions</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{totalAll}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Across all 3 subjects</div>
        </Card>

        <Card className="p-4 bg-white border-gray-200">
          <div className="text-xs text-gray-500 font-semibold">Active in Exam Bank</div>
          <div className="text-2xl font-extrabold text-green-700 mt-1">{activeAll}</div>
          <div className="text-[11px] text-green-600 mt-0.5">Available to test-takers</div>
        </Card>

        <Card className="p-4 bg-white border-gray-200">
          <div className="text-xs text-gray-500 font-semibold">Inactive (Draft/Hidden)</div>
          <div className="text-2xl font-extrabold text-gray-600 mt-1">{inactiveAll}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Hidden from exams</div>
        </Card>

        <Card className="p-4 bg-white border-gray-200">
          <div className="text-xs text-gray-500 font-semibold">Subject Breakdown</div>
          <div className="text-xs text-gray-700 font-medium space-y-0.5 mt-1">
            <div>ACC Large: <strong className="text-gray-900">{accountingQuestions.length}</strong></div>
            <div>MI Scenarios: <strong className="text-gray-900">{miScenarios.length}</strong></div>
            <div>Tax Scenarios: <strong className="text-gray-900">{taxScenarios.length}</strong></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 flex gap-2">
        <button
          onClick={() => {
            setActiveTab('accounting');
            setCurrentPage(1);
          }}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'accounting'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Accounting Structured ({accountingQuestions.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('mi');
            setCurrentPage(1);
          }}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'mi'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          Management Information Scenarios ({miScenarios.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('taxation');
            setCurrentPage(1);
          }}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'taxation'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Taxation Scenarios ({taxScenarios.length})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border-gray-200 rounded-b-xl rounded-t-none -mt-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, prompt, or chapter..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Question Table / List */}
      <Card className="border-gray-200 overflow-hidden bg-white shadow-sm">
        {paginatedItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Special Questions Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              {searchTerm || statusFilter !== 'all'
                ? 'No questions matched your active filters. Clear your filters to view all questions.'
                : 'The special question bank for this subject currently has 0 uploaded questions. Use the Bulk Importer to upload questions via XLSX, CSV, or JSON.'}
            </p>
            <div className="pt-2">
              <Link href="/admin/questions/special/import">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-brand-red" />
                  Upload via Bulk Import
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">Title & Problem</th>
                  <th className="p-3.5">Subject & Chapter</th>
                  <th className="p-3.5">Type & Marks</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item) => {
                  const q = item.question || {};
                  const title = item.case_title || item.scenario_title || 'Untitled Special Question';
                  const isActive = Boolean(q.is_active);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <div className="font-bold text-gray-900 truncate">{title}</div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {q.question_text || item.case_text || item.scenario_text}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-medium text-gray-800 block">
                          {q.subject?.name || 'Canonical Subject'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {q.chapter?.name || 'General / Full Book'}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {activeTab === 'accounting' ? (
                          <div>
                            <Badge variant="neutral" className="text-[10px]">
                              Structured ({item.question_data?.fields?.length || 5} fields)
                            </Badge>
                            <span className="block text-[11px] font-bold text-brand-red mt-0.5">
                              20 Marks
                            </span>
                          </div>
                        ) : (
                          <div>
                            <Badge variant="neutral" className="text-[10px]">
                              Scenario (7 Child Tasks)
                            </Badge>
                            <span className="block text-[11px] font-bold text-brand-red mt-0.5">
                              15 Marks
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <Badge variant={isActive ? 'success' : 'neutral'} className="text-[10px]">
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        {/* Preview */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewItem(item)}
                          className="h-7 px-2 text-[11px]"
                          title="Preview Question"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>

                        {/* Soft Toggle */}
                        <Button
                          variant={isActive ? 'outline' : 'secondary'}
                          size="sm"
                          disabled={actionLoading === q.id}
                          onClick={() => handleToggleStatus(item)}
                          className="h-7 px-2 text-[11px]"
                          title={isActive ? 'Deactivate Question' : 'Activate Question'}
                        >
                          <Power className="h-3 w-3 mr-1" />
                          {isActive ? 'Deactivate' : 'Activate'}
                        </Button>

                        {/* Safe Delete */}
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={actionLoading === q.id}
                          onClick={() => handleDelete(item)}
                          className="h-7 px-2 text-[11px]"
                          title="Safe Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredItems.length > itemsPerPage && (
          <div className="p-3.5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50/50">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} questions
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="font-semibold text-gray-800 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Question Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-red bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {previewItem.question?.subject?.name} • {previewItem.question?.question_type}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {previewItem.case_title || previewItem.scenario_title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Narrative / Case Data */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs leading-relaxed whitespace-pre-line text-gray-800 font-mono">
              {previewItem.case_text || previewItem.scenario_text}
            </div>

            {/* Prompt */}
            {previewItem.question?.question_text && (
              <div className="text-xs font-semibold text-gray-900">
                {previewItem.question.question_text}
              </div>
            )}

            {/* Structured Fields for Accounting */}
            {previewItem.question_data?.fields && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Configured Answer Fields (Exact Numerical Matching):
                </div>
                <div className="space-y-2">
                  {previewItem.question_data.fields.map((f: any, idx: number) => (
                    <div
                      key={f.id || idx}
                      className="p-2.5 bg-blue-50/50 border border-blue-200 rounded text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{f.label}</span>
                        {f.instruction && (
                          <span className="block text-[11px] text-gray-500">{f.instruction}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-blue-900 block">
                          Expected: {f.correct_value}
                        </span>
                        <span className="text-[10px] text-blue-700 font-semibold">
                          +{f.marks} Marks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Child Tasks for Scenario */}
            {previewItem.sub_questions && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Scenario Tasks (7 Child MCQs):
                </div>
                <div className="space-y-2">
                  {previewItem.sub_questions.map((task: any, tIdx: number) => (
                    <div
                      key={task.id || tIdx}
                      className="p-3 bg-amber-50/50 border border-amber-200 rounded text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>Task {tIdx + 1}: {task.text}</span>
                        <Badge variant="neutral" className="text-[10px]">
                          +{task.marks} Marks
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-700">
                        {task.options?.map((opt: any) => (
                          <div
                            key={opt.letter}
                            className={`p-1.5 rounded border ${
                              opt.letter === task.correct_answer
                                ? 'bg-green-100 border-green-300 font-bold text-green-900'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <strong>{opt.letter}.</strong> {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setPreviewItem(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

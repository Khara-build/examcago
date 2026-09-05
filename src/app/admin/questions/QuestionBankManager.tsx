'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  createQuestionAction, 
  updateQuestionAction, 
  toggleQuestionActiveAction, 
  deleteQuestionAction 
} from '@/app/actions/admin';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react';
import Link from 'next/link';

interface QuestionBankManagerProps {
  questions: any[];
  subjects: any[];
  chapters: any[];
  totalCount: number;
  currentPage: number;
  limit: number;
  currentSearch: string;
  currentSubject: string;
  currentChapter: string;
  currentStatus: string;
  currentType: string;
}

export function QuestionBankManager({
  questions,
  subjects,
  chapters,
  totalCount,
  currentPage,
  limit,
  currentSearch,
  currentSubject,
  currentChapter,
  currentStatus,
  currentType,
}: QuestionBankManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // Update URL Query Params for Server-Side Pagination & Filtering
  function updateParams(newParams: Record<string, string | number | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchTerm, page: 1 });
  }

  // Chapters available for selected subject in form
  const formChapters = chapters.filter((c) => c.subject_id === (editingQuestion ? editingQuestion.subject_id : selectedSubjectId));

  // Available chapters for filter
  const filterChapters = currentSubject && currentSubject !== 'all'
    ? chapters.filter((c) => c.subject_id === currentSubject)
    : chapters;

  // Handle Add Question Submit
  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await createQuestionAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'MCQ Question created successfully!');
      setShowAddModal(false);
      router.refresh();
    }
  }

  // Handle Edit Question Submit
  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await updateQuestionAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Question updated successfully!');
      setEditingQuestion(null);
      router.refresh();
    }
  }

  // Handle Toggle Active
  async function handleToggleActive(id: string, currentActive: boolean) {
    const res = await toggleQuestionActiveAction(id, !currentActive);
    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', `Question ${!currentActive ? 'activated' : 'deactivated'}.`);
      router.refresh();
    }
  }

  // Handle Safe Delete
  async function handleDelete(id: string) {
    setLoading(true);
    const res = await deleteQuestionAction(id);
    setLoading(false);
    setDeletingId(null);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Question deleted successfully.');
      router.refresh();
    }
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div className={`p-4 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-md ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TOP CONTROLS & FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative w-full max-w-md">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search question text or explanation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:ring-brand-red focus:border-brand-red"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">Search</Button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Link href="/admin/questions/import">
              <Button variant="outline" size="sm" className="gap-1.5 border-brand-red text-brand-red hover:bg-red-50">
                <Upload className="h-3.5 w-3.5" />
                Bulk Import
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedSubjectId(subjects[0]?.id || '');
                setShowAddModal(true);
              }}
              className="gap-1.5 bg-brand-red hover:bg-brand-red-dark"
            >
              <Plus className="h-4 w-4" />
              Add Single MCQ
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1 text-gray-600 font-semibold">
            <Filter className="h-3.5 w-3.5 text-brand-red" />
            <span>Filters:</span>
          </div>

          {/* Subject Filter */}
          <select
            value={currentSubject}
            onChange={(e) => updateParams({ subject: e.target.value, chapter: 'all', page: 1 })}
            className="px-3 py-1.5 border rounded bg-white font-semibold text-gray-700"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {/* Chapter Filter */}
          <select
            value={currentChapter}
            onChange={(e) => updateParams({ chapter: e.target.value, page: 1 })}
            className="px-3 py-1.5 border rounded bg-white font-semibold text-gray-700"
          >
            <option value="all">All Chapters</option>
            {filterChapters.map((c) => (
              <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={currentType}
            onChange={(e) => updateParams({ type: e.target.value, page: 1 })}
            className="px-3 py-1.5 border rounded bg-white font-semibold text-gray-700"
          >
            <option value="all">All Types</option>
            <option value="mcq">MCQ Only</option>
            <option value="scenario">Scenario</option>
            <option value="large">Large Question</option>
          </select>

          {/* Active Status Filter */}
          <select
            value={currentStatus}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="px-3 py-1.5 border rounded bg-white font-semibold text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(currentSearch || currentSubject !== 'all' || currentChapter !== 'all' || currentStatus !== 'all' || currentType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                router.push(pathname);
              }}
              className="text-brand-red font-semibold hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* QUESTION BANK LISTING */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="text-center py-12 px-4 space-y-3 border-gray-300">
            <HelpCircle className="h-10 w-10 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No questions found matching your filter criteria.</p>
            <p className="text-xs text-gray-500">Try adjusting your filters or use Bulk Import to populate questions.</p>
          </Card>
        ) : (
          questions.map((q, idx) => {
            const correctOpt = q.options?.find((o: any) => o.is_correct);
            const questionIndex = (currentPage - 1) * limit + idx + 1;

            return (
              <Card key={q.id} className="border-gray-300 space-y-3 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                      {q.subject?.code || 'SUB'}
                    </span>
                    {q.chapter && (
                      <span className="text-xs text-gray-600 font-medium">
                        Ch {q.chapter.chapter_number}: {q.chapter.name}
                      </span>
                    )}
                    <Badge variant={q.is_active ? 'success' : 'neutral'}>
                      {q.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="neutral">{q.marks} Marks</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(q.id, q.is_active)}
                        title={q.is_active ? 'Deactivate Question' : 'Activate Question'}
                        className={`p-1.5 rounded transition-colors ${
                          q.is_active ? 'text-green-700 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubjectId(q.subject_id);
                          setEditingQuestion(q);
                        }}
                        title="Edit MCQ"
                        className="p-1.5 rounded text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(q.id)}
                        title="Delete MCQ"
                        className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-bold text-gray-900 leading-relaxed">
                  #{questionIndex}. {q.question_text}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options?.map((opt: any) => (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded border ${
                        opt.is_correct
                          ? 'bg-green-50 border-green-300 text-green-900 font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="font-bold">{opt.option_letter}.</span> {opt.option_text}
                      {opt.is_correct && <span className="ml-2 text-[10px] font-bold text-green-700 uppercase">(Correct)</span>}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200">
                    <strong className="text-gray-900">Explanation:</strong> {q.explanation}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* SERVER-SIDE PAGINATION CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-300 text-xs">
        <span className="text-gray-500">
          Showing <strong className="text-gray-900">{questions.length > 0 ? (currentPage - 1) * limit + 1 : 0}</strong> to{' '}
          <strong className="text-gray-900">{Math.min(currentPage * limit, totalCount)}</strong> of{' '}
          <strong className="text-gray-900">{totalCount} Questions</strong>
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: currentPage - 1 })}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>

          <span className="font-semibold px-2">Page {currentPage} of {totalPages}</span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: currentPage + 1 })}
            className="gap-1"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ADD SINGLE MCQ MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-gray-900">Add New MCQ to Question Bank</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
                  <select
                    name="subjectId"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter</label>
                  <select name="chapterId" className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold">
                    <option value="">Select Chapter (Optional)</option>
                    {formChapters.map((c) => (
                      <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Question Text</label>
                <textarea name="questionText" required rows={3} placeholder="Enter MCQ question stem..." className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option A</label>
                  <input type="text" name="optionA" required placeholder="Option A text" className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option B</label>
                  <input type="text" name="optionB" required placeholder="Option B text" className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option C</label>
                  <input type="text" name="optionC" required placeholder="Option C text" className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option D</label>
                  <input type="text" name="optionD" required placeholder="Option D text" className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Correct Answer Option</label>
                  <select name="correctAnswer" defaultValue="A" className="w-full px-3 py-2 text-xs border rounded bg-white font-bold text-green-700">
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Marks</label>
                  <input type="number" name="marks" defaultValue={2} min={1} className="w-full px-3 py-2 text-xs border rounded bg-white font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Explanation</label>
                <textarea name="explanation" rows={2} placeholder="Rationale for correct answer..." className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="bg-brand-red">Save MCQ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MCQ MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-gray-900">Edit MCQ Question</h3>
              <button onClick={() => setEditingQuestion(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="hidden" name="id" value={editingQuestion.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
                  <select
                    name="subjectId"
                    defaultValue={editingQuestion.subject_id}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter</label>
                  <select name="chapterId" defaultValue={editingQuestion.chapter_id || ''} className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold">
                    <option value="">Select Chapter (Optional)</option>
                    {formChapters.map((c) => (
                      <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Question Text</label>
                <textarea name="questionText" defaultValue={editingQuestion.question_text} required rows={3} className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option A</label>
                  <input type="text" name="optionA" defaultValue={editingQuestion.options?.find((o: any) => o.option_letter === 'A')?.option_text || ''} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option B</label>
                  <input type="text" name="optionB" defaultValue={editingQuestion.options?.find((o: any) => o.option_letter === 'B')?.option_text || ''} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option C</label>
                  <input type="text" name="optionC" defaultValue={editingQuestion.options?.find((o: any) => o.option_letter === 'C')?.option_text || ''} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Option D</label>
                  <input type="text" name="optionD" defaultValue={editingQuestion.options?.find((o: any) => o.option_letter === 'D')?.option_text || ''} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Correct Answer</label>
                  <select name="correctAnswer" defaultValue={editingQuestion.options?.find((o: any) => o.is_correct)?.option_letter || 'A'} className="w-full px-3 py-2 text-xs border rounded bg-white font-bold text-green-700">
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Marks</label>
                  <input type="number" name="marks" defaultValue={editingQuestion.marks} min={1} className="w-full px-3 py-2 text-xs border rounded bg-white font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
                  <select name="isActive" defaultValue={String(editingQuestion.is_active)} className="w-full px-3 py-2 text-xs border rounded bg-white">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Explanation</label>
                <textarea name="explanation" defaultValue={editingQuestion.explanation || ''} rows={2} className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="bg-brand-red">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl space-y-4 text-left">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-gray-900">Delete Question?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete this question? Questions recorded in student exam attempts cannot be deleted.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deletingId)} isLoading={loading}>Confirm Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

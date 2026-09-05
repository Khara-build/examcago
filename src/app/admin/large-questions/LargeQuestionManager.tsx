'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createLargeQuestionAction, deleteLargeQuestionAction } from '@/app/actions/admin';
import { FileText, Plus, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LargeQuestionManagerProps {
  subjects: any[];
  chapters: any[];
  largeQuestions: any[];
}

export function LargeQuestionManager({ subjects, chapters, largeQuestions }: LargeQuestionManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  const availableChapters = chapters.filter((c) => c.subject_id === selectedSubjectId);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await createLargeQuestionAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Large Question created successfully!');
      setShowAddModal(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const res = await deleteLargeQuestionAction(id);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Large question deleted successfully.');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
        <span className="text-xs text-gray-500 font-semibold">
          Configured Large Questions ({largeQuestions.length})
        </span>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="gap-1.5 bg-brand-red hover:bg-brand-red-dark"
        >
          <Plus className="h-4 w-4" />
          Add Large Question
        </Button>
      </div>

      <div className="space-y-4">
        {largeQuestions.length === 0 ? (
          <Card className="text-center py-12 px-4 space-y-3 border-gray-300">
            <FileText className="h-10 w-10 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No large questions created yet.</p>
            <p className="text-xs text-gray-500">Large questions support 20-mark Financial Statements and Cash Flow problem sets for Accounting.</p>
          </Card>
        ) : (
          largeQuestions.map((lq: any) => (
            <Card key={lq.id} className="border-gray-300 space-y-3 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                    {lq.question?.subject?.code || 'LARGE'}
                  </span>
                  <Badge variant="brand">{lq.template_type.replace('_', ' ').toUpperCase()}</Badge>
                  <Badge variant="neutral">{lq.question?.marks || 20} Marks</Badge>
                </div>

                <button
                  onClick={() => handleDelete(lq.question_id)}
                  title="Delete Large Question"
                  className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-gray-900">{lq.case_title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap font-mono">
                {lq.case_text}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* ADD LARGE QUESTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-gray-900">Add Large Question</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Template Type</label>
                  <select name="templateType" defaultValue="financial_statements" className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold">
                    <option value="financial_statements">Financial Statements</option>
                    <option value="cash_flow">Cash Flow Statement</option>
                    <option value="audit_report">Audit Report</option>
                    <option value="other">Other Problem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Case / Problem Title</label>
                <input type="text" name="caseTitle" required placeholder="e.g. Final Accounts Preparation & Adjustments" className="w-full px-3 py-2 text-xs border rounded bg-white font-bold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Marks</label>
                <input type="number" name="marks" defaultValue={20} min={1} required className="w-full px-3 py-2 text-xs border rounded bg-white font-bold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Trial Balance & Adjustments Data / Text</label>
                <textarea name="caseText" required rows={5} placeholder="Enter trial balance figures and year-end adjustments..." className="w-full px-3 py-2 text-xs border rounded bg-white font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="bg-brand-red">Save Problem Set</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

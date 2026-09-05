'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createScenarioQuestionAction, deleteScenarioQuestionAction } from '@/app/actions/admin';
import { FileText, Plus, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScenarioManagerProps {
  subjects: any[];
  chapters: any[];
  scenarios: any[];
}

export function ScenarioManager({ subjects, chapters, scenarios }: ScenarioManagerProps) {
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

    const res = await createScenarioQuestionAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Scenario Question created successfully!');
      setShowAddModal(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const res = await deleteScenarioQuestionAction(id);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Scenario deleted successfully.');
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

      {/* Header bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
        <span className="text-xs text-gray-500 font-semibold">
          Configured Scenario Questions ({scenarios.length})
        </span>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="gap-1.5 bg-brand-red hover:bg-brand-red-dark"
        >
          <Plus className="h-4 w-4" />
          Add Scenario Question
        </Button>
      </div>

      {/* Scenario List */}
      <div className="space-y-4">
        {scenarios.length === 0 ? (
          <Card className="text-center py-12 px-4 space-y-3 border-gray-300">
            <FileText className="h-10 w-10 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No scenario questions created yet.</p>
            <p className="text-xs text-gray-500">Scenario questions support multi-step case studies for Management Information and Tax.</p>
          </Card>
        ) : (
          scenarios.map((sc: any) => (
            <Card key={sc.id} className="border-gray-300 space-y-3 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                    {sc.question?.subject?.code || 'SCENARIO'}
                  </span>
                  <span className="text-xs text-gray-600 font-semibold">
                    {sc.question?.subject?.name}
                  </span>
                  <Badge variant="brand">{sc.question?.marks || 15} Marks</Badge>
                </div>

                <button
                  onClick={() => handleDelete(sc.question_id)}
                  title="Delete Scenario"
                  className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-gray-900">{sc.scenario_title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                {sc.scenario_text}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* ADD SCENARIO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-gray-900">Add Scenario-Based Question</h3>
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
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter</label>
                  <select name="chapterId" className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold">
                    <option value="">Select Chapter (Optional)</option>
                    {availableChapters.map((c) => (
                      <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Scenario Title</label>
                <input type="text" name="scenarioTitle" required placeholder="e.g. Budgeting Variance Case Study" className="w-full px-3 py-2 text-xs border rounded bg-white font-bold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Marks</label>
                <input type="number" name="marks" defaultValue={15} min={1} required className="w-full px-3 py-2 text-xs border rounded bg-white font-bold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Scenario Case Text / Background</label>
                <textarea name="scenarioText" required rows={5} placeholder="Enter full scenario stem narrative..." className="w-full px-3 py-2 text-xs border rounded bg-white font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="bg-brand-red">Save Scenario</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

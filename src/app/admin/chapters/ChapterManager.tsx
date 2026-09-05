'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  createChapterAction, 
  updateChapterAction, 
  toggleChapterActiveAction, 
  deleteChapterAction 
} from '@/app/actions/admin';
import { Layers, Plus, Edit2, Trash2, Power, AlertCircle, CheckCircle2, X, Filter } from 'lucide-react';

interface ChapterManagerProps {
  initialSubjects: any[];
  initialChapters: any[];
}

export function ChapterManager({ initialSubjects, initialChapters }: ChapterManagerProps) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // Filter chapters
  const filteredChapters = selectedSubjectFilter === 'all'
    ? initialChapters
    : initialChapters.filter((c) => c.subject_id === selectedSubjectFilter);

  // Handle Create Chapter
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await createChapterAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Chapter created successfully!');
      (e.target as HTMLFormElement).reset();
    }
  }

  // Handle Update Chapter
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await updateChapterAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Chapter updated successfully!');
      setEditingChapter(null);
    }
  }

  // Handle Toggle Active
  async function handleToggleActive(id: string, currentActive: boolean) {
    const res = await toggleChapterActiveAction(id, !currentActive);
    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', `Chapter ${!currentActive ? 'activated' : 'deactivated'} successfully.`);
    }
  }

  // Handle Safe Delete
  async function handleDelete(id: string) {
    setLoading(true);
    const res = await deleteChapterAction(id);
    setLoading(false);
    setDeletingId(null);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Chapter deleted successfully.');
    }
  }

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

      {/* Subject Filter Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Filter className="h-4 w-4 text-brand-red" />
          <span>Filter Chapters by Subject:</span>
        </div>

        <select
          value={selectedSubjectFilter}
          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white font-semibold text-gray-800 focus:ring-brand-red focus:border-brand-red"
        >
          <option value="all">All Subjects ({initialChapters.length} Chapters)</option>
          {initialSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapters Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 border-gray-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Ch #</th>
                    <th className="p-3">Chapter Title</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredChapters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        No chapters found for the selected subject filter.
                      </td>
                    </tr>
                  ) : (
                    filteredChapters.map((ch) => (
                      <tr key={ch.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-gray-500">Ch {ch.chapter_number}</td>
                        <td className="p-3 font-bold text-gray-900">{ch.name}</td>
                        <td className="p-3">
                          <span className="font-semibold text-brand-red bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                            {ch.subject?.code || ch.subject?.name}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={ch.is_active ? 'success' : 'neutral'}>
                            {ch.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleActive(ch.id, ch.is_active)}
                              title={ch.is_active ? 'Deactivate Chapter' : 'Activate Chapter'}
                              className={`p-1.5 rounded transition-colors ${
                                ch.is_active ? 'text-green-700 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingChapter(ch)}
                              title="Edit Chapter"
                              className="p-1.5 rounded text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(ch.id)}
                              title="Delete Chapter"
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Create Chapter Form Panel */}
        <Card className="border-gray-300 space-y-4 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-red" />
              Add New Chapter
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
              <select name="subjectId" required className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold">
                {initialSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter Number</label>
              <input type="number" name="chapterNumber" defaultValue={1} min={1} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter Name</label>
              <input type="text" name="name" required placeholder="e.g. Trial Balance Rectification" className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
              <textarea name="description" rows={2} placeholder="Optional syllabus scope notes" className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full bg-brand-red hover:bg-brand-red-dark" isLoading={loading}>
              Create Chapter
            </Button>
          </form>
        </Card>
      </div>

      {/* EDIT CHAPTER MODAL */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-gray-900">Edit Chapter</h3>
              <button onClick={() => setEditingChapter(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <input type="hidden" name="id" value={editingChapter.id} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
                <select name="subjectId" defaultValue={editingChapter.subject_id} required className="w-full px-3 py-2 text-xs border rounded bg-white font-semibold">
                  {initialSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter Number</label>
                <input type="number" name="chapterNumber" defaultValue={editingChapter.chapter_number} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chapter Name</label>
                <input type="text" name="name" defaultValue={editingChapter.name} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
                <select name="isActive" defaultValue={String(editingChapter.is_active)} className="w-full px-3 py-2 text-xs border rounded bg-white">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
                <textarea name="description" defaultValue={editingChapter.description || ''} rows={2} className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingChapter(null)}>Cancel</Button>
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
              <h3 className="text-base font-bold text-gray-900">Delete Chapter?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete this chapter? Deletion is allowed only if no questions reference it.
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

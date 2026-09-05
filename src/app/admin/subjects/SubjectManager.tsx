'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  createSubjectAction, 
  updateSubjectAction, 
  toggleSubjectActiveAction, 
  deleteSubjectAction 
} from '@/app/actions/admin';
import { BookOpen, Plus, Edit2, Trash2, Power, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface SubjectManagerProps {
  initialSubjects: any[];
}

export function SubjectManager({ initialSubjects }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // Handle Create Subject
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await createSubjectAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Subject created successfully!');
      (e.target as HTMLFormElement).reset();
    }
  }

  // Handle Edit Subject
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await updateSubjectAction(formData);
    setLoading(false);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Subject updated successfully!');
      setEditingSubject(null);
    }
  }

  // Handle Toggle Active Status
  async function handleToggleActive(id: string, currentActive: boolean) {
    const res = await toggleSubjectActiveAction(id, !currentActive);
    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', `Subject ${!currentActive ? 'activated' : 'deactivated'} successfully.`);
    }
  }

  // Handle Safe Delete
  async function handleDelete(id: string) {
    setLoading(true);
    const res = await deleteSubjectAction(id);
    setLoading(false);
    setDeletingId(null);

    if (res?.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Subject deleted successfully.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback Banner */}
      {toast && (
        <div className={`p-4 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in ${
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Directory Table / Cards */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 border-gray-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Code / Subject</th>
                    <th className="p-3">Chapters</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {initialSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-500">#{sub.display_order}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-red bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                            {sub.code}
                          </span>
                          <div>
                            <span className="font-bold text-gray-900 block">{sub.name}</span>
                            <span className="text-[11px] text-gray-500 line-clamp-1">{sub.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-700">
                        {sub.chapters?.[0]?.count || 0} Chapters
                      </td>
                      <td className="p-3">
                        <Badge variant={sub.is_active ? 'success' : 'neutral'}>
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleActive(sub.id, sub.is_active)}
                            title={sub.is_active ? 'Deactivate Subject' : 'Activate Subject'}
                            className={`p-1.5 rounded transition-colors ${
                              sub.is_active ? 'text-green-700 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingSubject(sub)}
                            title="Edit Subject"
                            className="p-1.5 rounded text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(sub.id)}
                            title="Delete Subject"
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Create Subject Form Panel */}
        <Card className="border-gray-300 space-y-4 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-red" />
              Add New ICAB Subject
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject Name</label>
              <input type="text" name="name" required placeholder="e.g. Advanced Taxation" className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject Code</label>
              <input type="text" name="code" required placeholder="e.g. ATAX" className="w-full px-3 py-2 text-xs border rounded bg-white uppercase" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Display Order</label>
              <input type="number" name="displayOrder" defaultValue={10} min={1} className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
              <textarea name="description" rows={3} placeholder="Syllabus overview and learning objectives" className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full bg-brand-red hover:bg-brand-red-dark" isLoading={loading}>
              Create Subject
            </Button>
          </form>
        </Card>
      </div>

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-bold text-gray-900">Edit Subject: {editingSubject.name}</h3>
              <button onClick={() => setEditingSubject(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <input type="hidden" name="id" value={editingSubject.id} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject Name</label>
                <input type="text" name="name" defaultValue={editingSubject.name} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject Code</label>
                <input type="text" name="code" defaultValue={editingSubject.code} required className="w-full px-3 py-2 text-xs border rounded bg-white uppercase" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Display Order</label>
                <input type="number" name="displayOrder" defaultValue={editingSubject.display_order} required className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
                <select name="isActive" defaultValue={String(editingSubject.is_active)} className="w-full px-3 py-2 text-xs border rounded bg-white">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
                <textarea name="description" defaultValue={editingSubject.description || ''} rows={3} className="w-full px-3 py-2 text-xs border rounded bg-white" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingSubject(null)}>Cancel</Button>
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
              <h3 className="text-base font-bold text-gray-900">Delete Subject?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete this subject? Deletion is only allowed if no questions or chapters depend on it.
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

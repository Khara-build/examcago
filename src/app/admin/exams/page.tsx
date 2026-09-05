import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateExamConfigAction } from '@/app/actions/admin';
import { Sliders, Clock, Save } from 'lucide-react';

export default async function AdminExamsPage() {
  const adminClient = createAdminClient();

  const { data: configs } = await adminClient
    .from('exam_configs')
    .select('*, subject:subjects(*)')
    .order('created_at');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sliders className="h-6 w-6 text-brand-red" />
          Generic Exam Rule Configuration Engine
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Administrators can modify question counts, marks, types, and durations dynamically without altering code.
        </p>
      </div>

      <div className="space-y-6">
        {configs?.map((cfg: any) => (
          <Card key={cfg.id} className="border-gray-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-3 py-1 rounded">
                  {cfg.subject?.code}
                </span>
                <h3 className="text-base font-bold text-gray-900">{cfg.name}</h3>
              </div>
              <Badge variant="brand">{cfg.exam_type.replace('_', ' ').toUpperCase()}</Badge>
            </div>

            <form action={updateExamConfigAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <input type="hidden" name="configId" value={cfg.id} />

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  name="durationMinutes"
                  defaultValue={cfg.duration_minutes}
                  required
                  className="w-full px-3 py-2 border rounded bg-white font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">MCQ Count & Marks</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="mcqCount"
                    defaultValue={cfg.mcq_count}
                    className="w-1/2 px-2 py-2 border rounded bg-white text-center font-bold"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    name="mcqMarks"
                    defaultValue={cfg.mcq_marks_each}
                    className="w-1/2 px-2 py-2 border rounded bg-white text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Scenario Count & Marks</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="scenarioCount"
                    defaultValue={cfg.scenario_count}
                    className="w-1/2 px-2 py-2 border rounded bg-white text-center font-bold"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    name="scenarioMarks"
                    defaultValue={cfg.scenario_marks_each}
                    className="w-1/2 px-2 py-2 border rounded bg-white text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Large Count & Marks</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="largeCount"
                    defaultValue={cfg.large_count}
                    className="w-1/2 px-2 py-2 border rounded bg-white text-center font-bold"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    name="largeMarks"
                    defaultValue={cfg.large_marks_each}
                    className="w-1/2 px-2 py-2 border rounded bg-white text-center font-bold"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 text-xs font-semibold text-gray-700 pt-2">
                <span>Calculated Total Marks: <strong className="text-brand-red text-sm">{cfg.total_marks} Marks</strong></span>
              </div>

              <div className="sm:col-span-2 lg:col-span-1 flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" className="gap-1.5 bg-brand-red">
                  <Save className="h-3.5 w-3.5" /> Save Configuration
                </Button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}

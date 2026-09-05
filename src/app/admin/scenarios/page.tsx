import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ScenarioManager } from './ScenarioManager';
import { FileText } from 'lucide-react';

export default async function AdminScenariosPage() {
  const adminClient = createAdminClient();

  const { data: subjects } = await adminClient.from('subjects').select('id, name, code').order('display_order');
  const { data: chapters } = await adminClient.from('chapters').select('id, name, subject_id, chapter_number').order('chapter_number');
  const { data: scenarios } = await adminClient.from('scenario_questions').select('*, question:questions(*, subject:subjects(*))');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand-red" />
          Scenario-Based Question Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Create and manage scenario case studies for Management Information, Tax, and other ICAB subjects.
        </p>
      </div>

      <ScenarioManager
        subjects={subjects || []}
        chapters={chapters || []}
        scenarios={scenarios || []}
      />
    </div>
  );
}

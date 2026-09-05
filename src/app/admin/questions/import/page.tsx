import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { createAdminClient } from '@/lib/supabase/admin';
import { BulkImportWorkflow } from './BulkImportWorkflow';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';

export default async function AdminImportPage() {
  const adminClient = createAdminClient();

  const { data: subjects } = await adminClient.from('subjects').select('id, name, code, slug').order('display_order');
  const { data: chapters } = await adminClient.from('chapters').select('id, name, subject_id, chapter_number');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="h-6 w-6 text-brand-red" />
          Bulk Question Import System
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Upload hundreds or thousands of MCQs at once using Excel (.xlsx), CSV, or JSON files.
        </p>
      </div>

      <BulkImportWorkflow
        subjects={subjects || []}
        chapters={chapters || []}
      />
    </div>
  );
}

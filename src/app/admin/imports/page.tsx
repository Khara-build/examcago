import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { Database, Upload } from 'lucide-react';

export default async function AdminImportsPage() {
  const adminClient = createAdminClient();

  const { data: imports } = await adminClient
    .from('bulk_imports')
    .select('*, admin:profiles(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-brand-red" />
            Bulk Imports History Audit Log
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete audit trail of previous question bank batch imports, breakdown of valid/duplicate/invalid rows.
          </p>
        </div>

        <Link href="/admin/questions/import">
          <Button variant="primary" size="sm" className="gap-2 bg-brand-red">
            <Upload className="h-4 w-4" />
            New Bulk Import
          </Button>
        </Link>
      </div>

      <Card className="p-0 border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="p-4">File Name</th>
                <th className="p-4">Format</th>
                <th className="p-4">Total Rows</th>
                <th className="p-4">Imported</th>
                <th className="p-4">Duplicates</th>
                <th className="p-4">Invalid</th>
                <th className="p-4">Status</th>
                <th className="p-4">Admin User</th>
                <th className="p-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {imports?.map((imp: any) => (
                <tr key={imp.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{imp.file_name}</td>
                  <td className="p-4 font-mono uppercase text-gray-600">{imp.file_type}</td>
                  <td className="p-4 font-mono font-bold text-gray-900">{imp.total_rows}</td>
                  <td className="p-4 font-bold text-green-700">{imp.imported_rows}</td>
                  <td className="p-4 font-bold text-amber-700">{imp.duplicate_rows || 0}</td>
                  <td className="p-4 font-bold text-red-700">{imp.invalid_rows || 0}</td>
                  <td className="p-4">
                    <Badge variant={imp.status === 'completed' ? 'success' : 'danger'}>
                      {imp.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-gray-700">{imp.admin?.full_name || imp.admin?.email || 'System Admin'}</td>
                  <td className="p-4 text-right text-gray-500">{new Date(imp.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

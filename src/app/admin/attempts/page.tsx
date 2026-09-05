import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { History } from 'lucide-react';

export default async function AdminAttemptsPage() {
  const adminClient = createAdminClient();

  const { data: attempts } = await adminClient
    .from('exam_attempts')
    .select('*, profile:profiles(*), subject:subjects(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="h-6 w-6 text-brand-red" />
          Global Exam Attempts Log
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Audit log of all student exam attempts across the platform.
        </p>
      </div>

      <Card className="p-0 border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Exam Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score / Marks</th>
                <th className="p-4 text-right">Started Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {attempts?.map((att: any) => (
                <tr key={att.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{att.profile?.full_name || att.profile?.email}</td>
                  <td className="p-4 font-semibold text-gray-800">{att.subject?.name}</td>
                  <td className="p-4 capitalize text-gray-600">{att.exam_type.replace('_', ' ')}</td>
                  <td className="p-4">
                    {att.status === 'submitted' ? (
                      att.is_passed ? <Badge variant="success">PASSED</Badge> : <Badge variant="danger">FAILED</Badge>
                    ) : (
                      <Badge variant="warning">IN PROGRESS</Badge>
                    )}
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {att.status === 'submitted' ? `${att.score} / ${att.total_marks}` : '-'}
                  </td>
                  <td className="p-4 text-right text-gray-500">{new Date(att.started_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

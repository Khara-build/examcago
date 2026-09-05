'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { parseAndValidateImportAction, executeConfirmedImportAction } from '@/app/actions/import';
import type { ValidationReport, ValidatedImportRow } from '@/app/actions/import';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  Trash2,
  CopyCheck,
  HelpCircle,
  Check
} from 'lucide-react';

interface BulkImportWorkflowProps {
  subjects: any[];
  chapters: any[];
}

export function BulkImportWorkflow({ subjects, chapters }: BulkImportWorkflowProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'duplicate' | 'invalid'>('valid');

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setReport(null);
      setImportResult(null);
    }
  }

  // Trigger Validation
  async function handleValidate() {
    if (!selectedFile) {
      setError('Please select a file to import.');
      return;
    }

    setValidating(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const res = await parseAndValidateImportAction(formData);

    if (res.error) {
      setError(res.error);
      setValidating(false);
    } else if (res.report) {
      setReport(res.report);
      setValidating(false);
      if (res.report.validRows.length > 0) setActiveTab('valid');
      else if (res.report.duplicateRows.length > 0) setActiveTab('duplicate');
      else setActiveTab('invalid');
    }
  }

  // Trigger Confirmed Import
  async function handleExecuteImport() {
    if (!report) return;

    let rowsToImport = [...report.validRows];
    if (includeDuplicates) {
      rowsToImport = [...rowsToImport, ...report.duplicateRows];
    }

    if (rowsToImport.length === 0) {
      setError('No rows selected for import.');
      return;
    }

    setImporting(true);
    setError(null);

    const res = await executeConfirmedImportAction(
      rowsToImport,
      report.fileName,
      report.fileType,
      report.totalRows,
      report.invalidRows.length,
      report.duplicateRows.length
    );

    if (res.error) {
      setError(res.error);
      setImporting(false);
    } else {
      setImportResult({
        importedCount: res.importedCount || 0,
      });
      setImporting(false);
    }
  }

  // Generate and download sample CSV template with instructions based on current ICAB Certificate Level syllabus
  function downloadSampleCSV() {
    const csvContent = `Subject,Chapter,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Marks
Accounting,Introduction to accounting,"Which accounting concept requires transactions to be recorded at historical cost?",Historical Cost Principle,Going Concern,Matching Principle,Materiality,A,"The historical cost principle dictates that assets are recorded at their purchase price.",2
Accounting,Errors and corrections to accounting records and financial statements,"Which of the following errors will cause an imbalance in the trial balance?",Single entry error,Omission of transaction,Error of principle,Error of commission,A,"Single entry errors create an unequal balance between debits and credits.",2
Management Information,The fundamentals of costing,"What type of cost remains constant per unit regardless of output changes?",Variable Cost,Fixed Cost,Semi-variable Cost,Step Cost,A,"Variable cost per unit is constant; total variable cost varies with volume.",2
Taxation,Basic concepts of taxation and Introduction to Bangladesh income tax,"What is the standard tax year cycle classification in tax compliance?",Assessment Year,Income Year,Calendar Year,Financial Quarter,A,"Assessment year follows the income year for tax computation.",2
Assurance,Concept of and need for assurance,"What is the primary objective of an external financial statement audit?",Express an independent opinion,Detect all minor fraud,Prepare final accounts,Advise on business strategy,A,"An external audit provides reasonable assurance via an independent audit opinion.",2
Business Law,Introduction to Bangladesh legal system,"What is the supreme law of Bangladesh?",The Constitution of Bangladesh,The Penal Code,The Companies Act,The Contract Act,A,"The Constitution is the supreme law of the Republic.",2
Information Technology,IT PRO MAX,"Which of the following is a primary control for database access security?",Role-based access control (RBAC),Screen saver password,Desktop background,Monitor resolution,A,"RBAC ensures only authorized users have access to sensitive database tables.",2`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'exam_cago_mcq_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate and download sample JSON template
  function downloadSampleJSON() {
    const sampleData = [
      {
        Subject: "Accounting",
        Chapter: "Introduction to accounting",
        Question: "Which accounting concept requires transactions to be recorded at historical cost?",
        "Option A": "Historical Cost Principle",
        "Option B": "Going Concern",
        "Option C": "Matching Principle",
        "Option D": "Materiality",
        "Correct Answer": "A",
        Explanation: "The historical cost principle dictates that assets are recorded at their purchase price.",
        Marks: 2
      },
      {
        Subject: "Taxation",
        Chapter: "Basic concepts of taxation and Introduction to Bangladesh income tax",
        Question: "What is the standard tax year cycle classification in tax compliance?",
        "Option A": "Assessment Year",
        "Option B": "Income Year",
        "Option C": "Calendar Year",
        "Option D": "Financial Quarter",
        "Correct Answer": "A",
        Explanation: "Assessment year follows the income year for tax computation.",
        Marks: 2
      },
      {
        Subject: "Information Technology",
        Chapter: "IT PRO MAX",
        Question: "Which of the following is a primary control for database access security?",
        "Option A": "Role-based access control (RBAC)",
        "Option B": "Screen saver password",
        "Option C": "Desktop background",
        "Option D": "Monitor resolution",
        "Correct Answer": "A",
        Explanation: "RBAC ensures only authorized users have access to sensitive database tables.",
        Marks: 2
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'exam_cago_mcq_import_template.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Reset Workflow
  function handleReset() {
    setSelectedFile(null);
    setReport(null);
    setError(null);
    setImportResult(null);
    setIncludeDuplicates(false);
  }

  return (
    <div className="space-y-6">
      {/* Download Templates Banner & Formatting Instructions */}
      <Card className="border-gray-300 bg-amber-50/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-brand-red" />
              Download Bulk Import Templates & Formatting Rules
            </h3>
            <p className="text-xs text-gray-600">
              Download templates containing exact column headers: <strong>Subject, Chapter, Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation, Marks</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={downloadSampleCSV} className="gap-2 bg-white">
              <Download className="h-4 w-4 text-brand-red" />
              Sample CSV
            </Button>
            <Button variant="outline" size="sm" onClick={downloadSampleJSON} className="gap-2 bg-white">
              <Download className="h-4 w-4 text-brand-red" />
              Sample JSON
            </Button>
          </div>
        </div>

        <div className="text-[11px] text-gray-700 bg-white p-3 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <strong className="text-gray-900 block">Accepted Correct Answer:</strong>
            Must strictly be <span className="font-mono font-bold text-brand-red">A</span>, <span className="font-mono font-bold text-brand-red">B</span>, <span className="font-mono font-bold text-brand-red">C</span>, or <span className="font-mono font-bold text-brand-red">D</span>.
          </div>
          <div>
            <strong className="text-gray-900 block">Subject & Chapter Verification:</strong>
            Subject and Chapter names must exist in DB and Chapter must belong to Subject.
          </div>
          <div>
            <strong className="text-gray-900 block">Marks Configuration:</strong>
            Default is 2 marks. Must be a valid positive integer.
          </div>
        </div>
      </Card>

      {/* STEP 1: FILE SELECTION & UPLOAD */}
      {!report && !importResult && (
        <Card className="border-gray-300 space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Upload Question File</CardTitle>
            <CardDescription>Supported formats: Excel (.xlsx), CSV (.csv), JSON (.json)</CardDescription>
          </CardHeader>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4 bg-gray-50 hover:bg-gray-100/50 transition-colors">
            <Upload className="h-10 w-10 text-gray-400 mx-auto" />
            <div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Select File from Computer
              </label>
            </div>

            {selectedFile ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-brand-red border border-red-200 rounded text-xs font-mono font-bold">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Drag & drop or select an Excel/CSV file to validate</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              disabled={!selectedFile}
              isLoading={validating}
              onClick={handleValidate}
              className="gap-2 bg-brand-red hover:bg-brand-red-dark"
            >
              Parse & Validate Content
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: PREVIEW & VALIDATION REPORT */}
      {report && !importResult && (
        <Card className="border-gray-300 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Validation & Duplicate Report</h3>
                <Badge variant="brand">{report.fileType.toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">File: {report.fileName}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
                <Trash2 className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={report.validRows.length === 0 && (!includeDuplicates || report.duplicateRows.length === 0)}
                isLoading={importing}
                onClick={handleExecuteImport}
                className="gap-2 bg-brand-red hover:bg-brand-red-dark"
              >
                Confirm & Import ({report.validRows.length + (includeDuplicates ? report.duplicateRows.length : 0)} Rows)
              </Button>
            </div>
          </div>

          {/* Validation Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-xs text-gray-500 block">Total Rows</span>
              <strong className="text-xl font-bold text-gray-900">{report.totalRows}</strong>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <span className="text-xs text-green-700 block">Valid New Questions</span>
              <strong className="text-xl font-bold text-green-700">{report.validRows.length}</strong>
            </div>
            <div className="p-3 bg-amber-50 rounded border border-amber-200">
              <span className="text-xs text-amber-800 block">Duplicates Detected</span>
              <strong className="text-xl font-bold text-amber-700">{report.duplicateRows.length}</strong>
            </div>
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <span className="text-xs text-red-700 block">Invalid Rows Flagged</span>
              <strong className="text-xl font-bold text-red-700">{report.invalidRows.length}</strong>
            </div>
          </div>

          {/* Duplicate Handling Checkbox */}
          {report.duplicateRows.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <CopyCheck className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Found <strong>{report.duplicateRows.length} duplicate questions</strong> matching DB or file entries.</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={includeDuplicates}
                  onChange={(e) => setIncludeDuplicates(e.target.checked)}
                  className="rounded text-brand-red focus:ring-brand-red"
                />
                <span>Include Duplicates in Import</span>
              </label>
            </div>
          )}

          {/* Tabs for Preview Breakdown */}
          <div className="space-y-3">
            <div className="flex border-b border-gray-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('valid')}
                className={`py-2 px-4 border-b-2 transition-colors ${
                  activeTab === 'valid'
                    ? 'border-brand-red text-brand-red font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Valid New Rows ({report.validRows.length})
              </button>

              <button
                onClick={() => setActiveTab('duplicate')}
                className={`py-2 px-4 border-b-2 transition-colors ${
                  activeTab === 'duplicate'
                    ? 'border-amber-600 text-amber-700 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Duplicate Rows ({report.duplicateRows.length})
              </button>

              <button
                onClick={() => setActiveTab('invalid')}
                className={`py-2 px-4 border-b-2 transition-colors ${
                  activeTab === 'invalid'
                    ? 'border-red-600 text-red-600 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Invalid Rows ({report.invalidRows.length})
              </button>
            </div>

            {/* TAB 1: VALID ROWS */}
            {activeTab === 'valid' && (
              <div className="overflow-x-auto max-h-[350px]">
                {report.validRows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">No valid new rows found.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Row #</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Chapter</th>
                        <th className="p-3">Question Text</th>
                        <th className="p-3">Correct Ans</th>
                        <th className="p-3">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.validRows.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-gray-50">
                          <td className="p-3 font-mono font-bold text-gray-500">#{r.rowNumber}</td>
                          <td className="p-3 font-semibold text-gray-900">{r.subjectName}</td>
                          <td className="p-3 text-gray-700">{r.chapterName}</td>
                          <td className="p-3 text-gray-800 max-w-xs truncate">{r.questionText}</td>
                          <td className="p-3 font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded w-fit">
                            Option {r.correctAnswer}
                          </td>
                          <td className="p-3 font-bold text-gray-900">{r.marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 2: DUPLICATE ROWS */}
            {activeTab === 'duplicate' && (
              <div className="overflow-x-auto max-h-[350px]">
                {report.duplicateRows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">No duplicate rows detected.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50 border-b border-amber-200 text-amber-900 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Row #</th>
                        <th className="p-3">Subject / Chapter</th>
                        <th className="p-3">Question Text</th>
                        <th className="p-3">Duplicate Detection Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 bg-amber-50/20">
                      {report.duplicateRows.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-amber-50/40">
                          <td className="p-3 font-mono font-bold text-amber-800">#{r.rowNumber}</td>
                          <td className="p-3 text-gray-800">
                            <div>{r.subjectName}</div>
                            <div className="text-[11px] text-gray-500">{r.chapterName}</div>
                          </td>
                          <td className="p-3 text-gray-800 max-w-xs truncate">{r.questionText}</td>
                          <td className="p-3">
                            <span className="text-amber-800 font-semibold text-[11px] block">
                              {r.errors.join(' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 3: INVALID ROWS */}
            {activeTab === 'invalid' && (
              <div className="overflow-x-auto max-h-[350px]">
                {report.invalidRows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">No invalid rows found!</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-red-50 border-b border-red-200 text-red-800 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Row #</th>
                        <th className="p-3">Subject / Chapter</th>
                        <th className="p-3">Question Text</th>
                        <th className="p-3">Explicit Validation Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100 bg-red-50/20">
                      {report.invalidRows.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-red-50/40">
                          <td className="p-3 font-mono font-bold text-red-700">#{r.rowNumber}</td>
                          <td className="p-3 text-gray-800">
                            <div>{r.subjectName || <em className="text-red-500">Missing Subject</em>}</div>
                            <div className="text-[11px] text-gray-500">{r.chapterName}</div>
                          </td>
                          <td className="p-3 text-gray-800 max-w-xs truncate">{r.questionText || <em className="text-red-500">Empty Question</em>}</td>
                          <td className="p-3">
                            <ul className="list-disc pl-4 space-y-0.5 text-red-700 font-medium text-[11px]">
                              {r.errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* STEP 3: SUCCESS RESULT DISPLAY */}
      {importResult && (
        <Card className="border-green-300 bg-green-50/30 text-center py-10 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Atomic Bulk Import Complete!</h2>
            <p className="text-xs text-gray-600 mt-1">
              Successfully inserted <strong>{importResult.importedCount} questions and option sets</strong> into the database.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Import Another File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

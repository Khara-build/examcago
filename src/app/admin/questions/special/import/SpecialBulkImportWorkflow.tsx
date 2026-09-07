'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  ArrowLeft, 
  Check, 
  Loader2, 
  Layers,
  BookOpen,
  HelpCircle,
  CopyCheck,
  ChevronDown
} from 'lucide-react';
import { 
  parseAndValidateSpecialImportAction, 
  executeConfirmedSpecialImportAction 
} from '@/app/actions/import-special';
import type { SpecialValidationReport, ValidatedSpecialUnit } from '@/app/actions/import-special';
import { 
  ACCOUNTING_CSV_TEMPLATE, 
  ACCOUNTING_JSON_TEMPLATE, 
  getScenarioCsvTemplate, 
  getScenarioJsonTemplate,
  generateXlsxFromCsv
} from '@/lib/templates/special-templates';

interface SpecialBulkImportWorkflowProps {
  subjects: any[];
  chapters: any[];
}

export function SpecialBulkImportWorkflow({ subjects, chapters }: SpecialBulkImportWorkflowProps) {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SpecialValidationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'duplicate' | 'invalid'>('valid');
  const [importSuccessResult, setImportSuccessResult] = useState<{ importedCount: number } | null>(null);

  // Template download trigger
  function handleDownloadTemplate(
    type: 'acc_csv' | 'acc_xlsx' | 'acc_json' | 'mi_csv' | 'mi_xlsx' | 'mi_json' | 'tax_csv' | 'tax_xlsx' | 'tax_json'
  ) {
    let content: any = '';
    let fileName = '';
    let mimeType = 'text/plain';

    if (type === 'acc_csv') {
      content = ACCOUNTING_CSV_TEMPLATE;
      fileName = 'accounting_structured_question_template.csv';
      mimeType = 'text/csv';
    } else if (type === 'acc_xlsx') {
      const arrayBuffer = generateXlsxFromCsv(ACCOUNTING_CSV_TEMPLATE);
      const blob = new Blob([arrayBuffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerBlobDownload(blob, 'accounting_structured_question_template.xlsx');
      return;
    } else if (type === 'acc_json') {
      content = JSON.stringify(ACCOUNTING_JSON_TEMPLATE, null, 2);
      fileName = 'accounting_structured_question_template.json';
      mimeType = 'application/json';
    } else if (type === 'mi_csv') {
      content = getScenarioCsvTemplate('Management Information');
      fileName = 'mi_scenario_template.csv';
      mimeType = 'text/csv';
    } else if (type === 'mi_xlsx') {
      const csv = getScenarioCsvTemplate('Management Information');
      const arrayBuffer = generateXlsxFromCsv(csv);
      const blob = new Blob([arrayBuffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerBlobDownload(blob, 'mi_scenario_template.xlsx');
      return;
    } else if (type === 'mi_json') {
      content = JSON.stringify(getScenarioJsonTemplate('Management Information'), null, 2);
      fileName = 'mi_scenario_template.json';
      mimeType = 'application/json';
    } else if (type === 'tax_csv') {
      content = getScenarioCsvTemplate('Taxation');
      fileName = 'taxation_scenario_template.csv';
      mimeType = 'text/csv';
    } else if (type === 'tax_xlsx') {
      const csv = getScenarioCsvTemplate('Taxation');
      const arrayBuffer = generateXlsxFromCsv(csv);
      const blob = new Blob([arrayBuffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerBlobDownload(blob, 'taxation_scenario_template.xlsx');
      return;
    } else if (type === 'tax_json') {
      content = JSON.stringify(getScenarioJsonTemplate('Taxation'), null, 2);
      fileName = 'taxation_scenario_template.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    triggerBlobDownload(blob, fileName);
  }

  function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setReport(null);
      setImportSuccessResult(null);
    }
  }

  // Trigger Validation
  async function handleValidate() {
    if (!selectedFile) {
      setError('Please select an XLSX, CSV, or JSON file to import.');
      return;
    }

    setValidating(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const res = await parseAndValidateSpecialImportAction(formData);
    setValidating(false);

    if (res.error) {
      setError(res.error);
    } else if (res.report) {
      setReport(res.report);
      if (res.report.validUnits.length > 0) setActiveTab('valid');
      else if (res.report.duplicateUnits.length > 0) setActiveTab('duplicate');
      else setActiveTab('invalid');
    }
  }

  // Execute Confirmed Atomic Import
  async function handleExecuteImport() {
    if (!report || report.validUnits.length === 0) return;

    setImporting(true);
    setError(null);

    const res = await executeConfirmedSpecialImportAction(
      report.validUnits,
      report.fileName,
      report.fileType,
      report.totalUnits,
      report.invalidUnits.length,
      report.duplicateUnits.length
    );

    setImporting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setImportSuccessResult({ importedCount: res.importedCount });
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/questions/special"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-red transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Special Questions Management
      </Link>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="brand">Bulk Importer</Badge>
          <span className="text-xs font-semibold text-gray-500">Atomic Multi-Row & Scenario Processing</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Bulk Import Special Questions
        </h1>
        <p className="text-xs text-gray-600 max-w-3xl leading-relaxed">
          Import Accounting 20-mark structured numerical calculation questions or Management Information / Taxation 15-mark scenarios (7 child tasks). Supports Excel (.xlsx), CSV, and JSON with automated validation, duplicate detection, and atomic insertion.
        </p>
      </div>

      {/* Download Templates Section */}
      <Card className="p-6 bg-white border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Download className="h-4 w-4 text-brand-red" />
              Download Standard Formatted Templates
            </h2>
            <p className="text-[11px] text-gray-500">
              Download clean pre-formatted templates with exact column headers and guidance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Accounting Templates */}
          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200 space-y-2.5">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-700" />
              Accounting Structured (20 Marks)
            </div>
            <p className="text-[11px] text-blue-800 leading-normal">
              Flat multi-row format grouped by Question ID with numerical answer fields.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('acc_xlsx')}
                className="h-7 text-[11px] bg-white text-blue-900 border-blue-300 hover:bg-blue-100"
              >
                XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('acc_csv')}
                className="h-7 text-[11px] bg-white text-blue-900 border-blue-300 hover:bg-blue-100"
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('acc_json')}
                className="h-7 text-[11px] bg-white text-blue-900 border-blue-300 hover:bg-blue-100"
              >
                JSON
              </Button>
            </div>
          </div>

          {/* MI Scenario Templates */}
          <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-700" />
              MI Scenario (15 Marks)
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              7-task narrative format grouped by Scenario ID (Task 1 = 3m, Tasks 2–7 = 2m).
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('mi_xlsx')}
                className="h-7 text-[11px] bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
              >
                XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('mi_csv')}
                className="h-7 text-[11px] bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('mi_json')}
                className="h-7 text-[11px] bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
              >
                JSON
              </Button>
            </div>
          </div>

          {/* Taxation Scenario Templates */}
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2.5">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-700" />
              Taxation Scenario (15 Marks)
            </div>
            <p className="text-[11px] text-emerald-800 leading-normal">
              7-task narrative format grouped by Scenario ID (Task 1 = 3m, Tasks 2–7 = 2m).
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('tax_xlsx')}
                className="h-7 text-[11px] bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              >
                XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('tax_csv')}
                className="h-7 text-[11px] bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate('tax_json')}
                className="h-7 text-[11px] bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              >
                JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Box */}
      <Card className="p-6 bg-white border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Upload className="h-4 w-4 text-brand-red" />
          Upload Special Question File
        </h2>

        <div className="border-2 border-dashed border-gray-300 hover:border-brand-red rounded-xl p-8 text-center bg-gray-50/50 transition-colors">
          <input
            type="file"
            id="special-file-upload"
            accept=".xlsx,.xls,.csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="special-file-upload" className="cursor-pointer space-y-3 block">
            <div className="h-12 w-12 rounded-full bg-red-50 text-brand-red flex items-center justify-center mx-auto border border-red-100">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-brand-red hover:underline">
                Click to select file
              </span>{' '}
              <span className="text-xs text-gray-600">or drag and drop</span>
              <p className="text-[11px] text-gray-400 mt-1">
                Supported: Excel (.xlsx), CSV (.csv), JSON (.json) • Maximum file size: 20 MB
              </p>
            </div>
            {selectedFile && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold mt-2">
                <Check className="h-3.5 w-3.5" />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Validation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleValidate}
            isLoading={validating}
            disabled={!selectedFile || validating}
            className="bg-brand-red hover:bg-brand-red-dark"
          >
            Preview & Validate File
          </Button>
        </div>
      </Card>

      {/* Validation Report & Preview */}
      {report && (
        <Card className="p-6 bg-white border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Validation Report: {report.fileName}
              </h2>
              <p className="text-xs text-gray-500">
                Detected Type: <strong className="capitalize">{report.detectedType.replace('_', ' ')}</strong> • Total Units: <strong>{report.totalUnits}</strong>
              </p>
            </div>

            {/* Metrics Pills */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                {report.validUnits.length} Valid
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {report.duplicateUnits.length} Duplicate
              </span>
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                {report.invalidUnits.length} Invalid
              </span>
            </div>
          </div>

          {/* Tabs for preview lists */}
          <div className="border-b border-gray-200 flex gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('valid')}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeTab === 'valid'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Valid Units ({report.validUnits.length})
            </button>
            <button
              onClick={() => setActiveTab('duplicate')}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeTab === 'duplicate'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Duplicate Units ({report.duplicateUnits.length})
            </button>
            <button
              onClick={() => setActiveTab('invalid')}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeTab === 'invalid'
                  ? 'border-red-600 text-red-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Invalid Units ({report.invalidUnits.length})
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {activeTab === 'valid' && (
              report.validUnits.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No valid units found in this upload.
                </div>
              ) : (
                report.validUnits.map((u, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-green-200 bg-green-50/40 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        [{u.unitId}] {u.title}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        Ready to Import ({u.totalMarks} Marks)
                      </Badge>
                    </div>
                    <div className="text-[11px] text-gray-600 flex items-center gap-4">
                      <span>Subject: <strong>{u.subjectName}</strong></span>
                      <span>Chapter: <strong>{u.chapterName}</strong></span>
                      <span>
                        {u.unitType === 'accounting_large'
                          ? `${u.fields?.length || 0} Structured Fields`
                          : `${u.tasks?.length || 0} Scenario Tasks`}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'duplicate' && (
              report.duplicateUnits.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No duplicate units detected.
                </div>
              ) : (
                report.duplicateUnits.map((u, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>[{u.unitId}] {u.title}</span>
                      <Badge variant="warning" className="text-[10px]">Duplicate</Badge>
                    </div>
                    <div className="text-[11px] text-amber-900">
                      {u.errors.map((e, eIdx) => (
                        <p key={eIdx}>• {e}</p>
                      ))}
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'invalid' && (
              report.invalidUnits.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No invalid units detected.
                </div>
              ) : (
                report.invalidUnits.map((u, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-red-200 bg-red-50/50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>[{u.unitId}] {u.title || 'Untitled Unit'} (Rows: {u.rowNumbers.join(', ')})</span>
                      <Badge variant="danger" className="text-[10px]">Invalid</Badge>
                    </div>
                    <div className="text-[11px] text-red-800 space-y-0.5">
                      {u.errors.map((e, eIdx) => (
                        <p key={eIdx}>• {e}</p>
                      ))}
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* Confirmed Import Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {report.validUnits.length > 0 ? (
                <span>
                  Ready to atomically insert <strong>{report.validUnits.length}</strong> valid special question unit(s). Invalid units will be skipped.
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  Cannot import: 0 valid units available. Fix the errors above and re-upload.
                </span>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleExecuteImport}
              isLoading={importing}
              disabled={report.validUnits.length === 0 || importing}
              className="bg-green-700 hover:bg-green-800 gap-2"
            >
              <Check className="h-4 w-4" />
              Confirm & Import ({report.validUnits.length}) Valid Units
            </Button>
          </div>
        </Card>
      )}

      {/* Success Modal / State */}
      {importSuccessResult && (
        <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center space-y-3 shadow-md">
          <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-green-900">
            Import Completed Successfully!
          </h3>
          <p className="text-xs text-green-800 max-w-md mx-auto">
            Successfully imported <strong>{importSuccessResult.importedCount}</strong> special question unit(s) into the authoritative question bank.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/admin/questions/special">
              <Button variant="primary" size="sm" className="bg-green-700 hover:bg-green-800">
                View in Special Question Bank →
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setReport(null);
                setImportSuccessResult(null);
              }}
            >
              Import Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

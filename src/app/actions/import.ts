'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface ValidatedImportRow {
  rowNumber: number;
  subjectName: string;
  subjectId?: string;
  chapterName: string;
  chapterId?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  status: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
}

export interface ValidationReport {
  fileName: string;
  fileType: 'xlsx' | 'csv' | 'json';
  totalRows: number;
  validRows: ValidatedImportRow[];
  duplicateRows: ValidatedImportRow[];
  invalidRows: ValidatedImportRow[];
  canImport: boolean;
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function parseAndValidateImportAction(formData: FormData): Promise<{ report?: ValidationReport; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file uploaded.' };

  // File size security guard (Max 20 MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File size exceeds the 20 MB limit. Please split the file into smaller batches.' };
  }

  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  if (!['xlsx', 'xls', 'csv', 'json'].includes(fileExt)) {
    return { error: 'Unsupported file format. Please upload an Excel (.xlsx), CSV, or JSON file.' };
  }

  const buffer = await file.arrayBuffer();
  let rawRows: any[] = [];

  try {
    if (fileExt === 'json') {
      const text = new TextDecoder().decode(buffer);
      rawRows = JSON.parse(text);
      if (!Array.isArray(rawRows)) {
        return { error: 'JSON content must be an array of question objects.' };
      }
    } else {
      const XLSX = await import('xlsx');
      const xlsxLib = XLSX.default || XLSX;
      const workbook = xlsxLib.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rawRows = xlsxLib.utils.sheet_to_json(sheet);
    }
  } catch (err: any) {
    return { error: `Failed to parse file: ${err.message}` };
  }

  if (rawRows.length === 0) {
    return { error: 'The uploaded file contains no data rows.' };
  }

  if (rawRows.length > 10000) {
    return { error: 'Uploaded file contains over 10,000 rows. Please split into batches of up to 10,000 questions.' };
  }

  // Fetch all existing subjects and chapters for validation
  const { data: subjects } = await adminClient.from('subjects').select('id, name, code, slug');
  const { data: chapters } = await adminClient.from('chapters').select('id, name, subject_id');

  const subjectMap = new Map<string, { id: string; name: string }>(); // lowercase name/code -> subject
  subjects?.forEach((s) => {
    subjectMap.set(s.name.toLowerCase().trim(), { id: s.id, name: s.name });
    subjectMap.set(s.code.toLowerCase().trim(), { id: s.id, name: s.name });
  });

  const chapterMap = new Map<string, string>(); // "subjectId:chapterNameLower" -> chapterId
  chapters?.forEach((c) => {
    chapterMap.set(`${c.subject_id}:${c.name.toLowerCase().trim()}`, c.id);
  });

  // Identify relevant subject IDs present in uploaded file to optimize duplicate checking
  const relevantSubjectIds = new Set<string>();
  rawRows.forEach((row) => {
    const sName = String(row['Subject'] || row['subject'] || '').trim().toLowerCase();
    const match = subjectMap.get(sName);
    if (match) relevantSubjectIds.add(match.id);
  });

  // Fetch existing questions with range-pagination to overcome PostgREST 1,000 row limit
  const dbQuestionSet = new Set<string>();
  if (relevantSubjectIds.size > 0) {
    const targetSubjectIds = Array.from(relevantSubjectIds);
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data: qBatch, error: qErr } = await adminClient
        .from('questions')
        .select('subject_id, chapter_id, question_text')
        .in('subject_id', targetSubjectIds)
        .range(from, to);

      if (qErr || !qBatch || qBatch.length === 0) {
        hasMore = false;
      } else {
        qBatch.forEach((q) => {
          const key = `${q.subject_id}:${q.chapter_id || 'none'}:${normalizeText(q.question_text)}`;
          dbQuestionSet.add(key);
        });
        if (qBatch.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }
  }

  const validRows: ValidatedImportRow[] = [];
  const duplicateRows: ValidatedImportRow[] = [];
  const invalidRows: ValidatedImportRow[] = [];

  // Track intra-file duplicates
  const fileSeenQuestions = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed plus header row
    const errors: string[] = [];

    // Extract columns with case-insensitive property lookup
    const subjectName = String(row['Subject'] || row['subject'] || '').trim();
    const chapterName = String(row['Chapter'] || row['chapter'] || '').trim();
    const questionText = String(row['Question'] || row['question'] || row['question_text'] || '').trim();
    const optionA = String(row['Option A'] || row['option_a'] || row['OptionA'] || '').trim();
    const optionB = String(row['Option B'] || row['option_b'] || row['OptionB'] || '').trim();
    const optionC = String(row['Option C'] || row['option_c'] || row['OptionC'] || '').trim();
    const optionD = String(row['Option D'] || row['option_d'] || row['OptionD'] || '').trim();
    const correctAnswerRaw = String(row['Correct Answer'] || row['correct_answer'] || row['CorrectAnswer'] || '').trim().toUpperCase();
    const explanation = String(row['Explanation'] || row['explanation'] || '').trim();
    const marksRaw = row['Marks'] || row['marks'] || 2;
    const marks = Number(marksRaw);

    // Mandatory Field Validations
    if (!subjectName) errors.push('Missing Subject.');
    if (!chapterName) errors.push('Missing Chapter.');
    if (!questionText) errors.push('Missing Question text.');
    if (!optionA) errors.push('Option A is empty.');
    if (!optionB) errors.push('Option B is empty.');
    if (!optionC) errors.push('Option C is empty.');
    if (!optionD) errors.push('Option D is empty.');

    if (!['A', 'B', 'C', 'D'].includes(correctAnswerRaw)) {
      errors.push(`Correct Answer must be A, B, C, or D (Found "${correctAnswerRaw}").`);
    }

    if (isNaN(marks) || marks <= 0) {
      errors.push(`Invalid Marks "${marksRaw}". Must be a valid positive number.`);
    }

    // DB Subject match
    const subjMatch = subjectName ? subjectMap.get(subjectName.toLowerCase()) : undefined;
    const subjectId = subjMatch?.id;
    if (subjectName && !subjectId) {
      errors.push(`Subject "${subjectName}" not found in database.`);
    }

    // DB Chapter match & relationship verification
    let chapterId: string | undefined = undefined;
    if (subjectId && chapterName) {
      chapterId = chapterMap.get(`${subjectId}:${chapterName.toLowerCase()}`);
      if (!chapterId) {
        errors.push(`Chapter "${chapterName}" does not belong to selected subject "${subjMatch?.name || subjectName}".`);
      }
    }

    let isDuplicate = false;
    if (errors.length === 0 && subjectId && questionText) {
      const normalizedQ = normalizeText(questionText);
      const questionKey = `${subjectId}:${chapterId || 'none'}:${normalizedQ}`;

      // Check intra-file duplicate
      if (fileSeenQuestions.has(questionKey)) {
        isDuplicate = true;
        errors.push('Duplicate question detected within the uploaded file.');
      } else {
        fileSeenQuestions.add(questionKey);
      }

      // Check database duplicate
      if (dbQuestionSet.has(questionKey)) {
        isDuplicate = true;
        errors.push('Duplicate question matching existing question in the database.');
      }
    }

    const validatedRow: ValidatedImportRow = {
      rowNumber: rowNum,
      subjectName,
      subjectId,
      chapterName,
      chapterId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: (['A', 'B', 'C', 'D'].includes(correctAnswerRaw) ? correctAnswerRaw : 'A') as 'A'|'B'|'C'|'D',
      explanation,
      marks: isNaN(marks) || marks <= 0 ? 2 : marks,
      status: errors.length === 0 ? 'valid' : isDuplicate ? 'duplicate' : 'invalid',
      errors,
    };

    if (validatedRow.status === 'valid') {
      validRows.push(validatedRow);
    } else if (validatedRow.status === 'duplicate') {
      duplicateRows.push(validatedRow);
    } else {
      invalidRows.push(validatedRow);
    }
  });

  return {
    report: {
      fileName,
      fileType: (fileExt === 'json' ? 'json' : fileExt === 'csv' ? 'csv' : 'xlsx') as any,
      totalRows: rawRows.length,
      validRows,
      duplicateRows,
      invalidRows,
      canImport: validRows.length > 0,
    },
  };
}

export async function executeConfirmedImportAction(
  rows: ValidatedImportRow[],
  fileName: string,
  fileType: 'xlsx' | 'csv' | 'json',
  totalRowsCount: number,
  invalidRowsCount: number,
  duplicateRowsCount: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  if (!rows || rows.length === 0) {
    return { error: 'No valid rows provided for import.' };
  }

  // Format payload for PostgreSQL RPC atomic function
  const batchPayload = rows.map((r) => ({
    subject_id: r.subjectId,
    chapter_id: r.chapterId || null,
    question_text: r.questionText,
    marks: r.marks,
    explanation: r.explanation || null,
    option_a: r.optionA,
    option_b: r.optionB,
    option_c: r.optionC,
    option_d: r.optionD,
    correct_answer: r.correctAnswer,
  }));

  try {
    // Atomic Import via Supabase RPC function `import_mcq_batch`
    const { data: rpcRes, error: rpcErr } = await adminClient.rpc('import_mcq_batch', {
      p_admin_id: user.id,
      p_file_name: fileName,
      p_file_type: fileType,
      p_total_rows: totalRowsCount,
      p_valid_rows: rows.length,
      p_invalid_rows: invalidRowsCount,
      p_duplicate_rows: duplicateRowsCount,
      p_rows: batchPayload,
    });

    if (rpcErr) {
      console.error('RPC import_mcq_batch failed:', rpcErr);
      // Record failure audit entry atomically
      await adminClient.from('bulk_imports').insert({
        admin_id: user.id,
        file_name: fileName,
        file_type: fileType,
        total_rows: totalRowsCount,
        valid_rows: rows.length,
        invalid_rows: invalidRowsCount,
        duplicate_rows: duplicateRowsCount,
        imported_rows: 0,
        status: 'failed',
        error_log: [{ error: rpcErr.message }],
      });
      revalidatePath('/admin/imports');
      return { error: `Database import transaction rolled back: ${rpcErr.message}` };
    }

    if (rpcRes?.success) {
      revalidatePath('/admin/questions');
      revalidatePath('/admin/imports');
      return {
        success: true,
        importedCount: rpcRes.imported_count || rows.length,
      };
    }

    return { error: 'Import failed with unknown database response.' };
  } catch (err: any) {
    console.error('Error invoking import_mcq_batch:', err);
    return { error: `Import failed: ${err.message || 'Unknown database error'}` };
  }
}

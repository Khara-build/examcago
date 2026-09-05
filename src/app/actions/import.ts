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

export async function parseAndValidateImportAction(formData: FormData): Promise<{ report?: ValidationReport; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file uploaded.' };

  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  if (!['xlsx', 'xls', 'csv', 'json'].includes(fileExt)) {
    return { error: 'Unsupported file format. Please upload an Excel (.xlsx), CSV, or JSON file.' };
  }

  // Fetch all existing subjects, chapters, and questions for validation & duplicate checking
  const { data: subjects } = await adminClient.from('subjects').select('id, name, code, slug');
  const { data: chapters } = await adminClient.from('chapters').select('id, name, subject_id');
  const { data: existingQuestions } = await adminClient.from('questions').select('id, subject_id, chapter_id, question_text');

  const subjectMap = new Map<string, { id: string; name: string }>(); // lowercase name/code -> subject
  subjects?.forEach((s) => {
    subjectMap.set(s.name.toLowerCase().trim(), { id: s.id, name: s.name });
    subjectMap.set(s.code.toLowerCase().trim(), { id: s.id, name: s.name });
  });

  const chapterMap = new Map<string, string>(); // "subjectId:chapterNameLower" -> chapterId
  chapters?.forEach((c) => {
    chapterMap.set(`${c.subject_id}:${c.name.toLowerCase().trim()}`, c.id);
  });

  // DB Question text lookup map for duplicate checking: "subjectId:chapterId:questionTextLower" -> true
  const dbQuestionSet = new Set<string>();
  existingQuestions?.forEach((q) => {
    const key = `${q.subject_id}:${q.chapter_id || 'none'}:${q.question_text.toLowerCase().trim()}`;
    dbQuestionSet.add(key);
  });

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
      const questionKey = `${subjectId}:${chapterId || 'none'}:${questionText.toLowerCase()}`;

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
    // Attempt Atomic Import via Supabase RPC function `import_mcq_batch`
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

    if (!rpcErr && rpcRes?.success) {
      revalidatePath('/admin/questions');
      revalidatePath('/admin/imports');
      return {
        success: true,
        importedCount: rpcRes.imported_count || rows.length,
      };
    }
  } catch (err) {
    // Fallback batch execution if RPC is not yet created in remote DB
  }

  // Fallback Batch Execution
  let importedCount = 0;
  const errorsLog: any[] = [];

  for (const row of rows) {
    try {
      const { data: qData, error: qErr } = await adminClient
        .from('questions')
        .insert({
          subject_id: row.subjectId,
          chapter_id: row.chapterId,
          question_text: row.questionText,
          question_type: 'mcq',
          marks: row.marks,
          explanation: row.explanation || null,
          is_active: true,
        })
        .select('id')
        .single();

      if (qErr || !qData) {
        errorsLog.push({ row: row.rowNumber, error: qErr?.message || 'Failed to insert question' });
        continue;
      }

      const options = [
        { question_id: qData.id, option_letter: 'A', option_text: row.optionA, is_correct: row.correctAnswer === 'A' },
        { question_id: qData.id, option_letter: 'B', option_text: row.optionB, is_correct: row.correctAnswer === 'B' },
        { question_id: qData.id, option_letter: 'C', option_text: row.optionC, is_correct: row.correctAnswer === 'C' },
        { question_id: qData.id, option_letter: 'D', option_text: row.optionD, is_correct: row.correctAnswer === 'D' },
      ];

      const { error: optErr } = await adminClient.from('question_options').insert(options);
      if (optErr) {
        await adminClient.from('questions').delete().eq('id', qData.id);
        errorsLog.push({ row: row.rowNumber, error: optErr.message });
        continue;
      }

      importedCount++;
    } catch (e: any) {
      errorsLog.push({ row: row.rowNumber, error: e.message });
    }
  }

  // Record Audit Entry
  await adminClient.from('bulk_imports').insert({
    admin_id: user.id,
    file_name: fileName,
    file_type: fileType,
    total_rows: totalRowsCount,
    valid_rows: rows.length,
    invalid_rows: invalidRowsCount,
    duplicate_rows: duplicateRowsCount,
    imported_rows: importedCount,
    status: importedCount > 0 ? 'completed' : 'failed',
    error_log: errorsLog,
  });

  revalidatePath('/admin/questions');
  revalidatePath('/admin/imports');

  return {
    success: true,
    importedCount,
    failedCount: errorsLog.length,
  };
}

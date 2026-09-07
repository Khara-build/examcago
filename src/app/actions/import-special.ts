'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { isExactNumericMatch } from '@/lib/exam/grading';

export interface ValidatedAccountingField {
  id: string;
  label: string;
  instruction?: string;
  correct_value: string | number;
  marks: number;
}

export interface ValidatedScenarioTask {
  task_number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  explanation?: string;
}

export interface ValidatedSpecialUnit {
  unitId: string; // Question ID or Scenario ID
  unitType: 'accounting_large' | 'scenario';
  subjectName: string;
  subjectId?: string;
  chapterName: string;
  chapterId?: string;
  title: string;
  prompt: string; // Question prompt or narrative
  supportingInformation?: string;
  totalMarks: number;
  status: 'active' | 'inactive';
  rowNumbers: number[];
  fields?: ValidatedAccountingField[];
  tasks?: ValidatedScenarioTask[];
  unitStatus: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
}

export interface SpecialValidationReport {
  fileName: string;
  fileType: 'xlsx' | 'csv' | 'json';
  detectedType: 'accounting_large' | 'scenario' | 'mixed';
  totalUnits: number;
  validUnits: ValidatedSpecialUnit[];
  duplicateUnits: ValidatedSpecialUnit[];
  invalidUnits: ValidatedSpecialUnit[];
  canImport: boolean;
}

// Canonical ICAB Subject Names (Strictly Enforced)
const CANONICAL_SUBJECTS = {
  ACCOUNTING: 'Accounting',
  MANAGEMENT_INFORMATION: 'Management Information',
  TAXATION: 'Taxation',
} as const;

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Validates whether a string or number represents a valid normalized numeric value without tolerance.
 */
function isValidNumericValue(val: any): boolean {
  if (val === undefined || val === null) return false;
  const clean = String(val).trim().replace(/,/g, '');
  if (clean === '') return false;
  const pattern = /^-?\d+(\.\d+)?$/;
  return pattern.test(clean) && !isNaN(Number(clean));
}

/**
 * Parse and validate Special Question upload (XLSX, CSV, JSON)
 */
export async function parseAndValidateSpecialImportAction(
  formData: FormData
): Promise<{ report?: SpecialValidationReport; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file uploaded.' };

  // File size check (Max 20 MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File size exceeds the 20 MB limit.' };
  }

  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  if (!['xlsx', 'xls', 'csv', 'json'].includes(fileExt)) {
    return { error: 'Unsupported file format. Please upload an Excel (.xlsx), CSV, or JSON file.' };
  }

  const buffer = await file.arrayBuffer();
  let rawContent: any = null;

  try {
    if (fileExt === 'json') {
      const text = new TextDecoder().decode(buffer);
      rawContent = JSON.parse(text);
    } else {
      const XLSX = await import('xlsx');
      const xlsxLib = XLSX.default || XLSX;
      const workbook = xlsxLib.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rawContent = xlsxLib.utils.sheet_to_json(sheet);
    }
  } catch (err: any) {
    return { error: `Failed to parse file: ${err.message}` };
  }

  if (!rawContent || (Array.isArray(rawContent) && rawContent.length === 0)) {
    return { error: 'The uploaded file contains no data.' };
  }

  // Fetch canonical database subjects and chapters
  const { data: dbSubjects } = await adminClient.from('subjects').select('id, name, code, slug');
  const { data: dbChapters } = await adminClient.from('chapters').select('id, name, subject_id');

  const subjectMap = new Map<string, { id: string; name: string }>();
  dbSubjects?.forEach((s) => {
    // Only map exact canonical names
    subjectMap.set(s.name.trim(), { id: s.id, name: s.name });
  });

  const chapterMap = new Map<string, string>(); // "subjectId:chapterNameLower" -> chapterId
  dbChapters?.forEach((c) => {
    chapterMap.set(`${c.subject_id}:${c.name.toLowerCase().trim()}`, c.id);
  });

  // Query existing database special questions to detect duplicates
  const { data: existingQuestions } = await adminClient
    .from('questions')
    .select('id, subject_id, chapter_id, question_text, question_type')
    .in('question_type', ['large', 'scenario']);

  const { data: existingLarge } = await adminClient.from('large_questions').select('question_id, case_title, case_text');
  const { data: existingScenarios } = await adminClient.from('scenario_questions').select('question_id, scenario_title, scenario_text');

  const dbLargeSet = new Set<string>();
  existingLarge?.forEach((l) => {
    dbLargeSet.add(normalizeText(l.case_title));
  });

  const dbScenarioSet = new Set<string>();
  existingScenarios?.forEach((s) => {
    dbScenarioSet.add(normalizeText(s.scenario_title));
  });

  const validUnits: ValidatedSpecialUnit[] = [];
  const duplicateUnits: ValidatedSpecialUnit[] = [];
  const invalidUnits: ValidatedSpecialUnit[] = [];

  const seenUnitIdsInFile = new Set<string>();
  const seenTitlesInFile = new Set<string>();

  // Differentiate between JSON structured import vs flat CSV/XLSX rows
  if (fileExt === 'json') {
    const jsonItems = Array.isArray(rawContent) ? rawContent : [rawContent];

    jsonItems.forEach((item, index) => {
      const rowNum = index + 1;
      const type = item.type || (item.tasks ? 'scenario' : 'accounting_large');

      if (type === 'accounting_large' || item.fields) {
        validateAccountingJsonUnit(
          item,
          rowNum,
          subjectMap,
          chapterMap,
          dbLargeSet,
          seenUnitIdsInFile,
          seenTitlesInFile,
          validUnits,
          duplicateUnits,
          invalidUnits
        );
      } else {
        validateScenarioJsonUnit(
          item,
          rowNum,
          subjectMap,
          chapterMap,
          dbScenarioSet,
          seenUnitIdsInFile,
          seenTitlesInFile,
          validUnits,
          duplicateUnits,
          invalidUnits
        );
      }
    });
  } else {
    // Flat CSV / XLSX rows grouped by Question ID or Scenario ID
    const rawRows = rawContent as any[];
    if (rawRows.length > 5000) {
      return { error: 'Uploaded file contains over 5,000 rows. Please split into smaller batches.' };
    }

    // Inspect first row to detect format
    const firstRow = rawRows[0] || {};
    const isScenarioFormat =
      'Scenario ID' in firstRow ||
      'scenario_id' in firstRow ||
      'Task Number' in firstRow ||
      'task_number' in firstRow;

    if (isScenarioFormat) {
      groupAndValidateScenarioRows(
        rawRows,
        subjectMap,
        chapterMap,
        dbScenarioSet,
        seenUnitIdsInFile,
        seenTitlesInFile,
        validUnits,
        duplicateUnits,
        invalidUnits
      );
    } else {
      groupAndValidateAccountingRows(
        rawRows,
        subjectMap,
        chapterMap,
        dbLargeSet,
        seenUnitIdsInFile,
        seenTitlesInFile,
        validUnits,
        duplicateUnits,
        invalidUnits
      );
    }
  }

  const detectedType =
    validUnits.length > 0
      ? validUnits[0].unitType
      : invalidUnits.length > 0
      ? invalidUnits[0].unitType
      : 'accounting_large';

  return {
    report: {
      fileName,
      fileType: fileExt as any,
      detectedType,
      totalUnits: validUnits.length + duplicateUnits.length + invalidUnits.length,
      validUnits,
      duplicateUnits,
      invalidUnits,
      canImport: validUnits.length > 0,
    },
  };
}

/**
 * Validates Accounting flat rows grouped by Question ID
 */
function groupAndValidateAccountingRows(
  rows: any[],
  subjectMap: Map<string, { id: string; name: string }>,
  chapterMap: Map<string, string>,
  dbLargeSet: Set<string>,
  seenUnitIdsInFile: Set<string>,
  seenTitlesInFile: Set<string>,
  validUnits: ValidatedSpecialUnit[],
  duplicateUnits: ValidatedSpecialUnit[],
  invalidUnits: ValidatedSpecialUnit[]
) {
  // Group rows by Question ID
  const groups = new Map<string, { rows: any[]; rowIndices: number[] }>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1
    const rawQId = String(row['Question ID'] || row['question_id'] || row['QuestionId'] || '').trim();
    const qId = rawQId || `AUTOGEN-ROW-${rowNum}`;
    if (!groups.has(qId)) {
      groups.set(qId, { rows: [], rowIndices: [] });
    }
    groups.get(qId)!.rows.push(row);
    groups.get(qId)!.rowIndices.push(rowNum);
  });

  groups.forEach((group, qId) => {
    const errors: string[] = [];
    const firstRow = group.rows[0];
    const rowNumbers = group.rowIndices;

    // Check placeholder / template rejection
    const rawSubject = String(firstRow['Subject'] || firstRow['subject'] || '').trim();
    const rawChapter = String(firstRow['Chapter'] || firstRow['chapter'] || '').trim();

    if (rawChapter.includes('[Replace with') || rawChapter.includes('[Enter Chapter') || qId.includes('EXAMPLE')) {
      errors.push('Template placeholder row detected. Please replace example guidance with real question data.');
    }

    // Canonical Subject Check: Strictly "Accounting"
    if (rawSubject !== CANONICAL_SUBJECTS.ACCOUNTING) {
      errors.push(
        `Subject must be exactly canonical "${CANONICAL_SUBJECTS.ACCOUNTING}". Found "${rawSubject || 'Empty'}". Abbreviations like ACC are not accepted.`
      );
    }

    const subjMatch = subjectMap.get(CANONICAL_SUBJECTS.ACCOUNTING);
    const subjectId = subjMatch?.id;
    if (!subjectId) {
      errors.push(`Subject "${CANONICAL_SUBJECTS.ACCOUNTING}" not found in database.`);
    }

    // Chapter validation
    let chapterId: string | undefined = undefined;
    if (subjectId && rawChapter) {
      chapterId = chapterMap.get(`${subjectId}:${rawChapter.toLowerCase()}`);
      if (!chapterId) {
        errors.push(`Chapter "${rawChapter}" does not exist under subject "${CANONICAL_SUBJECTS.ACCOUNTING}".`);
      }
    } else if (!rawChapter) {
      errors.push('Missing Chapter.');
    }

    const title = String(firstRow['Title'] || firstRow['title'] || firstRow['Case Title'] || '').trim();
    const questionPrompt = String(firstRow['Question'] || firstRow['question'] || firstRow['Question Text'] || '').trim();
    const supportingInfo = String(firstRow['Supporting Information'] || firstRow['supporting_information'] || firstRow['Case Text'] || '').trim();

    if (!title) errors.push('Missing Title.');
    if (!questionPrompt) errors.push('Missing Question prompt.');

    // Process fields
    const fields: ValidatedAccountingField[] = [];
    const fieldIdSet = new Set<string>();
    let totalMarksCalculated = 0;

    group.rows.forEach((r, rIdx) => {
      const fieldRowNum = rowNumbers[rIdx];
      const fieldId = String(r['Field ID'] || r['field_id'] || r['FieldId'] || '').trim();
      const fieldLabel = String(r['Field Label'] || r['field_label'] || r['FieldLabel'] || '').trim();
      const fieldInstruction = String(r['Field Instruction'] || r['field_instruction'] || r['Hint'] || '').trim();
      const correctValRaw = r['Correct Value'] !== undefined ? r['Correct Value'] : r['correct_value'];
      const fieldMarksRaw = r['Field Marks'] !== undefined ? r['Field Marks'] : r['field_marks'] || r['Marks'];

      if (!fieldId) {
        errors.push(`Row ${fieldRowNum}: Missing Field ID.`);
      } else if (fieldIdSet.has(fieldId.toLowerCase())) {
        errors.push(`Row ${fieldRowNum}: Duplicate Field ID "${fieldId}" inside Question "${qId}".`);
      } else {
        fieldIdSet.add(fieldId.toLowerCase());
      }

      if (!fieldLabel) errors.push(`Row ${fieldRowNum}: Missing Field Label.`);

      if (correctValRaw === undefined || correctValRaw === null || String(correctValRaw).trim() === '') {
        errors.push(`Row ${fieldRowNum}: Missing Correct Value for field "${fieldLabel || fieldId}".`);
      } else if (!isValidNumericValue(correctValRaw)) {
        errors.push(`Row ${fieldRowNum}: Correct Value "${correctValRaw}" must be a valid numerical value.`);
      }

      const fMarks = Number(fieldMarksRaw);
      if (isNaN(fMarks) || fMarks <= 0) {
        errors.push(`Row ${fieldRowNum}: Invalid Field Marks "${fieldMarksRaw}". Must be a positive number.`);
      } else {
        totalMarksCalculated += fMarks;
      }

      fields.push({
        id: fieldId,
        label: fieldLabel,
        instruction: fieldInstruction || undefined,
        correct_value: String(correctValRaw).trim(),
        marks: isNaN(fMarks) ? 0 : fMarks,
      });
    });

    // Total Marks check: Must equal exactly 20
    if (totalMarksCalculated !== 20) {
      errors.push(`Total marks across all fields must equal exactly 20. Current sum is ${totalMarksCalculated}.`);
    }

    const rawStatus = String(firstRow['Status'] || firstRow['status'] || 'active').trim().toLowerCase();
    const status = rawStatus === 'inactive' ? 'inactive' : 'active';

    // Duplicate checks
    let isDuplicate = false;
    if (errors.length === 0) {
      if (seenUnitIdsInFile.has(qId.toLowerCase())) {
        isDuplicate = true;
        errors.push(`Duplicate Question ID "${qId}" detected in the uploaded file.`);
      } else {
        seenUnitIdsInFile.add(qId.toLowerCase());
      }

      const normTitle = normalizeText(title);
      if (seenTitlesInFile.has(normTitle)) {
        isDuplicate = true;
        errors.push(`Question with title "${title}" appears multiple times in file.`);
      } else {
        seenTitlesInFile.add(normTitle);
      }

      if (dbLargeSet.has(normTitle)) {
        isDuplicate = true;
        errors.push(`Question with title "${title}" matches an existing Accounting question in database.`);
      }
    }

    const unit: ValidatedSpecialUnit = {
      unitId: qId,
      unitType: 'accounting_large',
      subjectName: CANONICAL_SUBJECTS.ACCOUNTING,
      subjectId,
      chapterName: rawChapter,
      chapterId,
      title,
      prompt: questionPrompt,
      supportingInformation: supportingInfo,
      totalMarks: totalMarksCalculated,
      status,
      rowNumbers,
      fields,
      unitStatus: errors.length === 0 ? 'valid' : isDuplicate ? 'duplicate' : 'invalid',
      errors,
    };

    if (unit.unitStatus === 'valid') validUnits.push(unit);
    else if (unit.unitStatus === 'duplicate') duplicateUnits.push(unit);
    else invalidUnits.push(unit);
  });
}

/**
 * Validates MI / Taxation flat rows grouped by Scenario ID
 */
function groupAndValidateScenarioRows(
  rows: any[],
  subjectMap: Map<string, { id: string; name: string }>,
  chapterMap: Map<string, string>,
  dbScenarioSet: Set<string>,
  seenUnitIdsInFile: Set<string>,
  seenTitlesInFile: Set<string>,
  validUnits: ValidatedSpecialUnit[],
  duplicateUnits: ValidatedSpecialUnit[],
  invalidUnits: ValidatedSpecialUnit[]
) {
  const groups = new Map<string, { rows: any[]; rowIndices: number[] }>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rawSId = String(row['Scenario ID'] || row['scenario_id'] || row['ScenarioId'] || '').trim();
    const sId = rawSId || `AUTOGEN-SCEN-${rowNum}`;
    if (!groups.has(sId)) {
      groups.set(sId, { rows: [], rowIndices: [] });
    }
    groups.get(sId)!.rows.push(row);
    groups.get(sId)!.rowIndices.push(rowNum);
  });

  groups.forEach((group, sId) => {
    const errors: string[] = [];
    const firstRow = group.rows[0];
    const rowNumbers = group.rowIndices;

    const rawSubject = String(firstRow['Subject'] || firstRow['subject'] || '').trim();
    const rawChapter = String(firstRow['Chapter'] || firstRow['chapter'] || '').trim();

    if (rawChapter.includes('[Replace with') || rawChapter.includes('[Enter Chapter') || sId.includes('EXAMPLE')) {
      errors.push('Template placeholder row detected. Please replace example guidance with real scenario data.');
    }

    // Canonical Subject Check: Strictly "Management Information" or "Taxation"
    if (
      rawSubject !== CANONICAL_SUBJECTS.MANAGEMENT_INFORMATION &&
      rawSubject !== CANONICAL_SUBJECTS.TAXATION
    ) {
      errors.push(
        `Subject must be exactly canonical "${CANONICAL_SUBJECTS.MANAGEMENT_INFORMATION}" or "${CANONICAL_SUBJECTS.TAXATION}". Found "${rawSubject || 'Empty'}". Abbreviations like MI or TAX are not accepted.`
      );
    }

    const subjMatch = subjectMap.get(rawSubject);
    const subjectId = subjMatch?.id;
    if (!subjectId) {
      errors.push(`Subject "${rawSubject}" not found in database.`);
    }

    let chapterId: string | undefined = undefined;
    if (subjectId && rawChapter) {
      chapterId = chapterMap.get(`${subjectId}:${rawChapter.toLowerCase()}`);
      if (!chapterId) {
        errors.push(`Chapter "${rawChapter}" does not exist under subject "${rawSubject}".`);
      }
    } else if (!rawChapter) {
      errors.push('Missing Chapter.');
    }

    const title = String(firstRow['Scenario Title'] || firstRow['scenario_title'] || firstRow['Title'] || '').trim();
    const narrative = String(
      firstRow['Scenario Narrative'] ||
      firstRow['scenario_narrative'] ||
      firstRow['Narrative'] ||
      firstRow['Scenario Text'] ||
      ''
    ).trim();

    if (!title) errors.push('Missing Scenario Title.');
    if (!narrative) errors.push('Missing Scenario Narrative.');

    // Exactly 7 child tasks required
    if (group.rows.length !== 7) {
      errors.push(`Scenario must contain exactly 7 child tasks. Found ${group.rows.length} rows.`);
    }

    const tasks: ValidatedScenarioTask[] = [];
    const taskNumSet = new Set<number>();
    let totalMarks = 0;

    group.rows.forEach((r, rIdx) => {
      const taskRowNum = rowNumbers[rIdx];
      const taskNumRaw = r['Task Number'] !== undefined ? r['Task Number'] : r['task_number'] || r['TaskNumber'];
      const taskNum = Number(taskNumRaw);

      if (isNaN(taskNum) || taskNum < 1 || taskNum > 7) {
        errors.push(`Row ${taskRowNum}: Task Number must be between 1 and 7. Found "${taskNumRaw}".`);
      } else if (taskNumSet.has(taskNum)) {
        errors.push(`Row ${taskRowNum}: Duplicate Task Number ${taskNum} inside Scenario "${sId}".`);
      } else {
        taskNumSet.add(taskNum);
      }

      const qText = String(r['Task Question'] || r['task_question'] || r['Question'] || '').trim();
      const optA = String(r['Option A'] || r['option_a'] || '').trim();
      const optB = String(r['Option B'] || r['option_b'] || '').trim();
      const optC = String(r['Option C'] || r['option_c'] || '').trim();
      const optD = String(r['Option D'] || r['option_d'] || '').trim();
      const correctAns = String(r['Correct Answer'] || r['correct_answer'] || '').trim().toUpperCase();
      const marksRaw = r['Marks'] !== undefined ? r['Marks'] : r['marks'];
      const marks = Number(marksRaw);
      const explanation = String(r['Explanation'] || r['explanation'] || '').trim();

      if (!qText) errors.push(`Row ${taskRowNum}: Missing Task Question.`);
      if (!optA) errors.push(`Row ${taskRowNum}: Option A is empty.`);
      if (!optB) errors.push(`Row ${taskRowNum}: Option B is empty.`);
      if (!optC) errors.push(`Row ${taskRowNum}: Option C is empty.`);
      if (!optD) errors.push(`Row ${taskRowNum}: Option D is empty.`);

      if (!['A', 'B', 'C', 'D'].includes(correctAns)) {
        errors.push(`Row ${taskRowNum}: Correct Answer must be A, B, C, or D. Found "${correctAns}".`);
      }

      // Task 1 = 3 marks, Tasks 2-7 = 2 marks
      if (taskNum === 1 && marks !== 3) {
        errors.push(`Row ${taskRowNum}: Task 1 must have exactly 3 marks. Found "${marksRaw}".`);
      } else if (taskNum >= 2 && taskNum <= 7 && marks !== 2) {
        errors.push(`Row ${taskRowNum}: Task ${taskNum} must have exactly 2 marks. Found "${marksRaw}".`);
      }

      totalMarks += isNaN(marks) ? 0 : marks;

      tasks.push({
        task_number: taskNum || (rIdx + 1),
        question: qText,
        options: { A: optA, B: optB, C: optC, D: optD },
        correct_answer: (['A', 'B', 'C', 'D'].includes(correctAns) ? correctAns : 'A') as 'A' | 'B' | 'C' | 'D',
        marks: isNaN(marks) ? 2 : marks,
        explanation: explanation || undefined,
      });
    });

    if (totalMarks !== 15) {
      errors.push(`Total scenario marks must equal exactly 15 (Task 1 = 3m, Tasks 2–7 = 2m each). Found ${totalMarks}.`);
    }

    // Sort tasks by task_number
    tasks.sort((a, b) => a.task_number - b.task_number);

    const rawStatus = String(firstRow['Status'] || firstRow['status'] || 'active').trim().toLowerCase();
    const status = rawStatus === 'inactive' ? 'inactive' : 'active';

    let isDuplicate = false;
    if (errors.length === 0) {
      if (seenUnitIdsInFile.has(sId.toLowerCase())) {
        isDuplicate = true;
        errors.push(`Duplicate Scenario ID "${sId}" detected in the uploaded file.`);
      } else {
        seenUnitIdsInFile.add(sId.toLowerCase());
      }

      const normTitle = normalizeText(title);
      if (seenTitlesInFile.has(normTitle)) {
        isDuplicate = true;
        errors.push(`Scenario with title "${title}" appears multiple times in file.`);
      } else {
        seenTitlesInFile.add(normTitle);
      }

      if (dbScenarioSet.has(normTitle)) {
        isDuplicate = true;
        errors.push(`Scenario with title "${title}" matches an existing scenario in database.`);
      }
    }

    const unit: ValidatedSpecialUnit = {
      unitId: sId,
      unitType: 'scenario',
      subjectName: rawSubject,
      subjectId,
      chapterName: rawChapter,
      chapterId,
      title,
      prompt: title,
      supportingInformation: narrative,
      totalMarks: 15,
      status,
      rowNumbers,
      tasks,
      unitStatus: errors.length === 0 ? 'valid' : isDuplicate ? 'duplicate' : 'invalid',
      errors,
    };

    if (unit.unitStatus === 'valid') validUnits.push(unit);
    else if (unit.unitStatus === 'duplicate') duplicateUnits.push(unit);
    else invalidUnits.push(unit);
  });
}

/**
 * Validates a single Accounting Large JSON object
 */
function validateAccountingJsonUnit(
  item: any,
  rowNum: number,
  subjectMap: Map<string, { id: string; name: string }>,
  chapterMap: Map<string, string>,
  dbLargeSet: Set<string>,
  seenUnitIdsInFile: Set<string>,
  seenTitlesInFile: Set<string>,
  validUnits: ValidatedSpecialUnit[],
  duplicateUnits: ValidatedSpecialUnit[],
  invalidUnits: ValidatedSpecialUnit[]
) {
  const errors: string[] = [];
  const qId = String(item.question_id || item.id || `JSON-ACC-${rowNum}`).trim();

  const rawSubject = String(item.subject || '').trim();
  const rawChapter = String(item.chapter || '').trim();

  if (rawChapter.includes('[Replace with') || qId.includes('EXAMPLE')) {
    errors.push('Template placeholder detected. Please replace example guidance with real question data.');
  }

  if (rawSubject !== CANONICAL_SUBJECTS.ACCOUNTING) {
    errors.push(`Subject must be exactly canonical "${CANONICAL_SUBJECTS.ACCOUNTING}". Found "${rawSubject || 'Empty'}".`);
  }

  const subjMatch = subjectMap.get(CANONICAL_SUBJECTS.ACCOUNTING);
  const subjectId = subjMatch?.id;

  let chapterId: string | undefined = undefined;
  if (subjectId && rawChapter) {
    chapterId = chapterMap.get(`${subjectId}:${rawChapter.toLowerCase()}`);
    if (!chapterId) {
      errors.push(`Chapter "${rawChapter}" does not exist under subject "${CANONICAL_SUBJECTS.ACCOUNTING}".`);
    }
  } else if (!rawChapter) {
    errors.push('Missing Chapter.');
  }

  const title = String(item.title || item.case_title || '').trim();
  const prompt = String(item.question || item.question_text || '').trim();
  const supportingInfo = String(item.supporting_information || item.case_text || '').trim();

  if (!title) errors.push('Missing Title.');
  if (!prompt) errors.push('Missing Question prompt.');

  if (!Array.isArray(item.fields) || item.fields.length === 0) {
    errors.push('Accounting structured question must contain an array of answer fields.');
  }

  const fields: ValidatedAccountingField[] = [];
  const fieldIdSet = new Set<string>();
  let totalMarksCalculated = 0;

  (item.fields || []).forEach((f: any, fIdx: number) => {
    const fId = String(f.id || '').trim();
    const fLabel = String(f.label || '').trim();
    const fInst = String(f.instruction || f.hint || '').trim();
    const correctValRaw = f.correct_value;
    const fMarks = Number(f.marks);

    if (!fId) errors.push(`Field ${fIdx + 1}: Missing Field ID.`);
    else if (fieldIdSet.has(fId.toLowerCase())) {
      errors.push(`Field ${fIdx + 1}: Duplicate Field ID "${fId}".`);
    } else {
      fieldIdSet.add(fId.toLowerCase());
    }

    if (!fLabel) errors.push(`Field ${fIdx + 1}: Missing Field Label.`);

    if (correctValRaw === undefined || correctValRaw === null || String(correctValRaw).trim() === '') {
      errors.push(`Field ${fIdx + 1}: Missing Correct Value.`);
    } else if (!isValidNumericValue(correctValRaw)) {
      errors.push(`Field ${fIdx + 1}: Correct Value "${correctValRaw}" must be a valid numerical value.`);
    }

    if (isNaN(fMarks) || fMarks <= 0) {
      errors.push(`Field ${fIdx + 1}: Invalid Marks "${f.marks}".`);
    } else {
      totalMarksCalculated += fMarks;
    }

    fields.push({
      id: fId,
      label: fLabel,
      instruction: fInst || undefined,
      correct_value: String(correctValRaw).trim(),
      marks: isNaN(fMarks) ? 0 : fMarks,
    });
  });

  if (totalMarksCalculated !== 20) {
    errors.push(`Total marks across all fields must equal exactly 20. Current sum is ${totalMarksCalculated}.`);
  }

  const status = item.status === 'inactive' ? 'inactive' : 'active';

  let isDuplicate = false;
  if (errors.length === 0) {
    if (seenUnitIdsInFile.has(qId.toLowerCase())) {
      isDuplicate = true;
      errors.push(`Duplicate Question ID "${qId}" detected.`);
    } else {
      seenUnitIdsInFile.add(qId.toLowerCase());
    }

    const normTitle = normalizeText(title);
    if (seenTitlesInFile.has(normTitle)) {
      isDuplicate = true;
      errors.push(`Question title "${title}" appears multiple times in file.`);
    } else {
      seenTitlesInFile.add(normTitle);
    }

    if (dbLargeSet.has(normTitle)) {
      isDuplicate = true;
      errors.push(`Question title "${title}" matches an existing Accounting question in database.`);
    }
  }

  const unit: ValidatedSpecialUnit = {
    unitId: qId,
    unitType: 'accounting_large',
    subjectName: CANONICAL_SUBJECTS.ACCOUNTING,
    subjectId,
    chapterName: rawChapter,
    chapterId,
    title,
    prompt,
    supportingInformation: supportingInfo,
    totalMarks: 20,
    status,
    rowNumbers: [rowNum],
    fields,
    unitStatus: errors.length === 0 ? 'valid' : isDuplicate ? 'duplicate' : 'invalid',
    errors,
  };

  if (unit.unitStatus === 'valid') validUnits.push(unit);
  else if (unit.unitStatus === 'duplicate') duplicateUnits.push(unit);
  else invalidUnits.push(unit);
}

/**
 * Validates a single MI / Taxation Scenario JSON object
 */
function validateScenarioJsonUnit(
  item: any,
  rowNum: number,
  subjectMap: Map<string, { id: string; name: string }>,
  chapterMap: Map<string, string>,
  dbScenarioSet: Set<string>,
  seenUnitIdsInFile: Set<string>,
  seenTitlesInFile: Set<string>,
  validUnits: ValidatedSpecialUnit[],
  duplicateUnits: ValidatedSpecialUnit[],
  invalidUnits: ValidatedSpecialUnit[]
) {
  const errors: string[] = [];
  const sId = String(item.scenario_id || item.id || `JSON-SCEN-${rowNum}`).trim();

  const rawSubject = String(item.subject || '').trim();
  const rawChapter = String(item.chapter || '').trim();

  if (rawChapter.includes('[Replace with') || sId.includes('EXAMPLE')) {
    errors.push('Template placeholder detected. Please replace example guidance with real scenario data.');
  }

  if (
    rawSubject !== CANONICAL_SUBJECTS.MANAGEMENT_INFORMATION &&
    rawSubject !== CANONICAL_SUBJECTS.TAXATION
  ) {
    errors.push(
      `Subject must be exactly canonical "${CANONICAL_SUBJECTS.MANAGEMENT_INFORMATION}" or "${CANONICAL_SUBJECTS.TAXATION}". Found "${rawSubject || 'Empty'}".`
    );
  }

  const subjMatch = subjectMap.get(rawSubject);
  const subjectId = subjMatch?.id;

  let chapterId: string | undefined = undefined;
  if (subjectId && rawChapter) {
    chapterId = chapterMap.get(`${subjectId}:${rawChapter.toLowerCase()}`);
    if (!chapterId) {
      errors.push(`Chapter "${rawChapter}" does not exist under subject "${rawSubject}".`);
    }
  } else if (!rawChapter) {
    errors.push('Missing Chapter.');
  }

  const title = String(item.title || item.scenario_title || '').trim();
  const narrative = String(item.narrative || item.scenario_text || item.supporting_information || '').trim();

  if (!title) errors.push('Missing Scenario Title.');
  if (!narrative) errors.push('Missing Scenario Narrative.');

  if (!Array.isArray(item.tasks) || item.tasks.length !== 7) {
    errors.push(`Scenario must contain exactly 7 tasks. Found ${item.tasks?.length || 0}.`);
  }

  const tasks: ValidatedScenarioTask[] = [];
  const taskNumSet = new Set<number>();
  let totalMarks = 0;

  (item.tasks || []).forEach((t: any, tIdx: number) => {
    const taskNum = Number(t.task_number || tIdx + 1);
    if (isNaN(taskNum) || taskNum < 1 || taskNum > 7) {
      errors.push(`Task ${tIdx + 1}: Task Number must be between 1 and 7.`);
    } else if (taskNumSet.has(taskNum)) {
      errors.push(`Task ${tIdx + 1}: Duplicate Task Number ${taskNum}.`);
    } else {
      taskNumSet.add(taskNum);
    }

    const qText = String(t.question || '').trim();
    const optObj = t.options || {};
    const optA = String(optObj.A || t.option_a || '').trim();
    const optB = String(optObj.B || t.option_b || '').trim();
    const optC = String(optObj.C || t.option_c || '').trim();
    const optD = String(optObj.D || t.option_d || '').trim();
    const correctAns = String(t.correct_answer || '').trim().toUpperCase();
    const marks = Number(t.marks);

    if (!qText) errors.push(`Task ${tIdx + 1}: Missing Question.`);
    if (!optA) errors.push(`Task ${tIdx + 1}: Missing Option A.`);
    if (!optB) errors.push(`Task ${tIdx + 1}: Missing Option B.`);
    if (!optC) errors.push(`Task ${tIdx + 1}: Missing Option C.`);
    if (!optD) errors.push(`Task ${tIdx + 1}: Missing Option D.`);

    if (!['A', 'B', 'C', 'D'].includes(correctAns)) {
      errors.push(`Task ${tIdx + 1}: Correct Answer must be A, B, C, or D.`);
    }

    if (taskNum === 1 && marks !== 3) {
      errors.push(`Task 1 must have exactly 3 marks. Found "${t.marks}".`);
    } else if (taskNum >= 2 && taskNum <= 7 && marks !== 2) {
      errors.push(`Task ${taskNum} must have exactly 2 marks. Found "${t.marks}".`);
    }

    totalMarks += isNaN(marks) ? 0 : marks;

    tasks.push({
      task_number: taskNum,
      question: qText,
      options: { A: optA, B: optB, C: optC, D: optD },
      correct_answer: (['A', 'B', 'C', 'D'].includes(correctAns) ? correctAns : 'A') as 'A' | 'B' | 'C' | 'D',
      marks: isNaN(marks) ? 2 : marks,
      explanation: t.explanation ? String(t.explanation).trim() : undefined,
    });
  });

  if (totalMarks !== 15) {
    errors.push(`Total scenario marks must equal exactly 15. Found ${totalMarks}.`);
  }

  tasks.sort((a, b) => a.task_number - b.task_number);

  const status = item.status === 'inactive' ? 'inactive' : 'active';

  let isDuplicate = false;
  if (errors.length === 0) {
    if (seenUnitIdsInFile.has(sId.toLowerCase())) {
      isDuplicate = true;
      errors.push(`Duplicate Scenario ID "${sId}" detected.`);
    } else {
      seenUnitIdsInFile.add(sId.toLowerCase());
    }

    const normTitle = normalizeText(title);
    if (seenTitlesInFile.has(normTitle)) {
      isDuplicate = true;
      errors.push(`Scenario title "${title}" appears multiple times in file.`);
    } else {
      seenTitlesInFile.add(normTitle);
    }

    if (dbScenarioSet.has(normTitle)) {
      isDuplicate = true;
      errors.push(`Scenario title "${title}" matches an existing scenario in database.`);
    }
  }

  const unit: ValidatedSpecialUnit = {
    unitId: sId,
    unitType: 'scenario',
    subjectName: rawSubject,
    subjectId,
    chapterName: rawChapter,
    chapterId,
    title,
    prompt: title,
    supportingInformation: narrative,
    totalMarks: 15,
    status,
    rowNumbers: [rowNum],
    tasks,
    unitStatus: errors.length === 0 ? 'valid' : isDuplicate ? 'duplicate' : 'invalid',
    errors,
  };

  if (unit.unitStatus === 'valid') validUnits.push(unit);
  else if (unit.unitStatus === 'duplicate') duplicateUnits.push(unit);
  else invalidUnits.push(unit);
}

/**
 * Executes atomic server-side import of confirmed valid Special Question units.
 * Never partially inserts an incomplete or invalid question.
 */
export async function executeConfirmedSpecialImportAction(
  units: ValidatedSpecialUnit[],
  fileName: string,
  fileType: 'xlsx' | 'csv' | 'json',
  totalUnitsCount: number,
  invalidUnitsCount: number,
  duplicateUnitsCount: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  if (!units || units.length === 0) {
    return { error: 'No valid units selected for import.' };
  }

  let importedUnitsCount = 0;
  const errorLogs: string[] = [];

  for (const unit of units) {
    try {
      if (unit.unitType === 'accounting_large') {
        // 1. Insert parent questions record
        const { data: qData, error: qErr } = await adminClient
          .from('questions')
          .insert({
            subject_id: unit.subjectId,
            chapter_id: unit.chapterId || null,
            question_text: unit.prompt,
            question_type: 'large',
            marks: unit.totalMarks || 20,
            is_active: unit.status === 'active',
          })
          .select('id')
          .single();

        if (qErr || !qData) {
          throw new Error(`Failed to insert question header for "${unit.title}": ${qErr?.message}`);
        }

        // 2. Insert child large_questions record
        const { error: lgErr } = await adminClient.from('large_questions').insert({
          question_id: qData.id,
          case_title: unit.title,
          case_text: unit.supportingInformation || '',
          template_type: 'financial_statements',
          question_data: {
            fields: unit.fields || [],
          },
        });

        if (lgErr) {
          // Rollback parent question
          await adminClient.from('questions').delete().eq('id', qData.id);
          throw new Error(`Failed to insert structured fields for "${unit.title}": ${lgErr.message}`);
        }

        importedUnitsCount++;
      } else if (unit.unitType === 'scenario') {
        // Format sub_questions JSON array
        const formattedSubQuestions = (unit.tasks || []).map((t) => ({
          id: `task_${t.task_number}`,
          text: t.question,
          options: [
            { letter: 'A', text: t.options.A },
            { letter: 'B', text: t.options.B },
            { letter: 'C', text: t.options.C },
            { letter: 'D', text: t.options.D },
          ],
          correct_answer: t.correct_answer,
          marks: t.marks,
          explanation: t.explanation || null,
        }));

        // 1. Insert parent questions record
        const { data: qData, error: qErr } = await adminClient
          .from('questions')
          .insert({
            subject_id: unit.subjectId,
            chapter_id: unit.chapterId || null,
            question_text: unit.title,
            question_type: 'scenario',
            marks: 15,
            is_active: unit.status === 'active',
          })
          .select('id')
          .single();

        if (qErr || !qData) {
          throw new Error(`Failed to insert scenario question header for "${unit.title}": ${qErr?.message}`);
        }

        // 2. Insert child scenario_questions record
        const { error: scErr } = await adminClient.from('scenario_questions').insert({
          question_id: qData.id,
          scenario_title: unit.title,
          scenario_text: unit.supportingInformation || '',
          sub_questions: formattedSubQuestions,
        });

        if (scErr) {
          // Rollback parent question
          await adminClient.from('questions').delete().eq('id', qData.id);
          throw new Error(`Failed to insert child scenario tasks for "${unit.title}": ${scErr.message}`);
        }

        importedUnitsCount++;
      }
    } catch (err: any) {
      errorLogs.push(err.message || 'Unknown error during unit insertion');
    }
  }

  // Audit trail insertion in bulk_imports
  await adminClient.from('bulk_imports').insert({
    admin_id: user.id,
    file_name: fileName,
    file_type: fileType,
    total_rows: totalUnitsCount,
    valid_rows: units.length,
    invalid_rows: invalidUnitsCount,
    duplicate_rows: duplicateUnitsCount,
    imported_rows: importedUnitsCount,
    status: errorLogs.length === 0 ? 'completed' : importedUnitsCount > 0 ? 'completed' : 'failed',
    error_log: errorLogs.map((e) => ({ error: e })),
  });

  revalidatePath('/admin/questions/special');
  revalidatePath('/admin/questions');
  revalidatePath('/admin/imports');

  if (errorLogs.length > 0 && importedUnitsCount === 0) {
    return { error: `Import failed: ${errorLogs[0]}` };
  }

  return {
    success: true,
    importedCount: importedUnitsCount,
    errors: errorLogs.length > 0 ? errorLogs : undefined,
  };
}

/**
 * Toggle active status of a special question (Soft Activation/Deactivation)
 */
export async function toggleSpecialQuestionStatusAction(questionId: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  const { error } = await adminClient
    .from('questions')
    .update({ is_active: !currentStatus })
    .eq('id', questionId);

  if (error) return { error: error.message };

  revalidatePath('/admin/questions/special');
  return { success: true };
}

/**
 * Safe delete: Checks if question has been referenced in any student attempts.
 * If referenced, blocks deletion and advises soft deactivation instead.
 */
export async function deleteSpecialQuestionAction(questionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin privileges required.' };

  // Check attempt references to protect student history
  const { count: attemptRefCount } = await adminClient
    .from('attempt_questions')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId);

  if (attemptRefCount && attemptRefCount > 0) {
    return {
      error: `This special question has been used in ${attemptRefCount} student exam attempt(s). Destructive deletion is blocked to preserve audit history. Please set its status to Inactive instead.`,
    };
  }

  // Delete question (cascades to large_questions or scenario_questions)
  const { error } = await adminClient.from('questions').delete().eq('id', questionId);

  if (error) return { error: error.message };

  revalidatePath('/admin/questions/special');
  return { success: true };
}

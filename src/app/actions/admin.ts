'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Helper to verify admin role
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
  return { user, isAdmin: profile?.role === 'admin', adminClient };
}

// ==================================================
// 1. SUBJECT MANAGEMENT ACTIONS
// ==================================================

export async function createSubjectAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const name = (formData.get('name') as string || '').trim();
  const code = (formData.get('code') as string || '').trim().toUpperCase();
  const description = (formData.get('description') as string || '').trim();
  const displayOrder = Number(formData.get('displayOrder') || 10);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!name || !code) {
    return { error: 'Subject name and subject code are required.' };
  }

  const { data: existing } = await adminClient.from('subjects').select('id').or(`name.eq.${name},code.eq.${code}`);
  if (existing && existing.length > 0) {
    return { error: 'A subject with this name or code already exists.' };
  }

  const { error } = await adminClient.from('subjects').insert({
    name,
    code,
    slug,
    description,
    display_order: displayOrder,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/subjects');
  revalidatePath('/subjects');
  return { success: true };
}

export async function updateSubjectAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string || '').trim();
  const code = (formData.get('code') as string || '').trim().toUpperCase();
  const description = (formData.get('description') as string || '').trim();
  const displayOrder = Number(formData.get('displayOrder') || 10);
  const isActive = formData.get('isActive') === 'true';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!id || !name || !code) {
    return { error: 'Subject ID, name, and code are required.' };
  }

  const { error } = await adminClient
    .from('subjects')
    .update({
      name,
      code,
      slug,
      description,
      display_order: displayOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/subjects');
  revalidatePath('/subjects');
  return { success: true };
}

export async function toggleSubjectActiveAction(id: string, isActive: boolean) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { error } = await adminClient
    .from('subjects')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/subjects');
  revalidatePath('/subjects');
  return { success: true };
}

export async function deleteSubjectAction(id: string) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { count: chapterCount } = await adminClient.from('chapters').select('*', { count: 'exact', head: true }).eq('subject_id', id);
  if (chapterCount && chapterCount > 0) {
    return { error: `Cannot delete subject because it contains ${chapterCount} chapters. Please deactivate the subject instead.` };
  }

  const { count: questionCount } = await adminClient.from('questions').select('*', { count: 'exact', head: true }).eq('subject_id', id);
  if (questionCount && questionCount > 0) {
    return { error: `Cannot delete subject because it contains ${questionCount} questions in the question bank. Please deactivate it instead.` };
  }

  const { error } = await adminClient.from('subjects').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/subjects');
  revalidatePath('/subjects');
  return { success: true };
}

// ==================================================
// 2. CHAPTER MANAGEMENT ACTIONS
// ==================================================

export async function createChapterAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const subjectId = formData.get('subjectId') as string;
  const name = (formData.get('name') as string || '').trim();
  const chapterNumber = Number(formData.get('chapterNumber'));
  const description = (formData.get('description') as string || '').trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!subjectId || !name || isNaN(chapterNumber) || chapterNumber <= 0) {
    return { error: 'Subject, chapter name, and valid chapter number are required.' };
  }

  const { data: existing } = await adminClient
    .from('chapters')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('chapter_number', chapterNumber);

  if (existing && existing.length > 0) {
    return { error: `Chapter ${chapterNumber} already exists for this subject.` };
  }

  const { error } = await adminClient.from('chapters').insert({
    subject_id: subjectId,
    name,
    chapter_number: chapterNumber,
    slug,
    description,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/chapters');
  return { success: true };
}

export async function updateChapterAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const id = formData.get('id') as string;
  const subjectId = formData.get('subjectId') as string;
  const name = (formData.get('name') as string || '').trim();
  const chapterNumber = Number(formData.get('chapterNumber'));
  const description = (formData.get('description') as string || '').trim();
  const isActive = formData.get('isActive') === 'true';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!id || !subjectId || !name || isNaN(chapterNumber)) {
    return { error: 'Chapter ID, subject, name, and chapter number are required.' };
  }

  const { error } = await adminClient
    .from('chapters')
    .update({
      subject_id: subjectId,
      name,
      chapter_number: chapterNumber,
      slug,
      description,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/chapters');
  return { success: true };
}

export async function toggleChapterActiveAction(id: string, isActive: boolean) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { error } = await adminClient
    .from('chapters')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/chapters');
  return { success: true };
}

export async function deleteChapterAction(id: string) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { count: questionCount } = await adminClient.from('questions').select('*', { count: 'exact', head: true }).eq('chapter_id', id);
  if (questionCount && questionCount > 0) {
    return { error: `Cannot delete chapter because it contains ${questionCount} questions. Please deactivate it instead.` };
  }

  const { error } = await adminClient.from('chapters').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/chapters');
  return { success: true };
}

// ==================================================
// 3. MCQ QUESTION MANAGEMENT ACTIONS
// ==================================================

export async function createQuestionAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const subjectId = formData.get('subjectId') as string;
  const chapterId = (formData.get('chapterId') as string) || null;
  const questionText = (formData.get('questionText') as string || '').trim();
  const optionA = (formData.get('optionA') as string || '').trim();
  const optionB = (formData.get('optionB') as string || '').trim();
  const optionC = (formData.get('optionC') as string || '').trim();
  const optionD = (formData.get('optionD') as string || '').trim();
  const correctAnswer = (formData.get('correctAnswer') as string || 'A').toUpperCase();
  const explanation = (formData.get('explanation') as string || '').trim();
  const marks = Number(formData.get('marks') || 2);
  const questionType = (formData.get('questionType') as string || 'mcq');

  if (!subjectId || !questionText || !optionA || !optionB || !optionC || !optionD) {
    return { error: 'Subject, Question text, and all Options (A-D) are required.' };
  }

  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
    return { error: 'Correct Answer must be A, B, C, or D.' };
  }

  const { data: qData, error: qErr } = await adminClient
    .from('questions')
    .insert({
      subject_id: subjectId,
      chapter_id: chapterId || null,
      question_text: questionText,
      question_type: questionType,
      marks: isNaN(marks) || marks <= 0 ? 2 : marks,
      explanation: explanation || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (qErr || !qData) return { error: qErr?.message || 'Failed to insert question.' };

  const options = [
    { question_id: qData.id, option_letter: 'A', option_text: optionA, is_correct: correctAnswer === 'A' },
    { question_id: qData.id, option_letter: 'B', option_text: optionB, is_correct: correctAnswer === 'B' },
    { question_id: qData.id, option_letter: 'C', option_text: optionC, is_correct: correctAnswer === 'C' },
    { question_id: qData.id, option_letter: 'D', option_text: optionD, is_correct: correctAnswer === 'D' },
  ];

  const { error: optErr } = await adminClient.from('question_options').insert(options);
  if (optErr) {
    await adminClient.from('questions').delete().eq('id', qData.id);
    return { error: optErr.message };
  }

  revalidatePath('/admin/questions');
  return { success: true };
}

export async function updateQuestionAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const id = formData.get('id') as string;
  const subjectId = formData.get('subjectId') as string;
  const chapterId = (formData.get('chapterId') as string) || null;
  const questionText = (formData.get('questionText') as string || '').trim();
  const optionA = (formData.get('optionA') as string || '').trim();
  const optionB = (formData.get('optionB') as string || '').trim();
  const optionC = (formData.get('optionC') as string || '').trim();
  const optionD = (formData.get('optionD') as string || '').trim();
  const correctAnswer = (formData.get('correctAnswer') as string || 'A').toUpperCase();
  const explanation = (formData.get('explanation') as string || '').trim();
  const marks = Number(formData.get('marks') || 2);
  const isActive = formData.get('isActive') === 'true';

  if (!id || !subjectId || !questionText || !optionA || !optionB || !optionC || !optionD) {
    return { error: 'Question ID, Subject, Question text, and all Options are required.' };
  }

  const { error: qErr } = await adminClient
    .from('questions')
    .update({
      subject_id: subjectId,
      chapter_id: chapterId || null,
      question_text: questionText,
      marks: isNaN(marks) || marks <= 0 ? 2 : marks,
      explanation: explanation || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (qErr) return { error: qErr.message };

  const optionsMap = [
    { letter: 'A', text: optionA },
    { letter: 'B', text: optionB },
    { letter: 'C', text: optionC },
    { letter: 'D', text: optionD },
  ];

  for (const opt of optionsMap) {
    await adminClient
      .from('question_options')
      .update({
        option_text: opt.text,
        is_correct: correctAnswer === opt.letter,
      })
      .eq('question_id', id)
      .eq('option_letter', opt.letter);
  }

  revalidatePath('/admin/questions');
  return { success: true };
}

export async function toggleQuestionActiveAction(id: string, isActive: boolean) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { error } = await adminClient
    .from('questions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/questions');
  return { success: true };
}

export async function deleteQuestionAction(id: string) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { count: attemptCount } = await adminClient.from('attempt_questions').select('*', { count: 'exact', head: true }).eq('question_id', id);
  if (attemptCount && attemptCount > 0) {
    return { error: `Cannot delete question because it is recorded in ${attemptCount} student exam attempts. Please deactivate it instead.` };
  }

  const { error } = await adminClient.from('questions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/questions');
  return { success: true };
}

// ==================================================
// 4. SCENARIO QUESTION ACTIONS
// ==================================================

export async function createScenarioQuestionAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const subjectId = formData.get('subjectId') as string;
  const chapterId = (formData.get('chapterId') as string) || null;
  const scenarioTitle = (formData.get('scenarioTitle') as string || '').trim();
  const scenarioText = (formData.get('scenarioText') as string || '').trim();
  const marks = Number(formData.get('marks') || 15);

  if (!subjectId || !scenarioTitle || !scenarioText) {
    return { error: 'Subject, Scenario Title, and Case Text are required.' };
  }

  // Insert master question entry
  const { data: qData, error: qErr } = await adminClient
    .from('questions')
    .insert({
      subject_id: subjectId,
      chapter_id: chapterId || null,
      question_text: scenarioTitle,
      question_type: 'scenario',
      marks: marks,
      is_active: true,
    })
    .select('id')
    .single();

  if (qErr || !qData) return { error: qErr?.message || 'Failed to create scenario question.' };

  // Insert scenario question entry
  const { error: scErr } = await adminClient.from('scenario_questions').insert({
    question_id: qData.id,
    scenario_title: scenarioTitle,
    scenario_text: scenarioText,
    sub_questions: [],
  });

  if (scErr) return { error: scErr.message };

  revalidatePath('/admin/scenarios');
  return { success: true };
}

export async function deleteScenarioQuestionAction(id: string) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { error } = await adminClient.from('questions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/scenarios');
  return { success: true };
}

// ==================================================
// 5. LARGE QUESTION ACTIONS
// ==================================================

export async function createLargeQuestionAction(formData: FormData) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const subjectId = formData.get('subjectId') as string;
  const chapterId = (formData.get('chapterId') as string) || null;
  const caseTitle = (formData.get('caseTitle') as string || '').trim();
  const caseText = (formData.get('caseText') as string || '').trim();
  const templateType = (formData.get('templateType') as string || 'financial_statements');
  const marks = Number(formData.get('marks') || 20);

  if (!subjectId || !caseTitle || !caseText) {
    return { error: 'Subject, Case Title, and Problem Text are required.' };
  }

  // Insert master question entry
  const { data: qData, error: qErr } = await adminClient
    .from('questions')
    .insert({
      subject_id: subjectId,
      chapter_id: chapterId || null,
      question_text: caseTitle,
      question_type: 'large',
      marks: marks,
      is_active: true,
    })
    .select('id')
    .single();

  if (qErr || !qData) return { error: qErr?.message || 'Failed to create large question.' };

  // Insert large question entry
  const { error: lqErr } = await adminClient.from('large_questions').insert({
    question_id: qData.id,
    case_title: caseTitle,
    case_text: caseText,
    template_type: templateType as any,
    question_data: {},
  });

  if (lqErr) return { error: lqErr.message };

  revalidatePath('/admin/large-questions');
  return { success: true };
}

export async function deleteLargeQuestionAction(id: string) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  const { error } = await adminClient.from('questions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/large-questions');
  return { success: true };
}

// ==================================================
// 6. EXAM CONFIG & TOKEN ACTIONS
// ==================================================

export async function updateExamConfigAction(formData: FormData): Promise<void> {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return;

  const configId = formData.get('configId') as string;
  const durationMinutes = Number(formData.get('durationMinutes'));
  const mcqCount = Number(formData.get('mcqCount'));
  const mcqMarks = Number(formData.get('mcqMarks'));
  const scenarioCount = Number(formData.get('scenarioCount'));
  const scenarioMarks = Number(formData.get('scenarioMarks'));
  const largeCount = Number(formData.get('largeCount'));
  const largeMarks = Number(formData.get('largeMarks'));

  const totalMarks = (mcqCount * mcqMarks) + (scenarioCount * scenarioMarks) + (largeCount * largeMarks);

  await adminClient
    .from('exam_configs')
    .update({
      duration_minutes: durationMinutes,
      mcq_count: mcqCount,
      mcq_marks_each: mcqMarks,
      scenario_count: scenarioCount,
      scenario_marks_each: scenarioMarks,
      large_count: largeCount,
      large_marks_each: largeMarks,
      total_marks: totalMarks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId);

  revalidatePath('/admin/exams');
}

export async function grantUserTokensAction(targetUserId: string, amount: number, description: string) {
  const { isAdmin, adminClient } = await checkAdminAuth();
  if (!isAdmin || !adminClient) return { error: 'Admin authorization required.' };

  // 1. Try atomic PostgreSQL RPC if available
  try {
    const { data: rpcRes, error: rpcErr } = await adminClient.rpc('grant_admin_tokens', {
      p_target_user_id: targetUserId,
      p_amount: amount,
      p_description: description || 'Admin promotional grant',
    });
    if (!rpcErr && rpcRes && rpcRes.success) {
      revalidatePath('/admin/tokens');
      revalidatePath('/admin/users');
      return { success: true, newBalance: rpcRes.new_balance };
    }
  } catch {
    // Fall back to ledger-driven application logic
  }

  // 2. Insert transaction into authoritative ledger first
  const { error: txError } = await adminClient.from('token_transactions').insert({
    user_id: targetUserId,
    amount,
    transaction_type: 'admin_grant',
    description: description || 'Admin promotional grant',
  });

  if (txError) {
    return { error: txError.message };
  }

  // 3. Derive authoritative new balance directly from the entire transaction ledger sum
  const { data: allUserTxs } = await adminClient
    .from('token_transactions')
    .select('amount')
    .eq('user_id', targetUserId);

  const authoritativeBalance = (allUserTxs || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // 4. Update or insert token_accounts with the exact authoritative ledger balance
  await adminClient
    .from('token_accounts')
    .upsert({
      user_id: targetUserId,
      balance: Math.max(0, authoritativeBalance),
      updated_at: new Date().toISOString(),
    });

  revalidatePath('/admin/tokens');
  revalidatePath('/admin/users');
  return { success: true, newBalance: authoritativeBalance };
}

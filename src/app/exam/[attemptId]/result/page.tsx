import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateExamAttempt, isExactNumericMatch } from '@/lib/exam/grading';
import { QuestionReportButton } from './QuestionReportButton';
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, FileText, Check, AlertCircle } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Exam Attempt Result',
  robots: {
    index: false,
    follow: false,
  },
};

interface ResultPageProps {
  params: Promise<{
    attemptId: string;
  }>;
}

export default async function ExamResultPage({ params }: ResultPageProps) {
  const resolvedParams = await params;
  const attemptId = resolvedParams.attemptId;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  const adminClient = createAdminClient();

  const { data: attempt } = await adminClient
    .from('exam_attempts')
    .select('*, subject:subjects(*)')
    .eq('id', attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) notFound();

  // Fetch Attempt Questions & User Answers
  const { data: attemptQuestions } = await adminClient
    .from('attempt_questions')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true });

  const { data: answers } = await adminClient
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId);

  // Fetch all options for MCQs in this attempt to expose correct keys ONLY post-submission
  const mcqQuestionIds = (attemptQuestions || [])
    .filter((q) => (q.question_snapshot?.question_type || 'mcq') === 'mcq')
    .map((q) => q.question_id);

  let fullDbOptions: any[] = [];
  if (mcqQuestionIds.length > 0) {
    const { data: opts } = await adminClient
      .from('question_options')
      .select('*')
      .in('question_id', mcqQuestionIds);
    fullDbOptions = opts || [];
  }

  // Fetch scenario data for scenario review
  const scenarioQuestionIds = (attemptQuestions || [])
    .filter((q) => q.question_snapshot?.question_type === 'scenario')
    .map((q) => q.question_id);

  let fullDbScenarios: any[] = [];
  if (scenarioQuestionIds.length > 0) {
    const { data: scens } = await adminClient
      .from('scenario_questions')
      .select('*')
      .in('question_id', scenarioQuestionIds);
    fullDbScenarios = scens || [];
  }

  // Fetch large questions for large question review
  const largeQuestionIds = (attemptQuestions || [])
    .filter((q) => q.question_snapshot?.question_type === 'large')
    .map((q) => q.question_id);

  let fullDbLarge: any[] = [];
  if (largeQuestionIds.length > 0) {
    const { data: lgs } = await adminClient
      .from('large_questions')
      .select('*')
      .in('question_id', largeQuestionIds);
    fullDbLarge = lgs || [];
  }

  // Single authoritative evaluation source of truth
  const evaluation = evaluateExamAttempt(
    attemptQuestions || [],
    answers || [],
    fullDbOptions,
    fullDbScenarios,
    fullDbLarge
  );

  // Fetch already submitted reports for this student on this attempt
  const { data: userReports } = await adminClient
    .from('question_reports')
    .select('question_id')
    .eq('attempt_id', attemptId)
    .eq('user_id', user.id);
  const reportedQuestionIdSet = new Set((userReports || []).map((r) => r.question_id));

  const displayScore = attempt.score !== null && attempt.score !== undefined ? attempt.score : evaluation.totalScore;
  const displayMarks = attempt.total_marks || evaluation.totalMarks;
  const percentage = Math.round((displayScore / displayMarks) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite">
      <Navbar user={{ email: user.email! }} />

      <main className="flex-1 py-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* RESULT SUMMARY BANNER */}
        <Card className={`border-2 shadow-md ${attempt.is_passed ? 'border-green-400 bg-green-50/40' : 'border-red-300 bg-red-50/40'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                  {attempt.subject?.code}
                </span>
                <Badge variant={attempt.is_passed ? 'success' : 'danger'}>
                  {attempt.is_passed ? 'EXAM PASSED' : 'EXAM FAILED'}
                </Badge>
                <span className="text-xs text-gray-500 font-mono capitalize">
                  {attempt.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{attempt.title} Result</h1>
              <p className="text-xs text-gray-600">
                Completed on {new Date(attempt.completed_at || attempt.updated_at).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-300 min-w-[220px] shadow-sm">
              <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Final Score</span>
              <div className="text-4xl font-extrabold text-brand-red my-1">
                {attempt.score} <span className="text-lg text-gray-500 font-normal">/ {attempt.total_marks}</span>
              </div>
              <span className={`text-xs font-semibold ${attempt.is_passed ? 'text-green-700' : 'text-red-700'}`}>
                {percentage}% Score Ratio
              </span>
            </div>
          </div>

          {/* Metrics Breakdown Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-200 text-center text-xs">
            <div className="p-2 rounded bg-green-50 border border-green-200 text-green-800">
              <strong className="block text-base font-bold">{evaluation.correctCount}</strong>
              <span>Correct Answers</span>
            </div>
            <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800">
              <strong className="block text-base font-bold">{evaluation.incorrectCount}</strong>
              <span>Incorrect Answers</span>
            </div>
            <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-700">
              <strong className="block text-base font-bold">{evaluation.unansweredCount}</strong>
              <span>Unanswered</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <Link href="/dashboard/history">
              <Button variant="outline" size="sm">
                View History Log
              </Button>
            </Link>
            <Link href={`/subjects/${attempt.subject?.slug}`}>
              <Button variant="primary" size="sm" className="gap-2 bg-brand-red hover:bg-brand-red-dark">
                <RotateCcw className="h-4 w-4" />
                Retake Exam
              </Button>
            </Link>
          </div>
        </Card>

        {/* QUESTION BY QUESTION DETAILED REVIEW */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-red" />
            Detailed Question Breakdown
          </h2>

          <div className="space-y-4">
            {attemptQuestions?.map((qItem: any, idx: number) => {
              const qSnapshot = qItem.question_snapshot || {};
              const qType = qSnapshot.question_type || 'mcq';
              const userAnswer = answers?.find((a) => a.question_id === qItem.question_id);
              const selectedOptionId = userAnswer?.selected_option_id;
              const qGrading = evaluation.questionGradings.find((g) => g.questionId === qItem.question_id);

              const isAnswered = qGrading ? qGrading.isAnswered : false;
              const marksObtained = qGrading ? qGrading.marksObtained : 0;

              // MCQ Review Logic
              const dbOpts = fullDbOptions.filter((o) => o.question_id === qItem.question_id);
              const optionsToRender = dbOpts.length > 0 ? dbOpts : (qSnapshot.options || []);
              const correctOption = optionsToRender.find((o: any) => o.is_correct);

              return (
                <Card key={qItem.id} className="border-gray-300 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">
                        Question {idx + 1}
                      </span>
                      <Badge variant="neutral">{qItem.marks} Marks</Badge>
                      <Badge variant="brand" className="capitalize">{qType}</Badge>
                    </div>

                    {isAnswered ? (
                      marksObtained > 0 ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> +{marksObtained} Marks
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="gap-1">
                          <XCircle className="h-3.5 w-3.5" /> 0 Marks
                        </Badge>
                      )
                    ) : (
                      <Badge variant="warning">Not Answered</Badge>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                    {qSnapshot.question_text}
                  </div>

                  {/* MCQ Review */}
                  {qType === 'mcq' && (
                    <div className="space-y-2 pt-1">
                      {optionsToRender.map((opt: any) => {
                        const isSelected = selectedOptionId === opt.id;
                        const isCorrect = opt.is_correct;

                        let itemStyle = 'bg-gray-50 border-gray-200 text-gray-700';
                        if (isCorrect) itemStyle = 'bg-green-50 border-green-300 text-green-900 font-semibold';
                        if (isSelected && !isCorrect) itemStyle = 'bg-red-50 border-red-300 text-red-900 font-semibold';

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-3 p-3 rounded-md border text-xs leading-relaxed ${itemStyle}`}
                          >
                            <span className="font-bold shrink-0">{opt.option_letter}.</span>
                            <span className="flex-1">{opt.option_text}</span>
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-green-700 uppercase bg-green-100 px-2 py-0.5 rounded">
                                Correct Answer
                              </span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="text-[10px] font-bold text-red-700 uppercase bg-red-100 px-2 py-0.5 rounded">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Scenario Review */}
                  {qType === 'scenario' && (
                    <div className="space-y-4 pt-1">
                      <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
                        <strong className="block font-semibold mb-1">{qSnapshot.scenario_title || 'Case Study Scenario'}</strong>
                        <p className="whitespace-pre-line leading-relaxed">{qSnapshot.scenario_text}</p>
                      </div>

                      <div className="space-y-3">
                        {qSnapshot.sub_questions?.map((sq: any, sIdx: number) => {
                          let userChoiceMap: Record<string, string> = {};
                          try {
                            if (userAnswer?.text_answer) userChoiceMap = JSON.parse(userAnswer.text_answer);
                          } catch (e) {
                            userChoiceMap = {};
                          }
                          const uChoice = userChoiceMap[sq.id]?.toUpperCase();
                          const dbScen = fullDbScenarios.find((s) => s.question_id === qItem.question_id);
                          const dbSub = dbScen?.sub_questions?.find((s: any) => s.id === sq.id);
                          const correctKey = (dbSub?.correct_answer || sq.correct_answer)?.toUpperCase();
                          const taskMarks = sIdx === 0 ? 3 : 2;
                          const isCorrect = uChoice && correctKey && uChoice === correctKey;

                          return (
                            <div key={sq.id || sIdx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/80 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">
                                  Task {sIdx + 1}: {sq.text}
                                </span>
                                <Badge variant={isCorrect ? 'success' : 'danger'} className="text-[10px]">
                                  {isCorrect ? `+${taskMarks} Marks` : `0 / ${taskMarks} Marks`}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200">
                                <div>
                                  Your Choice:{' '}
                                  <strong className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                    {uChoice || 'Not answered'}
                                  </strong>
                                </div>
                                <div className="text-gray-300">|</div>
                                <div>
                                  Correct Answer:{' '}
                                  <strong className="text-green-700">{correctKey || 'N/A'}</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Large Question Review */}
                  {qType === 'large' && (() => {
                    const dbLg = fullDbLarge.find((l) => l.question_id === qItem.question_id);
                    const fields = dbLg?.question_data?.fields || qSnapshot.question_data?.fields;

                    let parsedUserAnswers: Record<string, string> = {};
                    try {
                      if (userAnswer?.text_answer) {
                        parsedUserAnswers = JSON.parse(userAnswer.text_answer);
                      }
                    } catch (e) {
                      parsedUserAnswers = {};
                    }

                    return (
                      <div className="space-y-4 pt-1">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900">
                          <strong className="block font-semibold mb-1">{qSnapshot.case_title || 'Accounting Problem Statement'}</strong>
                          <p className="whitespace-pre-line leading-relaxed font-mono">{qSnapshot.case_text}</p>
                        </div>

                        {fields && Array.isArray(fields) && fields.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Structured Numerical Evaluation Breakdown:
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                              <table className="w-full text-xs text-left text-gray-700">
                                <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                                  <tr>
                                    <th className="p-2.5">Field</th>
                                    <th className="p-2.5">Your Answer</th>
                                    <th className="p-2.5">Correct Value</th>
                                    <th className="p-2.5 text-right">Marks Awarded</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {fields.map((f: any) => {
                                    const uVal = parsedUserAnswers[f.id];
                                    const cVal = f.correct_value;
                                    const isMatch = isExactNumericMatch(uVal, cVal);
                                    const fMarks = Number(f.marks) || 0;
                                    const awarded = isMatch ? fMarks : 0;

                                    return (
                                      <tr key={f.id} className={isMatch ? 'bg-green-50/40' : 'bg-red-50/20'}>
                                        <td className="p-2.5 font-semibold text-gray-900">{f.label}</td>
                                        <td className={`p-2.5 font-mono ${isMatch ? 'text-green-800 font-bold' : 'text-red-700'}`}>
                                          {uVal !== undefined && uVal !== '' ? uVal : '—'}
                                        </td>
                                        <td className="p-2.5 font-mono text-green-800 font-bold">
                                          {cVal !== undefined ? String(cVal) : 'N/A'}
                                        </td>
                                        <td className="p-2.5 text-right">
                                          <span className={`inline-flex items-center gap-1 font-bold ${isMatch ? 'text-green-700' : 'text-red-700'}`}>
                                            {isMatch ? `+${awarded} / ${fMarks}` : `0 / ${fMarks}`}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {parsedUserAnswers._workings && (
                              <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-1 mt-2">
                                <strong className="text-gray-700 block font-semibold">Your Working Notes:</strong>
                                <p className="whitespace-pre-line font-mono text-gray-700">{parsedUserAnswers._workings}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-2">
                            <strong className="block text-gray-700 font-bold">Your Submitted Answer:</strong>
                            <p className="whitespace-pre-line font-mono bg-white p-2 rounded border border-gray-200 text-gray-800">
                              {userAnswer?.text_answer || 'No response entered.'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Question Explanation */}
                  {qSnapshot.explanation && (
                    <div className="p-3 bg-blue-50/60 rounded border border-blue-200 text-xs text-blue-900 space-y-1">
                      <strong className="block font-semibold">Explanation:</strong>
                      <p className="leading-relaxed">{qSnapshot.explanation}</p>
                    </div>
                  )}

                  {/* Post-Exam Question Reporting */}
                  <QuestionReportButton
                    questionId={qItem.question_id}
                    attemptId={attemptId}
                    questionNumber={idx + 1}
                    initialReported={reportedQuestionIdSet.has(qItem.question_id)}
                  />
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

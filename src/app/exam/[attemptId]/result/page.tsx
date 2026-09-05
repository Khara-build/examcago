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
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, FileText, Check, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

  const totalQuestions = attemptQuestions?.length || 0;
  const percentage = Math.round(((attempt.score || 0) / (attempt.total_marks || 100)) * 100);

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  (attemptQuestions || []).forEach((qItem) => {
    const uAns = answers?.find((a) => a.question_id === qItem.question_id);
    if (!uAns || (!uAns.selected_option_id && !uAns.text_answer)) {
      unansweredCount++;
    } else if (uAns.is_correct) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

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
              <strong className="block text-base font-bold">{correctCount}</strong>
              <span>Correct Answers</span>
            </div>
            <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800">
              <strong className="block text-base font-bold">{incorrectCount}</strong>
              <span>Incorrect Answers</span>
            </div>
            <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-700">
              <strong className="block text-base font-bold">{unansweredCount}</strong>
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

              // MCQ Review Logic
              const dbOpts = fullDbOptions.filter((o) => o.question_id === qItem.question_id);
              const optionsToRender = dbOpts.length > 0 ? dbOpts : (qSnapshot.options || []);
              const correctOption = optionsToRender.find((o: any) => o.is_correct);
              const isUserCorrect = userAnswer?.is_correct || (selectedOptionId && correctOption && selectedOptionId === correctOption.id);

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

                    {userAnswer?.marks_obtained !== undefined ? (
                      userAnswer.marks_obtained > 0 ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> +{userAnswer.marks_obtained} Marks
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
                        <strong className="block font-semibold mb-1">{qSnapshot.scenario_title}</strong>
                        <p className="whitespace-pre-line leading-relaxed">{qSnapshot.scenario_text}</p>
                      </div>

                      {qSnapshot.sub_questions?.map((sq: any, sIdx: number) => {
                        let userChoiceMap: Record<string, string> = {};
                        try {
                          if (userAnswer?.text_answer) userChoiceMap = JSON.parse(userAnswer.text_answer);
                        } catch (e) {
                          userChoiceMap = {};
                        }
                        const uChoice = userChoiceMap[sq.id];
                        const dbScen = fullDbScenarios.find((s) => s.question_id === qItem.question_id);
                        const dbSub = dbScen?.sub_questions?.find((s: any) => s.id === sq.id);
                        const correctKey = dbSub?.correct_answer || sq.correct_answer;

                        return (
                          <div key={sq.id || sIdx} className="p-3 rounded border border-gray-200 bg-gray-50 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-gray-900">
                              <span>Task {sIdx + 1}: {sq.text}</span>
                              <span className="text-gray-500 font-normal">
                                Your Choice: <strong className={uChoice === correctKey ? 'text-green-700' : 'text-red-700'}>{uChoice || 'None'}</strong> | Correct: <strong className="text-green-700">{correctKey || 'N/A'}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Large Question Review */}
                  {qType === 'large' && (
                    <div className="space-y-4 pt-1">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900">
                        <strong className="block font-semibold mb-1">{qSnapshot.case_title}</strong>
                        <p className="whitespace-pre-line leading-relaxed font-mono">{qSnapshot.case_text}</p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-2">
                        <strong className="block text-gray-700 font-bold">Your Submitted Answer:</strong>
                        <p className="whitespace-pre-line font-mono bg-white p-2 rounded border border-gray-200 text-gray-800">
                          {userAnswer?.text_answer || 'No response entered.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Question Explanation */}
                  {qSnapshot.explanation && (
                    <div className="p-3 bg-blue-50/60 rounded border border-blue-200 text-xs text-blue-900 space-y-1">
                      <strong className="block font-semibold">Explanation:</strong>
                      <p className="leading-relaxed">{qSnapshot.explanation}</p>
                    </div>
                  )}
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

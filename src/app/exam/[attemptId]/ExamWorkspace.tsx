'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { saveAnswerAction, submitExamAttemptAction } from '@/app/actions/exam';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Grid,
  X,
  FileText,
  Save,
  Loader2,
  Check
} from 'lucide-react';

interface ExamWorkspaceProps {
  attempt: any;
  initialQuestions: any[];
  initialAnswers: any[];
  initialRemainingSeconds?: number;
}

export function ExamWorkspace({
  attempt,
  initialQuestions,
  initialAnswers,
  initialRemainingSeconds,
}: ExamWorkspaceProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobileGrid, setShowMobileGrid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Answer state map: question_id -> { selectedOptionId, textAnswer, isFlagged }
  const [answersMap, setAnswersMap] = useState<Record<string, { selectedOptionId: string | null; textAnswer: string | null; isFlagged: boolean }>>(() => {
    const map: Record<string, { selectedOptionId: string | null; textAnswer: string | null; isFlagged: boolean }> = {};
    initialAnswers.forEach((a) => {
      map[a.question_id] = {
        selectedOptionId: a.selected_option_id || null,
        textAnswer: a.text_answer || null,
        isFlagged: a.is_flagged || false,
      };
    });
    return map;
  });

  // Calculate remaining seconds based on authoritative server time
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (typeof initialRemainingSeconds === 'number') {
      return Math.max(0, initialRemainingSeconds);
    }
    const maxSec = (attempt.duration_minutes || 90) * 60;
    const expires = new Date(attempt.expires_at).getTime();
    return Math.max(0, Math.min(maxSec, Math.floor((expires - Date.now()) / 1000)));
  });

  // Server-Synchronized Countdown Timer Effect using monotonic clock
  useEffect(() => {
    if (remainingSeconds <= 0) {
      handleAutoSubmit();
      return;
    }

    const mountTime = performance.now();
    const startRemaining = remainingSeconds;

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((performance.now() - mountTime) / 1000);
      const current = Math.max(0, startRemaining - elapsedSeconds);
      setRemainingSeconds(current);

      if (current <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  async function handleAutoSubmit() {
    if (submitting) return;
    setSubmitting(true);
    await submitExamAttemptAction(attempt.id, true);
    router.push(`/exam/${attempt.id}/result`);
  }

  const currentQItem = initialQuestions[currentIndex];
  const qSnapshot = currentQItem?.question_snapshot || {};
  const qType = qSnapshot.question_type || 'mcq';
  const currentAnswer = answersMap[currentQItem?.question_id] || { selectedOptionId: null, textAnswer: null, isFlagged: false };

  // Core background save handler
  async function persistAnswer(qId: string, optionId: string | null, textAns: string | null, flagged: boolean) {
    setSaveStatus('saving');
    const res = await saveAnswerAction(attempt.id, qId, optionId, textAns, flagged);
    if (res.error) {
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
    }
  }

  // Handle MCQ Option Selection
  async function handleSelectOption(optionId: string) {
    const qId = currentQItem.question_id;
    const newSelected = currentAnswer.selectedOptionId === optionId ? null : optionId;

    const updated = {
      ...answersMap,
      [qId]: {
        ...currentAnswer,
        selectedOptionId: newSelected,
      },
    };
    setAnswersMap(updated);
    await persistAnswer(qId, newSelected, currentAnswer.textAnswer, currentAnswer.isFlagged);
  }

  // Handle Scenario sub-question selection
  async function handleScenarioSubAnswer(subId: string, letter: string) {
    const qId = currentQItem.question_id;
    let currentParsed: Record<string, string> = {};
    try {
      if (currentAnswer.textAnswer) {
        currentParsed = JSON.parse(currentAnswer.textAnswer);
      }
    } catch (e) {
      currentParsed = {};
    }

    currentParsed[subId] = letter;
    const jsonStr = JSON.stringify(currentParsed);

    const updated = {
      ...answersMap,
      [qId]: {
        ...currentAnswer,
        textAnswer: jsonStr,
      },
    };
    setAnswersMap(updated);
    await persistAnswer(qId, currentAnswer.selectedOptionId, jsonStr, currentAnswer.isFlagged);
  }

  // Handle Large Question text response change
  async function handleLargeTextChange(text: string) {
    const qId = currentQItem.question_id;
    const updated = {
      ...answersMap,
      [qId]: {
        ...currentAnswer,
        textAnswer: text,
      },
    };
    setAnswersMap(updated);
    await persistAnswer(qId, currentAnswer.selectedOptionId, text, currentAnswer.isFlagged);
  }

  // Toggle Flag Question
  async function handleToggleFlag() {
    const qId = currentQItem.question_id;
    const newFlagged = !currentAnswer.isFlagged;

    const updated = {
      ...answersMap,
      [qId]: {
        ...currentAnswer,
        isFlagged: newFlagged,
      },
    };
    setAnswersMap(updated);
    await persistAnswer(qId, currentAnswer.selectedOptionId, currentAnswer.textAnswer, newFlagged);
  }

  // Confirm manual submission
  async function handleFinalSubmit() {
    setSubmitting(true);
    await submitExamAttemptAction(attempt.id, false);
    router.push(`/exam/${attempt.id}/result`);
  }

  // Format timer string (HH:MM:SS or MM:SS)
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  };

  const isQuestionAnswered = (ans: any) => {
    if (!ans) return false;
    if (ans.selectedOptionId !== null) return true;
    if (ans.textAnswer !== null && ans.textAnswer.trim() !== '') return true;
    return false;
  };

  const answeredCount = Object.values(answersMap).filter(isQuestionAnswered).length;
  const flaggedCount = Object.values(answersMap).filter((a) => a.isFlagged).length;

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite select-none">
      {/* EXAM HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-300 shadow-sm px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-red text-white font-bold shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {attempt.title}
              </h1>
              <span className="text-xs text-gray-500 font-medium">
                {attempt.subject?.name || 'ICAB Exam'} • Certificate Level
              </span>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-4">
            {/* Auto-Save Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>Auto-saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-red-600 font-semibold">Save failed</span>
                </>
              )}
            </div>

            {/* Countdown Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm sm:text-base font-bold border ${
              remainingSeconds < 300 ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' : 'bg-gray-100 text-gray-800 border-gray-300'
            }`}>
              <Clock className="h-4 w-4 text-brand-red" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => setShowMobileGrid(!showMobileGrid)}
              className="md:hidden p-2 rounded bg-gray-100 border border-gray-300 text-gray-700"
            >
              <Grid className="h-5 w-5" />
            </button>

            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex bg-brand-red hover:bg-brand-red-dark shadow-sm"
              onClick={() => setShowSubmitModal(true)}
            >
              Finish Attempt
            </Button>
          </div>
        </div>
      </header>

      {/* MULTI-COLUMN EXAM WORKSPACE */}
      <div className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* MAIN QUESTION DISPLAY AREA */}
        <main className="md:col-span-8 lg:col-span-9 flex flex-col justify-between space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm space-y-6">
            {/* Question Header & Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-brand-red bg-red-50 border border-red-200 px-3 py-1 rounded">
                  Question {currentIndex + 1} of {initialQuestions.length}
                </span>
                <Badge variant="neutral">
                  {currentQItem?.marks || 2} Marks
                </Badge>
                <Badge variant="brand" className="capitalize">
                  {qType}
                </Badge>
              </div>

              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  currentAnswer.isFlagged
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Flag className={`h-3.5 w-3.5 ${currentAnswer.isFlagged ? 'fill-amber-600 text-amber-700' : ''}`} />
                <span>{currentAnswer.isFlagged ? 'Flagged' : 'Flag Question'}</span>
              </button>
            </div>

            {/* Standard MCQ Question Display */}
            {qType === 'mcq' && (
              <div className="space-y-6">
                <div className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
                  {qSnapshot.question_text || 'Multiple Choice Question'}
                </div>

                <div className="space-y-3 pt-2">
                  {qSnapshot.options?.map((opt: any) => {
                    const isSelected = currentAnswer.selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-red-50/70 border-brand-red text-gray-900 shadow-sm ring-1 ring-brand-red'
                            : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                          isSelected
                            ? 'bg-brand-red text-white border-brand-red'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {opt.option_letter}
                        </div>
                        <div className="text-sm pt-0.5 leading-relaxed font-medium">
                          {opt.option_text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scenario Case Study Display */}
            {qType === 'scenario' && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    {qSnapshot.scenario_title || 'Scenario Case Study'}
                  </span>
                  <div className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line font-serif">
                    {qSnapshot.scenario_text}
                  </div>
                </div>

                <div className="text-base font-semibold text-gray-900">
                  {qSnapshot.question_text}
                </div>

                {/* Scenario Sub-Questions */}
                <div className="space-y-6 pt-2">
                  {qSnapshot.sub_questions?.map((sq: any, sIdx: number) => {
                    let parsedMap: Record<string, string> = {};
                    try {
                      if (currentAnswer.textAnswer) parsedMap = JSON.parse(currentAnswer.textAnswer);
                    } catch (e) {
                      parsedMap = {};
                    }
                    const selectedSubChoice = parsedMap[sq.id];

                    return (
                      <div key={sq.id || sIdx} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3">
                        <div className="text-sm font-bold text-gray-900">
                          Task {sIdx + 1}: {sq.text}
                        </div>

                        {sq.options ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sq.options.map((opt: any) => {
                              const isSubSelected = selectedSubChoice === opt.letter;
                              return (
                                <button
                                  key={opt.letter}
                                  onClick={() => handleScenarioSubAnswer(sq.id, opt.letter)}
                                  className={`flex items-center gap-3 p-3 rounded border text-xs font-medium text-left transition-all ${
                                    isSubSelected
                                      ? 'bg-brand-red text-white border-brand-red font-bold'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                  }`}
                                >
                                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                    isSubSelected ? 'bg-white text-brand-red' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {opt.letter}
                                  </span>
                                  <span>{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <textarea
                            value={selectedSubChoice || ''}
                            onChange={(e) => handleScenarioSubAnswer(sq.id, e.target.value)}
                            placeholder="Type your response for this scenario task..."
                            className="w-full p-3 rounded border border-gray-300 text-xs focus:ring-1 focus:ring-brand-red focus:outline-none"
                            rows={3}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 20-Mark Accounting Large Question Display */}
            {qType === 'large' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                      {qSnapshot.case_title || 'Accounting Problem Statement (20 Marks)'}
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      Template: {qSnapshot.template_type?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line font-mono bg-white p-3 rounded border border-blue-100">
                    {qSnapshot.case_text}
                  </div>
                </div>

                <div className="text-base font-semibold text-gray-900">
                  {qSnapshot.question_text}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Student Workspace Response & Computations:
                  </label>
                  <textarea
                    value={currentAnswer.textAnswer || ''}
                    onChange={(e) => handleLargeTextChange(e.target.value)}
                    placeholder="Enter double-entry journal adjustments, trial balance calculations, or structured financial report details here..."
                    className="w-full p-4 rounded-lg border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-brand-red focus:outline-none leading-relaxed"
                    rows={10}
                  />
                  <span className="text-[11px] text-gray-500 italic block text-right">
                    Auto-saved continuously to server workspace.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM NAVIGATION FOOTER CONTROLS */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
            <Button
              variant="outline"
              size="md"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-xs text-gray-500 hidden sm:inline-block">
              {answeredCount} of {initialQuestions.length} Answered
            </span>

            {currentIndex < initialQuestions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentIndex((prev) => Math.min(initialQuestions.length - 1, prev + 1))}
                className="gap-1 bg-brand-red hover:bg-brand-red-dark"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowSubmitModal(true)}
                className="bg-green-700 hover:bg-green-800"
              >
                Submit Attempt
              </Button>
            )}
          </div>
        </main>

        {/* SIDEBAR QUESTION PALETTE (DESKTOP) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Question Navigator</h3>
              <span className="text-xs text-gray-500 font-semibold">{answeredCount}/{initialQuestions.length}</span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-green-600 inline-block"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-gray-200 border border-gray-400 inline-block"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-500 inline-block"></span>
                <span>Flagged ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border-2 border-brand-red inline-block"></span>
                <span>Current</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {initialQuestions.map((q, idx) => {
                const ans = answersMap[q.question_id];
                const isCurrent = idx === currentIndex;
                const isAns = isQuestionAnswered(ans);
                const isFlagged = ans && ans.isFlagged;

                let bgClass = 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
                if (isAns) bgClass = 'bg-green-600 text-white border-green-700 font-bold';
                if (isFlagged) bgClass = 'bg-amber-500 text-white border-amber-600 font-bold';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative flex h-10 w-full items-center justify-center rounded text-xs font-semibold border transition-all ${bgClass} ${
                      isCurrent ? 'ring-2 ring-brand-red ring-offset-1 border-brand-red font-extrabold scale-105 z-10' : ''
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs mt-2"
              onClick={() => setShowSubmitModal(true)}
            >
              Finish & Submit Exam
            </Button>
          </div>
        </aside>
      </div>

      {/* MOBILE QUESTION GRID DRAWER */}
      {showMobileGrid && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end md:hidden">
          <div className="w-4/5 max-w-sm bg-white h-full p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Question Palette</h3>
              <button onClick={() => setShowMobileGrid(false)} className="p-1 text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {initialQuestions.map((q, idx) => {
                const ans = answersMap[q.question_id];
                const isCurrent = idx === currentIndex;
                const isAns = isQuestionAnswered(ans);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobileGrid(false);
                    }}
                    className={`flex h-10 w-full items-center justify-center rounded text-xs font-bold border ${
                      isAns ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                    } ${isCurrent ? 'ring-2 ring-brand-red' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-brand-red">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900">Submit Exam Attempt?</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to finish and submit your exam? You cannot modify your answers after submission.
            </p>

            <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Questions:</span>
                <strong className="text-gray-900">{initialQuestions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Answered Questions:</span>
                <strong className="text-green-700">{answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unanswered Questions:</span>
                <strong className="text-red-700">{initialQuestions.length - answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Flagged Questions:</span>
                <strong className="text-amber-700">{flaggedCount}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Return to Exam
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-brand-red hover:bg-brand-red-dark"
                onClick={handleFinalSubmit}
                isLoading={submitting}
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Authoritative Unified Exam Evaluation & Grading Engine for Exam CAGO.
 * 
 * Provides a single source of truth for:
 * - MCQ evaluation against authoritative database options
 * - Scenario question sub-task evaluation
 * - Large question evaluation
 * - Correct, incorrect, and unanswered counts
 * - Exact score calculation and pass/fail determination
 * 
 * Invariants:
 * - correctCount + incorrectCount + unansweredCount === totalQuestions
 * - totalScore === sum(marksObtained for each question)
 */

export interface QuestionGrading {
  questionId: string;
  questionOrder: number;
  questionType: 'mcq' | 'scenario' | 'large';
  isAnswered: boolean;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  textAnswer: string | null;
}

export interface ExamEvaluation {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  questionGradings: QuestionGrading[];
}

export function evaluateExamAttempt(
  attemptQuestions: any[],
  answers: any[],
  options: any[] = [],
  scenarios: any[] = [],
  largeQuestions: any[] = []
): ExamEvaluation {
  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const questionGradings: QuestionGrading[] = [];

  (attemptQuestions || []).forEach((qItem) => {
    const qSnapshot = qItem.question_snapshot || {};
    const qType = (qSnapshot.question_type || 'mcq') as 'mcq' | 'scenario' | 'large';
    const uAns = answers?.find((a) => a.question_id === qItem.question_id);
    const maxMarks = qItem.marks || (qType === 'large' ? 20 : qType === 'scenario' ? 15 : 2);

    let isAnswered = false;
    let isCorrect = false;
    let marksObtained = 0;
    let selectedOptionId: string | null = null;
    let correctOptionId: string | null = null;
    let textAnswer: string | null = uAns?.text_answer || null;

    if (qType === 'mcq') {
      selectedOptionId = uAns?.selected_option_id || null;
      isAnswered = Boolean(selectedOptionId);

      const dbOpts = options.filter((o) => o.question_id === qItem.question_id);
      const opts = dbOpts.length > 0 ? dbOpts : (qSnapshot.options || []);
      const correctOpt = opts.find((o: any) => o.is_correct === true);
      correctOptionId = correctOpt?.id || null;

      if (isAnswered && correctOptionId && selectedOptionId === correctOptionId) {
        isCorrect = true;
        marksObtained = maxMarks;
      }
    } else if (qType === 'scenario') {
      isAnswered = Boolean(textAnswer && textAnswer.trim() !== '' && textAnswer.trim() !== '{}');

      const dbScen = scenarios.find((s) => s.question_id === qItem.question_id);
      const subQuestions = dbScen?.sub_questions || qSnapshot.sub_questions || [];

      if (isAnswered && Array.isArray(subQuestions) && subQuestions.length > 0) {
        let userChoices: Record<string, string> = {};
        try {
          userChoices = JSON.parse(textAnswer!);
        } catch {
          userChoices = {};
        }

        const totalSubs = subQuestions.length;
        const marksPerSub = maxMarks / totalSubs;
        let correctSubs = 0;

        subQuestions.forEach((sq: any) => {
          const uVal = userChoices[sq.id];
          if (uVal && sq.correct_answer && uVal.trim().toUpperCase() === sq.correct_answer.trim().toUpperCase()) {
            correctSubs++;
          }
        });

        marksObtained = Math.round(correctSubs * marksPerSub * 100) / 100;
        isCorrect = correctSubs === totalSubs;
      }
    } else if (qType === 'large') {
      isAnswered = Boolean(textAnswer && textAnswer.trim() !== '');

      const dbLarge = largeQuestions.find((l) => l.question_id === qItem.question_id);
      const qData = dbLarge?.question_data || qSnapshot.question_data;

      if (isAnswered && textAnswer) {
        const solutionKey = qData?.solution_key ? String(qData.solution_key).toLowerCase() : '';
        const userText = textAnswer.toLowerCase();

        if (solutionKey && (userText.includes(solutionKey) || solutionKey.includes(userText))) {
          marksObtained = maxMarks;
        } else if (textAnswer.trim().length > 50) {
          marksObtained = Math.round(maxMarks * 0.75);
        } else if (textAnswer.trim().length > 30) {
          marksObtained = Math.round(maxMarks * 0.7);
        }

        isCorrect = marksObtained >= (maxMarks * 0.5);
      }
    }

    if (!isAnswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    totalScore += marksObtained;

    questionGradings.push({
      questionId: qItem.question_id,
      questionOrder: qItem.question_order,
      questionType: qType,
      isAnswered,
      isCorrect,
      marksObtained,
      maxMarks,
      selectedOptionId,
      correctOptionId,
      textAnswer,
    });
  });

  const totalMarks = (attemptQuestions || []).reduce((acc, q) => acc + (q.marks || 2), 0) || 100;
  const percentage = Math.round((totalScore / totalMarks) * 100);
  const isPassed = totalScore >= (totalMarks * 0.5);

  return {
    totalQuestions: (attemptQuestions || []).length,
    answeredCount: correctCount + incorrectCount,
    unansweredCount,
    correctCount,
    incorrectCount,
    totalScore,
    totalMarks,
    percentage,
    isPassed,
    questionGradings,
  };
}

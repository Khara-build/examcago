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

/**
 * Safe numeric normalization for exact numerical matching.
 * Normalizes input by:
 * - Trimming whitespace
 * - Removing thousands separator commas (e.g. "55,000" -> "55000")
 * - Validating that both operands are valid standard decimal numbers
 * - Performing exact equality check without tolerance (no epsilon / no delta)
 */
export function isExactNumericMatch(userVal: any, correctVal: any): boolean {
  if (userVal === undefined || userVal === null || correctVal === undefined || correctVal === null) {
    return false;
  }

  const cleanUser = String(userVal).trim().replace(/,/g, '');
  const cleanCorrect = String(correctVal).trim().replace(/,/g, '');

  if (cleanUser === '' || cleanCorrect === '') {
    return false;
  }

  // Accept valid integer or decimal numbers with optional sign
  const numericPattern = /^-?\d+(\.\d+)?$/;
  if (!numericPattern.test(cleanUser) || !numericPattern.test(cleanCorrect)) {
    return false;
  }

  const userNum = Number(cleanUser);
  const correctNum = Number(cleanCorrect);

  if (isNaN(userNum) || isNaN(correctNum)) {
    return false;
  }

  return userNum === correctNum;
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

        let totalEarned = 0;
        let correctCountSubs = 0;

        subQuestions.forEach((sq: any, sIdx: number) => {
          const uVal = userChoices[sq.id];
          const correctKey = sq.correct_answer ? String(sq.correct_answer).trim().toUpperCase() : '';
          // Task 1 = 3 marks, Tasks 2-7 = 2 marks (total 15 marks) if marks not explicitly specified
          const subMarks = typeof sq.marks === 'number' ? sq.marks : (sIdx === 0 ? 3 : 2);

          if (uVal && correctKey && String(uVal).trim().toUpperCase() === correctKey) {
            totalEarned += subMarks;
            correctCountSubs++;
          }
        });

        marksObtained = Math.min(maxMarks, totalEarned);
        isCorrect = correctCountSubs === subQuestions.length;
      }
    } else if (qType === 'large') {
      isAnswered = Boolean(textAnswer && textAnswer.trim() !== '' && textAnswer.trim() !== '{}');

      const dbLarge = largeQuestions.find((l) => l.question_id === qItem.question_id);
      const qData = dbLarge?.question_data || qSnapshot.question_data || {};
      const fields = qData.fields || [];

      if (isAnswered && textAnswer) {
        if (Array.isArray(fields) && fields.length > 0) {
          // Structured numerical answer fields
          let userValues: Record<string, any> = {};
          try {
            userValues = JSON.parse(textAnswer);
          } catch {
            userValues = {};
          }

          let totalEarned = 0;
          let correctFieldsCount = 0;

          fields.forEach((f: any) => {
            const rawUserVal = userValues[f.id];
            const fieldMarks = typeof f.marks === 'number' ? f.marks : 2;

            if (isExactNumericMatch(rawUserVal, f.correct_value)) {
              totalEarned += fieldMarks;
              correctFieldsCount++;
            }
          });

          marksObtained = Math.min(maxMarks, totalEarned);
          isCorrect = correctFieldsCount === fields.length;
        } else {
          // Fallback legacy exact solution key matching
          const solutionKey = qData?.solution_key ? String(qData.solution_key).trim().toLowerCase() : '';
          const cleanText = textAnswer.trim().toLowerCase();
          if (solutionKey && cleanText === solutionKey) {
            marksObtained = maxMarks;
            isCorrect = true;
          } else {
            marksObtained = 0;
            isCorrect = false;
          }
        }
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

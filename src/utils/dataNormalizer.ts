import { QuestionItem, SubStatement, RubricStep } from '../types/exam';

/**
 * Ensures a value is a string. If it's an object/array, stringifies it.
 */
export function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Normalizes a list of questions from raw AI output to strict QuestionItem format.
 * Prevents "Objects are not valid as a React child" and "cannot read map of undefined".
 */
export function normalizeExamQuestions(rawQuestions: any[]): QuestionItem[] {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions.map((q, index) => {
    const id = q.id || `q_norm_${Date.now()}_${index}`;
    
    // Normalize Options (ensure array of strings)
    let normalizedOptions: string[] = [];
    if (Array.isArray(q.options)) {
      normalizedOptions = q.options.map(safeString);
    } else if (typeof q.options === 'object' && q.options !== null) {
      // Handle {A: "...", B: "..."}
      normalizedOptions = Object.entries(q.options)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, val]) => `${key}. ${safeString(val)}`);
    }

    // Normalize SubItems (for True/False groups)
    let normalizedSubItems: SubStatement[] = [];
    if (Array.isArray(q.subItems)) {
      normalizedSubItems = q.subItems.map((s: any, sIdx: number) => ({
        id: s.id || `sub_${sIdx}`,
        label: (s.label || ['a', 'b', 'c', 'd'][sIdx] || 'a') as any,
        statement: safeString(s.statement),
        isCorrect: !!s.isCorrect,
        explanation: safeString(s.explanation)
      }));
    }

    // Normalize Rubric (for Essays)
    let normalizedRubric: RubricStep[] = [];
    if (Array.isArray(q.rubric)) {
      normalizedRubric = q.rubric.map((r: any, rIdx: number) => ({
        step: safeString(r.step || `Bước ${rIdx + 1}`),
        point: Number(r.point) || 0,
        detail: safeString(r.detail)
      }));
    }

    return {
      ...q,
      id,
      part: (['part1', 'part2', 'part3', 'part4'].includes(q.part) ? q.part : 'part1') as any,
      type: q.type || 'mcq_single',
      level: safeString(q.level || 'Nhận biết'),
      topic: safeString(q.topic || ''),
      question: safeString(q.question),
      options: normalizedOptions,
      subItems: normalizedSubItems.length > 0 ? normalizedSubItems : undefined,
      correctAnswer: typeof q.correctAnswer === 'object' ? safeString(q.correctAnswer) : q.correctAnswer,
      explanation: safeString(q.explanation),
      rubric: normalizedRubric.length > 0 ? normalizedRubric : undefined,
      score: Number(q.score) || 0.25,
      distractorAnalysis: typeof q.distractorAnalysis === 'object' ? q.distractorAnalysis : undefined
    };
  });
}

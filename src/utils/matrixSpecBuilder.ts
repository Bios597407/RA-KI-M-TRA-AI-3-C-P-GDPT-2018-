import { QuestionItem, ExamConfig, ExamMatrix, ExamSpecificationRow } from '../types/exam';

export function getCognitiveLevelsList(config: ExamConfig): string[] {
  if (config.gradeLevel === 'primary') {
    return ['Mức 1', 'Mức 2', 'Mức 3'];
  }
  if (config.cognitiveSystem === 'secondary_3') {
    return ['Biết', 'Hiểu', 'Vận dụng'];
  }
  return ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
}

/**
 * Builds the Exam Matrix table directly from the generated questions
 */
export function buildExamMatrix(questions: QuestionItem[], config: ExamConfig): ExamMatrix {
  const levels = getCognitiveLevelsList(config);

  // Group questions by Topic
  const topicMap = new Map<string, QuestionItem[]>();
  questions.forEach((q) => {
    const topicKey = q.topic || config.topicTitle || 'Chủ đề trọng tâm';
    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, []);
    }
    topicMap.get(topicKey)!.push(q);
  });

  const totalScoreGoal = config.totalScore || 10;
  const rows = Array.from(topicMap.entries()).map(([topic, qList]) => {
    const part1: Record<string, number> = {};
    const part2: Record<string, number> = {};
    const part3: Record<string, number> = {};
    const part4: Record<string, number> = {};

    levels.forEach((lvl) => {
      part1[lvl] = 0;
      part2[lvl] = 0;
      part3[lvl] = 0;
      part4[lvl] = 0;
    });

    let rowScore = 0;

    qList.forEach((q) => {
      const lvl = levels.find((l) => q.level.toLowerCase().includes(l.toLowerCase())) || levels[0];
      rowScore += q.score || 0;

      if (q.part === 'part1' || q.type === 'mcq_single') {
        part1[lvl] = (part1[lvl] || 0) + 1;
      } else if (q.part === 'part2' || q.type === 'true_false_group') {
        part2[lvl] = (part2[lvl] || 0) + 1;
      } else if (q.part === 'part3' || q.type === 'short_answer') {
        part3[lvl] = (part3[lvl] || 0) + 1;
      } else {
        part4[lvl] = (part4[lvl] || 0) + 1;
      }
    });

    const totalQuestions = qList.length;
    const roundedScore = Number(rowScore.toFixed(2));
    const percent = Math.round((roundedScore / totalScoreGoal) * 100);

    return {
      topic,
      subTopic: qList[0]?.subTopic || '',
      part1,
      part2,
      part3,
      part4,
      totalQuestions,
      totalScore: roundedScore,
      percent,
    };
  });

  // Calculate totals by level
  const totalByLevel: Record<string, { count: number; score: number; percent: number }> = {};
  levels.forEach((lvl) => {
    let count = 0;
    let score = 0;

    questions.forEach((q) => {
      const matchLevel = levels.find((l) => q.level.toLowerCase().includes(l.toLowerCase())) || levels[0];
      if (matchLevel === lvl) {
        count += 1;
        score += q.score || 0;
      }
    });

    const roundedScore = Number(score.toFixed(2));
    totalByLevel[lvl] = {
      count,
      score: roundedScore,
      percent: Math.round((roundedScore / totalScoreGoal) * 100),
    };
  });

  const totalQuestions = questions.length;
  const grandTotalScore = Number(questions.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2));
  const grandTotalPercent = 100;

  return {
    levels,
    rows,
    totalByLevel,
    grandTotal: {
      count: totalQuestions,
      score: grandTotalScore,
      percent: grandTotalPercent,
    },
  };
}

/**
 * Builds the Specification table for the Exam
 */
export function buildExamSpecification(questions: QuestionItem[], config: ExamConfig): ExamSpecificationRow[] {
  const specRows: ExamSpecificationRow[] = [];

  // Group by topic & competency
  const groups = new Map<string, QuestionItem[]>();
  questions.forEach((q) => {
    const key = `${q.topic || 'Chủ đề'}___${q.level || 'Biết'}___${q.part || 'part1'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(q);
  });

  let stt = 1;
  groups.forEach((qList) => {
    const firstQ = qList[0];
    const totalScore = Number(qList.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2));

    let typeLabel = 'Trắc nghiệm nhiều lựa chọn';
    if (firstQ.type === 'true_false_group') typeLabel = 'Trắc nghiệm Đúng/Sai (4 lệnh hỏi)';
    else if (firstQ.type === 'short_answer') typeLabel = 'Trắc nghiệm Trả lời ngắn';
    else if (firstQ.type === 'essay') typeLabel = 'Tự luận';
    else if (firstQ.type === 'matching') typeLabel = 'Nối cột';
    else if (firstQ.type === 'fill_blank') typeLabel = 'Điền khuyết';

    let competency = config.learningOutcomes || '';
    if (!competency) {
      if (firstQ.level.includes('Nhận biết') || firstQ.level.includes('Mức 1') || firstQ.level.includes('Biết')) {
        competency = `Nhận biết và nhắc lại được các khái niệm, định nghĩa, quy tắc cơ bản của ${firstQ.topic}.`;
      } else if (firstQ.level.includes('Thông hiểu') || firstQ.level.includes('Mức 2') || firstQ.level.includes('Hiểu')) {
        competency = `Giải thích, phân biệt, suy luận và biểu diễn được các đại lượng, quan hệ trong ${firstQ.topic}.`;
      } else if (firstQ.level.includes('Vận dụng cao')) {
        competency = `Vận dụng sáng tạo kiến thức ${firstQ.topic} để giải quyết bài toán phức tạp, mô hình hóa thực tế liên môn.`;
      } else {
        competency = `Vận dụng được các định lý, công thức ${firstQ.topic} vào giải bài tập và tình huống thực tiễn điển hình.`;
      }
    }

    specRows.push({
      id: `spec-${stt}`,
      stt: stt++,
      topic: firstQ.topic || config.topicTitle || 'Chủ đề kiến thức',
      subTopic: firstQ.subTopic || '',
      competency,
      level: firstQ.level,
      questionType: typeLabel,
      questionCount: qList.length,
      questionIds: qList.map((q) => q.id),
      score: totalScore,
    });
  });

  return specRows;
}

import { QuestionItem, ExamConfig, ExamMatrix, ExamSpecificationRow, ExamMatrixRow } from '../types/exam';

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
 * If questions list is empty, seamlessly builds the planned matrix from config!
 */
export function buildExamMatrix(questions: QuestionItem[], config: ExamConfig): ExamMatrix {
  if (!questions || questions.length === 0) {
    return buildPlannedMatrixFromConfig(config);
  }

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
  const rows: ExamMatrixRow[] = Array.from(topicMap.entries()).map(([topic, qList]) => {
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
 * Builds the planned Exam Matrix table directly from the exam configuration (BEFORE question generation)
 */
export function buildPlannedMatrixFromConfig(config: ExamConfig): ExamMatrix {
  const levels = getCognitiveLevelsList(config);
  const totalScoreGoal = config.totalScore || 10;

  // Extract or synthesize 2-3 topics
  const baseTitle = config.topicTitle || `${config.subject || 'Môn học'} ${config.grade ? `Lớp ${config.grade}` : ''}`;
  const rawTopics = (config.knowledgeScope || config.topicTitle || '')
    .split(/[,;\n•\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  let topics: string[] = [];
  if (rawTopics.length >= 2) {
    topics = rawTopics.slice(0, 3);
  } else {
    topics = [
      `${baseTitle} – Khái niệm, nhận biết cơ bản`,
      `${baseTitle} – Phương pháp giải & kỹ năng tính toán`,
      `${baseTitle} – Vận dụng bài toán thực tiễn`,
    ];
  }

  const p1 = config.sectionCounts.part1 || 0;
  const p2 = config.sectionCounts.part2 || 0;
  const p3 = config.sectionCounts.part3 || 0;
  const p4 = config.sectionCounts.part4 || 0;

  const totalQuestions = p1 + p2 + p3 + p4;

  // Question points
  const p1ScorePerQ = 0.25;
  const p2ScorePerQ = 1.0;
  const p3ScorePerQ = 0.5;

  let fixedScore = p1 * p1ScorePerQ + p2 * p2ScorePerQ + p3 * p3ScorePerQ;
  let p4ScorePerQ = p4 > 0 ? Number(((totalScoreGoal - fixedScore) / p4).toFixed(2)) : 0;
  if (p4ScorePerQ < 0.5 && p4 > 0) p4ScorePerQ = 1.0;

  // Cognitive distribution ratios
  const dist = config.cognitiveDist || {};
  const totalDist = Object.values(dist).reduce((s, v) => s + v, 0) || 100;

  const rows: ExamMatrixRow[] = topics.map((topic, tIdx) => {
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

    const topicShare = 1 / topics.length;

    // Distribute Part 1 (MCQ - usually weighted towards lower/middle cognitive levels)
    const topicP1 = Math.round(p1 * topicShare) + (tIdx === 0 ? p1 - Math.round(p1 * topicShare) * topics.length : 0);
    if (levels.length === 3) {
      part1[levels[0]] = Math.round(topicP1 * 0.5);
      part1[levels[1]] = Math.round(topicP1 * 0.35);
      part1[levels[2]] = Math.max(0, topicP1 - part1[levels[0]] - part1[levels[1]]);
    } else {
      part1[levels[0]] = Math.round(topicP1 * 0.45);
      part1[levels[1]] = Math.round(topicP1 * 0.35);
      part1[levels[2]] = Math.round(topicP1 * 0.15);
      part1[levels[3]] = Math.max(0, topicP1 - part1[levels[0]] - part1[levels[1]] - part1[levels[2]]);
    }

    // Distribute Part 2 (True/False 4 items)
    const topicP2 = Math.round(p2 * topicShare) + (tIdx === 0 ? p2 - Math.round(p2 * topicShare) * topics.length : 0);
    if (levels.length === 3) {
      part2[levels[0]] = Math.round(topicP2 * 0.4);
      part2[levels[1]] = Math.round(topicP2 * 0.4);
      part2[levels[2]] = Math.max(0, topicP2 - part2[levels[0]] - part2[levels[1]]);
    } else {
      part2[levels[0]] = Math.round(topicP2 * 0.3);
      part2[levels[1]] = Math.round(topicP2 * 0.4);
      part2[levels[2]] = Math.round(topicP2 * 0.2);
      part2[levels[3]] = Math.max(0, topicP2 - part2[levels[0]] - part2[levels[1]] - part2[levels[2]]);
    }

    // Distribute Part 3 (Short answer - weighted towards application)
    const topicP3 = Math.round(p3 * topicShare) + (tIdx === 0 ? p3 - Math.round(p3 * topicShare) * topics.length : 0);
    if (levels.length === 3) {
      part3[levels[0]] = 0;
      part3[levels[1]] = Math.round(topicP3 * 0.4);
      part3[levels[2]] = Math.max(0, topicP3 - part3[levels[1]]);
    } else {
      part3[levels[0]] = 0;
      part3[levels[1]] = Math.round(topicP3 * 0.3);
      part3[levels[2]] = Math.round(topicP3 * 0.45);
      part3[levels[3]] = Math.max(0, topicP3 - part3[levels[1]] - part3[levels[2]]);
    }

    // Distribute Part 4 (Essay)
    const topicP4 = Math.round(p4 * topicShare) + (tIdx === 0 ? p4 - Math.round(p4 * topicShare) * topics.length : 0);
    if (levels.length === 3) {
      part4[levels[1]] = Math.round(topicP4 * 0.4);
      part4[levels[2]] = Math.max(0, topicP4 - part4[levels[1]]);
    } else {
      part4[levels[1]] = Math.round(topicP4 * 0.3);
      part4[levels[2]] = Math.round(topicP4 * 0.4);
      part4[levels[3]] = Math.max(0, topicP4 - part4[levels[1]] - part4[levels[2]]);
    }

    // Total question count for row
    const rowQuestions = topicP1 + topicP2 + topicP3 + topicP4;
    const rowScore = Number(
      (topicP1 * p1ScorePerQ + topicP2 * p2ScorePerQ + topicP3 * p3ScorePerQ + topicP4 * p4ScorePerQ).toFixed(2)
    );
    const rowPercent = Math.round((rowScore / totalScoreGoal) * 100);

    return {
      topic,
      subTopic: `Mạch kiến thức trọng tâm ${tIdx + 1}`,
      part1,
      part2,
      part3,
      part4,
      totalQuestions: rowQuestions,
      totalScore: rowScore,
      percent: rowPercent,
    };
  });

  // Calculate totals by level
  const totalByLevel: Record<string, { count: number; score: number; percent: number }> = {};
  levels.forEach((lvl) => {
    let count = 0;
    let score = 0;

    rows.forEach((row) => {
      const p1C = row.part1[lvl] || 0;
      const p2C = row.part2[lvl] || 0;
      const p3C = row.part3[lvl] || 0;
      const p4C = row.part4[lvl] || 0;

      count += p1C + p2C + p3C + p4C;
      score += p1C * p1ScorePerQ + p2C * p2ScorePerQ + p3C * p3ScorePerQ + p4C * p4ScorePerQ;
    });

    const roundedScore = Number(score.toFixed(2));
    totalByLevel[lvl] = {
      count,
      score: roundedScore,
      percent: Math.round((roundedScore / totalScoreGoal) * 100),
    };
  });

  const grandTotalScore = Number(rows.reduce((sum, r) => sum + r.totalScore, 0).toFixed(2));

  return {
    levels,
    rows,
    totalByLevel,
    grandTotal: {
      count: totalQuestions,
      score: grandTotalScore || totalScoreGoal,
      percent: 100,
    },
  };
}

/**
 * Builds the Specification table for the Exam
 * If questions list is empty, seamlessly builds the planned specification from config!
 */
export function buildExamSpecification(questions: QuestionItem[], config: ExamConfig): ExamSpecificationRow[] {
  if (!questions || questions.length === 0) {
    return buildPlannedSpecificationFromConfig(config);
  }

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

/**
 * Builds the planned Specification table directly from the exam configuration (BEFORE question generation)
 */
export function buildPlannedSpecificationFromConfig(config: ExamConfig): ExamSpecificationRow[] {
  const plannedMatrix = buildPlannedMatrixFromConfig(config);
  const specRows: ExamSpecificationRow[] = [];
  let stt = 1;

  plannedMatrix.rows.forEach((row) => {
    plannedMatrix.levels.forEach((lvl) => {
      // Check each part
      const p1Count = row.part1[lvl] || 0;
      const p2Count = row.part2[lvl] || 0;
      const p3Count = row.part3[lvl] || 0;
      const p4Count = row.part4[lvl] || 0;

      const makeCompetency = (levelName: string, topicName: string, partName: string) => {
        if (config.learningOutcomes && config.learningOutcomes.length > 10) {
          return `${config.learningOutcomes} (Mức độ: ${levelName} – ${partName})`;
        }
        if (config.gradeLevel === 'primary') {
          if (levelName.includes('Mức 1')) {
            return `Nhận biết, nhắc lại và gọi tên được các kiến thức cơ bản về ${topicName}.`;
          } else if (levelName.includes('Mức 2')) {
            return `Kết nối, so sánh và thực hiện thao tác giải quyết tình huống quen thuộc về ${topicName}.`;
          } else {
            return `Vận dụng kiến thức, kỹ năng giải quyết tình huống mới trong học tập và đời sống về ${topicName}.`;
          }
        } else {
          if (levelName.includes('Nhận biết') || levelName.includes('Biết')) {
            return `Nhận biết và phát biểu chính xác định nghĩa, tính chất, quy tắc cơ bản của ${topicName}.`;
          } else if (levelName.includes('Thông hiểu') || levelName.includes('Hiểu')) {
            return `Hiểu rõ bản chất, giải thích, phân loại và tính toán các bài toán tường minh về ${topicName}.`;
          } else if (levelName.includes('Vận dụng cao')) {
            return `Vận dụng sáng tạo, liên hệ thực tiễn và mô hình hóa giải quyết bài toán phức tạp về ${topicName}.`;
          } else {
            return `Vận dụng kiến thức, phương pháp và công thức đã học để giải quyết bài toán điển hình về ${topicName}.`;
          }
        }
      };

      if (p1Count > 0) {
        specRows.push({
          id: `spec-${stt}`,
          stt: stt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeCompetency(lvl, row.topic, 'Trắc nghiệm 4 lựa chọn'),
          level: lvl,
          questionType: 'Trắc nghiệm nhiều lựa chọn',
          questionCount: p1Count,
          questionIds: [],
          score: Number((p1Count * 0.25).toFixed(2)),
        });
      }

      if (p2Count > 0) {
        specRows.push({
          id: `spec-${stt}`,
          stt: stt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeCompetency(lvl, row.topic, 'Trắc nghiệm Đúng/Sai 4 ý'),
          level: lvl,
          questionType: 'Trắc nghiệm Đúng/Sai (4 lệnh hỏi)',
          questionCount: p2Count,
          questionIds: [],
          score: Number((p2Count * 1.0).toFixed(2)),
        });
      }

      if (p3Count > 0) {
        specRows.push({
          id: `spec-${stt}`,
          stt: stt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeCompetency(lvl, row.topic, 'Trắc nghiệm Trả lời ngắn'),
          level: lvl,
          questionType: 'Trắc nghiệm Trả lời ngắn',
          questionCount: p3Count,
          questionIds: [],
          score: Number((p3Count * 0.5).toFixed(2)),
        });
      }

      if (p4Count > 0) {
        const p4UnitScore = Number(((config.totalScore || 10) * 0.2 / p4Count).toFixed(2)) || 1.0;
        specRows.push({
          id: `spec-${stt}`,
          stt: stt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeCompetency(lvl, row.topic, 'Tự luận'),
          level: lvl,
          questionType: 'Câu hỏi Tự luận',
          questionCount: p4Count,
          questionIds: [],
          score: Number((p4Count * p4UnitScore).toFixed(2)),
        });
      }
    });
  });

  return specRows;
}

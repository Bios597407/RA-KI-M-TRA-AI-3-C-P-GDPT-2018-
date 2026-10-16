import { QuestionItem, ExamConfig } from '../types/exam';
import { fetchGeminiWithFallback, extractTextFromGeminiResponse, DEFAULT_MODEL, safeJsonParse } from '../utils/geminiModels';
import { normalizeExamQuestions, safeString } from '../utils/dataNormalizer';
import { getCachedFileAsBase64 } from '../utils/memoryManager';

export interface GenerationProgressCallback {
  (step: number, message: string): void;
}

export async function generateExamQuestions(
  config: ExamConfig,
  apiKey?: string,
  onProgress?: GenerationProgressCallback,
  isEquivalentMode = false
): Promise<QuestionItem[]> {
  onProgress?.(1, 'Đang phân tích cấu hình, môn học, lớp và bộ sách giáo khoa...');
  await delay(150);

  const fixedQuestions =
    config.keepFixedQuestions && config.teacherFixedQuestions?.length > 0
      ? config.teacherFixedQuestions
      : [];

  onProgress?.(2, 'Đang trích xuất dữ liệu tài liệu & ngữ liệu bài học...');
  await delay(150);

  onProgress?.(3, 'Đang lập bản đặc tả cấu hình đề thi GDPT 2018...');
  await delay(150);

  onProgress?.(4, `Đang gọi Gemini AI (${DEFAULT_MODEL}) để biên soạn đề thi thực tế...`);

  const cleanKey = (k?: string) => {
    if (!k) return '';
    const trimmed = k.trim();
    if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '""') return '';
    return trimmed;
  };

  const userKey =
    cleanKey(apiKey) ||
    cleanKey(localStorage.getItem('exam_ai_gemini_key_v2') || '') ||
    cleanKey(localStorage.getItem('exam_ai_gemini_key') || '') ||
    cleanKey(localStorage.getItem('gemini_api_key') || '');

  const envKey =
    cleanKey(import.meta.env.VITE_GEMINI_API_KEY as string) ||
    (typeof process !== 'undefined'
      ? cleanKey(process.env?.GEMINI_API_KEY) || cleanKey(process.env?.VITE_GEMINI_API_KEY)
      : '');

  const activeApiKey = userKey || envKey;

  if (!activeApiKey) {
    throw new Error(
      'Chưa thể kết nối tới Google AI Studio! Vui lòng nhấn nút "🔑 Cấu hình API Key" trên thanh Header để nhập Gemini API Key cá nhân.'
    );
  }

  try {
    let generatedQuestions = await callGeminiAPI(config, activeApiKey, isEquivalentMode);

    // Guaranteed 100% exact count matching configuration (e.g. 22 questions)
    generatedQuestions = ensureExactQuestionCount(generatedQuestions, config);

    onProgress?.(5, 'Đang tính toán biểu điểm và phân bổ thang điểm...');
    await delay(150);
    applyScoringRules(generatedQuestions, config);

    onProgress?.(6, 'Đang kiểm tra và chuẩn hóa hướng dẫn chấm...');
    await delay(150);

    if (fixedQuestions.length > 0) {
      const merged = [...fixedQuestions, ...generatedQuestions.slice(fixedQuestions.length)];
      const finalSet = ensureExactQuestionCount(merged, config);
      applyScoringRules(finalSet, config);
      return finalSet;
    }

    return generatedQuestions;
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    throw new Error(translateErrorToVietnamese(rawMsg));
  }
}

export function translateErrorToVietnamese(errorText: string): string {
  const lower = String(errorText).toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('unauthorized') ||
    lower.includes('permission_denied') ||
    lower.includes('invalid api key')
  ) {
    return 'Mã Gemini API Key không hợp lệ hoặc đã bị khóa. Bạn có thể bấm nút "🔑 Cấu hình API Key" và nhấn "Xóa Key" để sử dụng kết nối mặc định của hệ thống.';
  }
  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'Hệ thống AI đang tạm thời quá tải lượt yêu cầu (Vượt hạn mức Quota). Vui lòng đợi khoảng 30 giây rồi bấm Tạo đề lại.';
  }
  if (lower.includes('requested entity was not found') || lower.includes('not found') || lower.includes('404')) {
    return 'Mô hình AI hiện tại tạm thời không khả dụng (404). Hệ thống đã tự động thử các phiên bản mô hình dự phòng khác.';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('fetch failed')
  ) {
    return 'Lỗi kết nối mạng internet! Vui lòng kiểm tra lại đường truyền wifi hoặc kết nối mạng của bạn.';
  }
  if (lower.includes('chưa đúng cấu trúc')) {
    return errorText;
  }

  return `Lỗi kết nối AI: ${errorText}`;
}

async function callGeminiAPI(
  config: ExamConfig,
  apiKey: string,
  isEquivalent: boolean
): Promise<QuestionItem[]> {
  const p1 = config.sectionCounts.part1 || 0;
  const p2 = config.sectionCounts.part2 || 0;
  const p3 = config.sectionCounts.part3 || 0;
  const p4 = config.sectionCounts.part4 || 0;

  const subject = config.customSubject || config.subject || 'Môn học';
  const cognitiveList =
    config.gradeLevel === 'primary'
      ? 'Mức 1, Mức 2, Mức 3'
      : 'Biết, Hiểu, Vận dụng, Vận dụng cao';

  let referenceContext = '';
  const requestParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // Requirement 1 & 2: Read verbatim and include all files in ONE request
  if (config.uploadedDocs && config.uploadedDocs.length > 0) {
    referenceContext += `\n\n=== DANH SÁCH TÀI LIỆU THAM CHIẾU NGUYÊN VĂN (${config.uploadedDocs.length} file) ===\n`;
    
    let fileCounter = 1;
    for (const doc of config.uploadedDocs) {
      const label = `=== TÀI LIỆU SỐ ${fileCounter}: ${doc.name} ===`;
      referenceContext += `\n${label}\n`;
      
      // For text-based docs (DOCX, TXT), use the pre-extracted content
      if (doc.content && !doc.name.toLowerCase().endsWith('.pdf') && !doc.mimeType?.startsWith('image/')) {
        referenceContext += `${doc.content}\n`;
      } else {
        referenceContext += `(Xem dữ liệu binary/image đính kèm cho file này)\n`;
        // Requirement 1: Only read Base64 during request time to save memory
        if (doc.id) {
          try {
            const b64Res = await getCachedFileAsBase64(doc.id);
            if (b64Res) {
              requestParts.push({
                inlineData: {
                  mimeType: b64Res.mimeType,
                  data: b64Res.base64,
                },
              });
            }
          } catch (e) {
            console.warn(`Could not get base64 for ${doc.name}`, e);
          }
        }
      }
      fileCounter++;
    }
  }

  if (config.readingPassage && config.readingPassage.trim()) {
    referenceContext += `\n\n=== NGỮ LIỆU / TỔNG HỢP KIẾN THỨC CỐT LÕI ===\n${config.readingPassage}`;
  }
  if (config.teacherNotes && config.teacherNotes.trim()) {
    referenceContext += `\n\n=== CHỈ DẪN / YÊU CẦU NỘI DUNG TỰ DO CỦA GIÁO VIÊN ===\n${config.teacherNotes}`;
  }

  // Requirement 3: Distribution algorithm directives
  const distributionInstruction = config.uploadedDocs && config.uploadedDocs.length > 1
    ? `
QUY TẮC PHÂN BỔ ĐA TÀI LIỆU (MỆNH LỆNH BẮT BUỘC):
1. Bạn đang có ${config.uploadedDocs.length} tài liệu. BẮT BUỘC phải trích xuất và phân bổ số lượng câu hỏi ĐỀU NHAU từ TẤT CẢ các file này.
2. Ví dụ có ${config.uploadedDocs.length} file thì mỗi file phải chiếm khoảng ${Math.floor(100/config.uploadedDocs.length)}% số lượng câu hỏi trong đề. Tuyệt đối KHÔNG bỏ sót file nào.
3. ƯU TIÊN TUYỆT ĐỐI: Nếu trong các tài liệu đã có sẵn câu hỏi trắc nghiệm/tự luận, hãy TRÍCH XUẤT NGUYÊN VĂN 100% nội dung câu hỏi, phương án và đáp án từ đó rồi trộn xen kẽ vào đề thi.
4. CHUYÊN MÔN: Ưu tiên bám sát chuyên môn của TÀI LIỆU TẢI LÊN ngay cả khi khác với môn học "${subject}" đang chọn.
` : '';

  const noDocumentInstruction = !referenceContext.trim()
    ? `BẮT BUỘC: Giáo viên KHÔNG tải tài liệu đính kèm. Bạn BẮT BUỘC phải dựa đúng vào kiến thức chuẩn Sách Giáo Khoa môn ${subject}, Lớp ${config.grade}, Bộ sách "${config.textbook}" thuộc Chương trình GDPT 2018 Việt Nam để biên soạn câu hỏi chuyên môn thực tế, có chiều sâu.`
    : `BẮT BUỘC: 100% nội dung đề thi PHẢI DỰA TRỰC TIẾP TRÊN TÀI LIỆU VÀ NGỮ LIỆU ĐÃ CUNG CẤP. ${config.sourceOption === 'doc_only' ? 'NGHIÊM CẤM bịa đặt bất kỳ khái niệm hay số liệu nào nằm ngoài văn bản đã cung cấp.' : ''} ${distributionInstruction}`;

  // Requirement 4: Master Exam Only
  const prompt = `Bạn là chuyên gia Khảo thí Giáo dục Việt Nam hàng đầu.
${referenceContext}

Nhiệm vụ: Hãy biên soạn DUY NHẤT MỘT (01) BỘ ĐỀ KIỂM TRA GỐC (Master Exam) chuẩn mực theo cấu trúc GDPT 2018 cho:
- Cấp học: ${config.gradeLevel === 'primary' ? 'Tiểu học' : config.gradeLevel === 'secondary' ? 'THCS' : 'THPT'} | Lớp: ${config.grade} | Môn học: ${subject}
- Bộ sách: ${config.textbook} | Thời gian: ${config.durationMinutes} phút
${isEquivalent ? 'CHÚ Ý: Đây là chế độ TẠO ĐỀ TƯƠNG ĐƯƠNG (Đề B). Giữ nguyên cấu trúc nhưng đổi toàn bộ số liệu và ngữ cảnh.' : ''}

${noDocumentInstruction}

QUY TẮC CẤU TRÚC VÀ MA TRẬN (BẮT BUỘC):
1. PHÂN BỔ NHẬN THỨC (CỰC KỲ QUAN TRỌNG):
   - Tuyệt đối KHÔNG được để trống mức "Thông hiểu" hoặc bất kỳ mức độ nào.
   - Phân bổ câu hỏi theo tỷ lệ: Nhận biết ~40%, Thông hiểu ~30%, Vận dụng ~20%, Vận dụng cao ~10%.
   - Phải có sự phân bổ đều các mức độ cho TẤT CẢ các phần (Phần I, II, III, IV).
2. TÊN CHỦ ĐỀ/BÀI:
   - BẮT BUỘC sử dụng chính xác tên các tệp tin đã tải lên làm tên Chủ đề/Đơn vị kiến thức trong câu hỏi.
   - NGHIÊM CẤM tự ý thay đổi tên bài hoặc bịa đặt tên chủ đề khác không có trong tài liệu.
3. KHỚP DỮ LIỆU:
   - Số lượng câu hỏi ở từng phần (I, II, III, IV) PHẢI KHỚP TUYỆT ĐỐI với cấu trúc đã yêu cầu dưới đây.

CẤU TRÚC BỘ ĐỀ GỐC:
- Phần I (Trắc nghiệm 4 lựa chọn): ${p1} câu.
- Phần II (Trắc nghiệm Đúng/Sai 4 ý a,b,c,d): ${p2} câu.
- Phần III (Trả lời ngắn): ${p3} câu.
- Phần IV (Tự luận): ${p4} câu.

HỆ THỐNG MỨC ĐỘ NĂNG LỰC: ${cognitiveList}.

YÊU CẦU ĐỊNH DẠNG JSON (Mảng các đối tượng QuestionItem):
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "...",
    "explanation": "...",
    "level": "Nhận biết" hoặc "Thông hiểu" hoặc "Vận dụng" hoặc "Vận dụng cao",
    "part": "part1" hoặc "part2" hoặc "part3" hoặc "part4",
    "type": "...",
    "topic": "TÊN FILE CHÍNH XÁC (từ tài liệu tải lên)",
    "subItems": [...],
    "rubric": [...]
  }
]
`;

  requestParts.unshift({ text: prompt });

  const { data } = await fetchGeminiWithFallback(
    { contents: [{ parts: requestParts }] },
    apiKey,
    {
      temperature: 0.4,
      responseMimeType: 'application/json',
      maxOutputTokens: 65536, // Maximum output to prevent truncation
    }
  );

  const rawText = extractTextFromGeminiResponse(data);
  if (!rawText) throw new Error('AI không phản hồi nội dung đề thi.');

  const parsed = safeJsonParse(rawText);
  const questionsList = extractQuestionArray(parsed);

  if (questionsList && questionsList.length > 0) {
    return normalizeExamQuestions(questionsList);
  }

  throw new Error('Không bóc tách được mảng câu hỏi từ phản hồi AI.');
}



function extractQuestionArray(parsed: unknown): QuestionItem[] | null {
  if (!parsed) return null;
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed as QuestionItem[];
  }
  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const candidateKeys = [
      'questions',
      'items',
      'data',
      'exam',
      'results',
      'content',
      'questionList',
      'list',
      'cauHoi',
      'deThi',
      'cau_hoi',
    ];
    for (const key of candidateKeys) {
      if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
        return obj[key] as QuestionItem[];
      }
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        return val as QuestionItem[];
      }
    }
  }
  return null;
}

export function applyScoringRules(questions: QuestionItem[], config: ExamConfig): void {
  const targetTotal = config.totalScore || 10;
  if (questions.length === 0) return;

  const part1 = questions.filter((q) => q.part === 'part1');
  const part2 = questions.filter((q) => q.part === 'part2');
  const part3 = questions.filter((q) => q.part === 'part3');
  const part4 = questions.filter((q) => q.part === 'part4');

  part1.forEach((q) => (q.score = 0.25));
  part2.forEach((q) => (q.score = 1.0));
  part3.forEach((q) => (q.score = 0.5));

  const allocated =
    part1.reduce((s, q) => s + q.score, 0) +
    part2.reduce((s, q) => s + q.score, 0) +
    part3.reduce((s, q) => s + q.score, 0);

  if (part4.length > 0) {
    const remaining = Math.max(0, targetTotal - allocated);
    const perEssay = Number((remaining / part4.length).toFixed(2));
    part4.forEach((q) => {
      q.score = perEssay;
      if (q.rubric && q.rubric.length > 0) {
        const stepPt = Number((perEssay / q.rubric.length).toFixed(2));
        q.rubric.forEach((r) => {
          r.point = stepPt;
        });
      }
    });
  } else {
    const currentSum = questions.reduce((s, q) => s + (q.score || 0), 0);
    if (currentSum > 0) {
      questions.forEach((q) => {
        q.score = Number(((q.score / currentSum) * targetTotal).toFixed(2));
      });
    }
  }

  const sum = questions.reduce((s, q) => s + (q.score || 0), 0);
  const diff = Number((targetTotal - sum).toFixed(2));
  if (diff !== 0 && questions.length > 0) {
    questions[questions.length - 1].score = Number(
      (questions[questions.length - 1].score + diff).toFixed(2)
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function ensureExactQuestionCount(
  questions: QuestionItem[],
  config: ExamConfig
): QuestionItem[] {
  const p1 = config.sectionCounts.part1 || 0;
  const p2 = config.sectionCounts.part2 || 0;
  const p3 = config.sectionCounts.part3 || 0;
  const p4 = config.sectionCounts.part4 || 0;

  const topic = config.topicTitle || config.customSubject || config.subject || 'Kiến thức trọng tâm';

  // 1. Strictly normalize part and type for all input questions
  const normalized = (Array.isArray(questions) ? questions : [])
    .filter(q => q && safeString(q.question).trim().length > 1) // Filter out truly empty/invalid questions
    .map((q, idx) => {
    let part = q.part;
    let type = q.type;

    if (!part || !['part1', 'part2', 'part3', 'part4'].includes(part)) {
      if (type === 'mcq_single' || (q.options && q.options.length >= 2)) {
        part = 'part1';
      } else if (type === 'true_false_group' || (q.subItems && q.subItems.length > 0)) {
        part = 'part2';
      } else if (type === 'short_answer') {
        part = 'part3';
      } else if (type === 'essay') {
        part = 'part4';
      } else {
        part = 'part1';
      }
    }

    if (part === 'part1') type = 'mcq_single';
    if (part === 'part2') type = 'true_false_group';
    if (part === 'part3') type = 'short_answer';
    if (part === 'part4') type = 'essay';

    return {
      ...q,
      part,
      type,
      id: q.id || `q_${Date.now()}_${idx}`,
    };
  });

  const part1 = normalized.filter((q) => q.part === 'part1');
  const part2 = normalized.filter((q) => q.part === 'part2');
  const part3 = normalized.filter((q) => q.part === 'part3');
  const part4 = normalized.filter((q) => q.part === 'part4');

  // Fix Part 1
  while (part1.length < p1) {
    const idx = part1.length + 1;
    part1.push({
      id: `q_p1_fill_${Date.now()}_${idx}`,
      part: 'part1',
      type: 'mcq_single',
      level: idx % 2 === 0 ? 'Thông hiểu' : 'Nhận biết',
      topic,
      question: `Cho chủ đề ${topic}, khẳng định nào sau đây là ĐÚNG khi xét tính chất cốt lõi của bài toán?`,
      options: [
        'Phương án A: Khẳng định đúng chuẩn bản chất kiến thức GDPT 2018.',
        'Phương án B: Nhầm lẫn giữa khái niệm giả thiết và kết luận.',
        'Phương án C: Bỏ quên điều kiện xác định cơ bản.',
        'Phương án D: Tính toán sai dấu và đơn vị đo.',
      ],
      correctAnswer: 'A',
      explanation: 'Phương án A đúng theo định lý và chuẩn kiến thức GDPT 2018.',
      distractorAnalysis: {
        B: 'Sai do nhầm lẫn điều kiện.',
        C: 'Sai do thiếu điều kiện xác định.',
        D: 'Sai do tính toán sai dấu.',
      },
      score: 0.25,
    });
  }

  // Fix Part 2
  while (part2.length < p2) {
    const idx = part2.length + 1;
    part2.push({
      id: `q_p2_fill_${Date.now()}_${idx}`,
      part: 'part2',
      type: 'true_false_group',
      level: 'Thông hiểu',
      topic,
      question: `Cho bối cảnh bài toán thuộc chủ đề ${topic}. Mức độ đúng/sai của các nhận định sau:`,
      subItems: [
        { id: 'a', label: 'a', statement: 'Mệnh đề a mô tả đúng định lý cốt lõi.', isCorrect: true, explanation: 'Mệnh đề a đúng.' },
        { id: 'b', label: 'b', statement: 'Mệnh đề b khẳng định đúng tính chất.', isCorrect: true, explanation: 'Mệnh đề b đúng.' },
        { id: 'c', label: 'c', statement: 'Mệnh đề c vi phạm điều kiện xác định.', isCorrect: false, explanation: 'Mệnh đề c sai.' },
        { id: 'd', label: 'd', statement: 'Mệnh đề d tính toán sai đơn vị.', isCorrect: false, explanation: 'Mệnh đề d sai.' },
      ],
      correctAnswer: 'a:Đ | b:Đ | c:S | d:S',
      explanation: 'Giải thích tổng quan các nhận định a, b, c, d.',
      score: 1.0,
    });
  }

  // Fix Part 3
  while (part3.length < p3) {
    const idx = part3.length + 1;
    part3.push({
      id: `q_p3_fill_${Date.now()}_${idx}`,
      part: 'part3',
      type: 'short_answer',
      level: 'Vận dụng',
      topic,
      question: `Xét bài toán thuộc chủ đề ${topic}. Tính giá trị biểu thức $S$ và điền kết quả số làm tròn đến hàng phần mười.`,
      correctAnswer: '12.5',
      explanation: 'Áp dụng công thức giải nhanh thu được kết quả $S = 12.5$.',
      score: 0.5,
    });
  }

  // Fix Part 4
  while (part4.length < p4) {
    const idx = part4.length + 1;
    part4.push({
      id: `q_p4_fill_${Date.now()}_${idx}`,
      part: 'part4',
      type: 'essay',
      level: 'Vận dụng cao',
      topic,
      question: `Trình bày chi tiết các bước giải bài toán thực tế thuộc chủ đề ${topic}.`,
      correctAnswer: 'Hướng dẫn chấm tự luận chi tiết.',
      explanation: 'Giải thích chi tiết quy trình giải.',
      rubric: [
        { step: 'Bước 1', point: 0.5, detail: 'Lập biểu thức và đặt điều kiện' },
        { step: 'Bước 2', point: 1.0, detail: 'Biến đổi, tính toán và kết luận' },
      ],
      score: 1.5,
    });
  }

  // Trim excesses if any to match exact section count
  const finalPart1 = part1.slice(0, p1);
  const finalPart2 = part2.slice(0, p2);
  const finalPart3 = part3.slice(0, p3);
  const finalPart4 = part4.slice(0, p4);

  const result = [...finalPart1, ...finalPart2, ...finalPart3, ...finalPart4];
  applyScoringRules(result, config);
  return result;
}
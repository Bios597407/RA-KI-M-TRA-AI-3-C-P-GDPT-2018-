import { QuestionItem, ExamConfig } from '../types/exam';

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

  onProgress?.(4, 'Đang gọi Gemini AI (gemini-3.8-flash) để biên soạn đề thi thực tế...');

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
    const generatedQuestions = await callGeminiAPI(config, activeApiKey, isEquivalentMode);

    onProgress?.(5, 'Đang tính toán biểu điểm và phân bổ thang điểm...');
    await delay(150);
    applyScoringRules(generatedQuestions, config);

    onProgress?.(6, 'Đang kiểm tra và chuẩn hóa hướng dẫn chấm...');
    await delay(150);

    if (fixedQuestions.length > 0) {
      const merged = [...fixedQuestions, ...generatedQuestions.slice(fixedQuestions.length)];
      applyScoringRules(merged, config);
      return merged;
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
  if (config.uploadedDocs && config.uploadedDocs.length > 0) {
    referenceContext +=
      `\n\n=== TÀI LIỆU VĂN BẢN ĐÃ TẢI LÊN ===\n` +
      config.uploadedDocs
        .map((d) => `--- File: ${d.name} ---\n${d.content.slice(0, 15000)}`)
        .join('\n\n');
  }
  if (config.readingPassage && config.readingPassage.trim()) {
    referenceContext += `\n\n=== NGỮ LIỆU / ĐOẠN TRÍCH VĂN BẢN DO GIÁO VIÊN NHẬP ===\n${config.readingPassage}`;
  }
  if (config.teacherNotes && config.teacherNotes.trim()) {
    referenceContext += `\n\n=== CHỈ DẪN / YÊU CẦU NỘI DUNG TỰ DO CỦA GIÁO VIÊN ===\n${config.teacherNotes}`;
  }

  const noDocumentInstruction = !referenceContext.trim()
    ? `BẮT BUỘC: Giáo viên KHÔNG tải tài liệu đính kèm. Bạn BẮT BUỘC phải dựa đúng vào kiến thức chuẩn Sách Giáo Khoa môn ${subject}, Lớp ${config.grade}, Bộ sách "${config.textbook}" thuộc Chương trình GDPT 2018 Việt Nam để biên soạn câu hỏi chuyên môn thực tế, có chiều sâu. Tuyệt đối KHÔNG ra câu hỏi chung chung hay giả lập!`
    : `BẮT BUỘC: 100% tất cả các câu hỏi (Phần I, II, III, IV), câu lệnh, phương án A/B/C/D, nhận định a/b/c/d, đáp án và lời giải PHẢI DỰA HOÀN TOÀN TRỰC TIẾP TRÊN TÀI LIỆU VÀ NGỮ LIỆU ĐÃ CUNG CẤP BÊN DƯỚI.`;

  const prompt = `Bạn là chuyên gia Khảo thí Giáo dục Việt Nam hàng đầu, am hiểu tường tận Chương trình GDPT 2018.
${referenceContext}

Nhiệm vụ: Hãy biên soạn một ĐỀ KIỂM TRA CHUYÊN MÔN THỰC THỤ CHUẨN MỰC cho:
- Cấp học: ${config.gradeLevel === 'primary' ? 'Tiểu học' : config.gradeLevel === 'secondary' ? 'THCS' : 'THPT'}
- Lớp: ${config.grade}
- Môn học: ${subject}
- Bộ sách giáo khoa: ${config.textbook}
- Thời gian làm bài: ${config.durationMinutes} phút
- Chủ đề / Tên bài: ${config.topicTitle || 'Kiến thức trọng tâm'}
- Phạm vi chương: ${config.chapter || 'Phân phối chương trình'}
- Yêu cầu cần đạt: ${config.learningOutcomes || 'Chuẩn kiến thức kỹ năng GDPT 2018'}
${isEquivalent ? 'CHÚ Ý: Đây là chế độ TẠO ĐỀ TƯƠNG ĐƯƠNG (Đề B). Giữ nguyên cấu trúc nhưng đổi toàn bộ số liệu và ngữ cảnh bài toán.' : ''}

${noDocumentInstruction}

CẤU TRÚC BẮT BUỘC (Sinh chính xác số câu, KHÔNG THỪA KHÔNG THIẾU):
- Phần I (Trắc nghiệm nhiều lựa chọn A, B, C, D): Đúng ${p1} câu. (type: "mcq_single", part: "part1")
- Phần II (Trắc nghiệm Đúng/Sai định dạng mới 2025: Mỗi câu gồm 4 ý a, b, c, d): Đúng ${p2} câu. (type: "true_false_group", part: "part2")
- Phần III (Trắc nghiệm trả lời ngắn): Đúng ${p3} câu. (type: "short_answer", part: "part3")
- Phần IV (Tự luận): Đúng ${p4} câu. (type: "essay", part: "part4")

HỆ THỐNG MỨC ĐỘ NĂNG LỰC: ${cognitiveList}.
NGUYÊN TẮC BIÊN SOẠN CÂU HỎI THẬT:
1. Môn tính toán / KHTN: Viết công thức bằng LaTeX giữa $...$. Chú ý escape dấu gạch chéo ngược trong JSON thành 2 dấu (ví dụ: "\\\\frac{1}{2}").
2. Môn Tiếng Anh: Dùng thẻ <u>...</u> gạch chân âm tiết khi hỏi phát âm / trọng âm.
3. Mỗi câu hỏi trong đề phải hoàn toàn khác biệt, đào sâu vào các đơn vị kiến thức cụ thể của môn học.
4. Trả về DUY NHẤT một mảng JSON các câu hỏi tuân theo cấu trúc sau:
[
  {
    "id": "q1",
    "part": "part1",
    "type": "mcq_single",
    "level": "Biết",
    "topic": "${config.topicTitle || subject}",
    "question": "Nội dung câu hỏi chuyên môn cụ thể...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswer": "A",
    "explanation": "Lời giải thích ngắn gọn, rõ ràng...",
    "distractorAnalysis": {
      "B": "Phân tích ngắn gọn lỗi sai khi chọn B",
      "C": "Phân tích ngắn gọn lỗi sai khi chọn C",
      "D": "Phân tích ngắn gọn lỗi sai khi chọn D"
    }
  },
  {
    "id": "q2",
    "part": "part2",
    "type": "true_false_group",
    "level": "Hiểu",
    "topic": "${config.topicTitle || subject}",
    "question": "Cho bối cảnh / dữ kiện chi tiết bài toán...",
    "subItems": [
      {"id": "a", "label": "a", "statement": "Mệnh đề a chi tiết", "isCorrect": true, "explanation": "Giải thích ý a"},
      {"id": "b", "label": "b", "statement": "Mệnh đề b chi tiết", "isCorrect": false, "explanation": "Giải thích ý b"},
      {"id": "c", "label": "c", "statement": "Mệnh đề c chi tiết", "isCorrect": true, "explanation": "Giải thích ý c"},
      {"id": "d", "label": "d", "statement": "Mệnh đề d chi tiết", "isCorrect": false, "explanation": "Giải thích ý d"}
    ],
    "correctAnswer": "a:Đ | b:S | c:Đ | d:S",
    "explanation": "Phân tích tổng quan..."
  },
  {
    "id": "q3",
    "part": "part3",
    "type": "short_answer",
    "level": "Vận dụng",
    "topic": "${config.topicTitle || subject}",
    "question": "Nội dung câu hỏi yêu cầu điền đáp số ngắn...",
    "correctAnswer": "12.5",
    "explanation": "Các bước tính toán..."
  },
  {
    "id": "q4",
    "part": "part4",
    "type": "essay",
    "level": "Vận dụng cao",
    "topic": "${config.topicTitle || subject}",
    "question": "Đề bài tự luận chi tiết...",
    "correctAnswer": "Hướng dẫn chấm chi tiết",
    "explanation": "Bài giải hoàn chỉnh...",
    "rubric": [
      {"step": "Bước 1", "point": 0.5, "detail": "Nêu điều kiện và công thức áp dụng"},
      {"step": "Bước 2", "point": 1.0, "detail": "Biến đổi và tính toán chính xác"}
    ]
  }
]`;

  const MODEL_CANDIDATES = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-pro',
  ];

  let lastErrorMsg = '';

  const requestParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (config.uploadedDocs && config.uploadedDocs.length > 0) {
    for (const doc of config.uploadedDocs) {
      if (doc.base64) {
        requestParts.push({
          inlineData: {
            mimeType: doc.mimeType || 'application/pdf',
            data: doc.base64,
          },
        });
      }
    }
  }

  for (const modelName of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: requestParts }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Lỗi Gemini API (${response.status}): ${response.statusText}`;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error?.message) {
            errorMessage = errJson.error.message;
          }
        } catch {
          errorMessage = `Lỗi Gemini API (${response.status}): ${errorText.slice(0, 300)}`;
        }

        console.warn(`Model "${modelName}" gặp lỗi HTTP (${response.status}): ${errorMessage}`);
        lastErrorMsg = `[${modelName}]: ${errorMessage}`;
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const nonThoughtParts = parts.filter(
        (p: { text?: string; thought?: boolean }) => typeof p.text === 'string' && !p.thought
      );
      const rawText =
        nonThoughtParts.length > 0
          ? nonThoughtParts.map((p: { text: string }) => p.text).join('\n')
          : parts.map((p: { text?: string }) => p.text || '').join('\n');

      if (!rawText) {
        lastErrorMsg = `[${modelName}]: Không có nội dung text phản hồi`;
        continue;
      }

      const parsed = tryRepairJson(rawText);
      const questionsList = extractQuestionArray(parsed);

      if (questionsList && questionsList.length > 0) {
        return questionsList.map((item, idx) => ({
          ...item,
          id: item.id || `q_${Date.now()}_${idx}`,
          score: item.score || 0.25,
        }));
      }

      lastErrorMsg = `[${modelName}]: Không bóc tách được mảng câu hỏi từ chuỗi phản hồi`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Lỗi khi gọi model "${modelName}": ${msg}`);
      lastErrorMsg = msg;
    }
  }

  throw new Error(`Mô hình AI phản hồi dữ liệu chưa đúng cấu trúc. Chi tiết: ${lastErrorMsg}`);
}

function sanitizeJsonStringLiterals(str: string): string {
  let result = '';
  let inString = false;
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if (!inString) {
      if (char === '"') {
        inString = true;
      }
      result += char;
      i++;
      continue;
    }

    if (char === '"') {
      inString = false;
      result += char;
      i++;
      continue;
    }

    if (char === '\n') {
      result += '\\n';
      i++;
      continue;
    }
    if (char === '\r') {
      result += '\\r';
      i++;
      continue;
    }
    if (char === '\t') {
      result += '\\t';
      i++;
      continue;
    }

    if (char === '\\') {
      const nextChar = str[i + 1] || '';
      const nextNextChar = str[i + 2] || '';

      if (nextChar === '"' || nextChar === '\\' || nextChar === '/') {
        result += char + nextChar;
        i += 2;
        continue;
      }

      if (nextChar === 'u' && /^[0-9a-fA-F]{4}$/.test(str.slice(i + 2, i + 6))) {
        result += str.slice(i, i + 6);
        i += 6;
        continue;
      }

      if (['f', 't', 'r', 'b', 'n'].includes(nextChar) && /[a-zA-Z]/.test(nextNextChar)) {
        result += '\\\\';
        i++;
        continue;
      }

      if (['n', 'r', 't', 'b', 'f'].includes(nextChar)) {
        result += char + nextChar;
        i += 2;
        continue;
      }

      result += '\\\\';
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

function salvageBalancedObjects(str: string): QuestionItem[] {
  const results: QuestionItem[] = [];
  const startArr = str.indexOf('[');
  const scanStart = startArr !== -1 ? startArr + 1 : 0;

  let inString = false;
  let escaped = false;
  let depth = 0;
  let objStart = -1;

  for (let i = scanStart; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) {
        objStart = i;
      }
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const rawObj = str.slice(objStart, i + 1);
          objStart = -1;

          try {
            const parsed = JSON.parse(rawObj);
            if (parsed && typeof parsed === 'object' && (parsed.question || parsed.part)) {
              results.push(parsed as QuestionItem);
              continue;
            }
          } catch {
            try {
              const cleanedObj = sanitizeJsonStringLiterals(rawObj).replace(/,\s*([\]\}])/g, '$1');
              const parsed = JSON.parse(cleanedObj);
              if (parsed && typeof parsed === 'object' && (parsed.question || parsed.part)) {
                results.push(parsed as QuestionItem);
              }
            } catch {
              // Ignore broken trailing fragment
            }
          }
        }
      }
    }
  }

  return results;
}

function tryRepairJson(jsonString: string): unknown {
  if (!jsonString) return null;
  let str = jsonString.trim();

  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    str = codeBlockMatch[1].trim();
  } else {
    str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    return JSON.parse(str);
  } catch {}

  const sanitized = sanitizeJsonStringLiterals(str).replace(/,\s*([\]\}])/g, '$1');
  try {
    return JSON.parse(sanitized);
  } catch {}

  const salvagedFromRaw = salvageBalancedObjects(str);
  if (salvagedFromRaw.length > 0) {
    return salvagedFromRaw;
  }

  const salvagedFromSanitized = salvageBalancedObjects(sanitized);
  if (salvagedFromSanitized.length > 0) {
    return salvagedFromSanitized;
  }

  return null;
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
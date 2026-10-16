import { ExamConfig, GradeLevel } from '../types/exam';

export interface SuggestedLessonData {
  gradeLevel?: GradeLevel;
  grade?: string;
  subject?: string;
  textbook?: string;
  topicTitle: string;
  chapter: string;
  learningOutcomes: string;
  readingPassage: string;
}

export async function analyzeAndSuggestLessonContent(
  docs: Array<{ name: string; content: string; size: number; base64?: string; mimeType?: string }>,
  config: Partial<ExamConfig>,
  apiKey?: string
): Promise<SuggestedLessonData> {
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
      'Chưa tìm thấy Gemini API Key! Vui lòng nhấn "🔑 Cấu hình API Key" trên thanh tiêu đề để nhập API key.'
    );
  }

  const hasDocs = docs && docs.length > 0;
  const combinedDocsText = hasDocs
    ? docs
        .map((d, i) => `--- TÀI LIỆU ${i + 1}: ${d.name} (Size: ${Math.round(d.size/1024)}KB) ---\n${d.content.slice(0, 30000)}`)
        .join('\n\n')
    : '';

  const promptText = `
Bạn là Siêu Trí Tuệ Nhân Tạo & Chuyên gia Cao cấp về Chương trình Giáo dục GDPT 2018 của Bộ Giáo dục và Đào tạo Việt Nam.

QUY TẮC BẮT BUỘC & NGHIÊM NGẶT (STRICT MULTI-FILE GROUNDING):
1. Bạn BẮT BUỘC phải đọc, phân tích và tổng hợp thông tin từ TOÀN BỘ TẤT CẢ CÁC TỆP đính kèm (${docs.length} file).
2. TUYỆT ĐỐI KHÔNG BỊA ĐẶT, KHÔNG SUY DIỄN NGOÀI TÀI LIỆU. Mọi thông tin về Tên bài/Chủ đề, Chương/Phạm vi, Yêu cầu cần đạt và Ngữ liệu PHẢI PHẢN ÁNH CHÍNH XÁC VÀ ĐẦY ĐỦ CÁC TỆP TÀI LIỆU MÀ GIÁO VIÊN ĐÃ TẢI LÊN.

NHIỆM VỤ CỤ THỂ:
1. gradeLevel: Cấp học ("primary", "secondary", "high").
2. grade: Khối lớp ("1" đến "12").
3. subject: Môn học chuẩn theo GDPT 2018.
4. textbook: Bộ sách giáo khoa phù hợp hoặc mặc định.
5. topicTitle: Tên bài học / Chủ đề tổng hợp từ các file đính kèm.
6. chapter: Chương hoặc mạch kiến thức từ tài liệu.
7. learningOutcomes: Yêu cầu cần đạt / Mục tiêu chi tiết dựa trọn vẹn trên các file đã tải.
8. readingPassage: Tóm tắt ngữ liệu, công thức, nội dung cốt lõi từ các tệp đính kèm.

DỮ LIỆU ĐẦU VÀO TỪ GIÁO VIÊN:
${
  hasDocs
    ? `DƯỚI ĐÂY LÀ NỘI DUNG CỦA ${docs.length} TỆP TÀI LIỆU:\n${combinedDocsText}`
    : `Môn học hiện tại: ${config.subject || 'Toán học'}, Lớp: ${config.grade || '12'}, Bộ sách: ${config.textbook || 'Kết nối tri thức với cuộc sống'}`
}

YÊU CẦU ĐẦU RA:
Trả về duy nhất MỘT JSON Object hợp lệ (không kèm bất kỳ văn bản giải thích nào ngoài JSON):
{
  "gradeLevel": "high",
  "grade": "12",
  "subject": "Toán học",
  "textbook": "Kết nối tri thức với cuộc sống",
  "topicTitle": "...",
  "chapter": "...",
  "learningOutcomes": "...",
  "readingPassage": "..."
}
`;

  // Build request parts: text prompt + inlineData for attached base64 files
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: promptText },
  ];

  if (hasDocs) {
    for (const doc of docs) {
      if (doc.base64 && doc.mimeType) {
        parts.push({
          inlineData: {
            mimeType: doc.mimeType,
            data: doc.base64,
          },
        });
      }
    }
  }

  const MODEL_CANDIDATES = [
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
  ];

  let lastError = '';

  for (const modelName of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeApiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `[${modelName}] HTTP ${response.status}: ${errorText.slice(0, 200)}`;
        continue;
      }

      const data = await response.json();
      const responseParts = data?.candidates?.[0]?.content?.parts || [];
      const nonThoughtParts = responseParts.filter(
        (p: { text?: string; thought?: boolean }) => typeof p.text === 'string' && !p.thought
      );
      const rawText =
        nonThoughtParts.length > 0
          ? nonThoughtParts.map((p: { text: string }) => p.text).join('\n')
          : responseParts.map((p: { text?: string }) => p.text || '').join('\n');

      if (!rawText) continue;

      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      if (parsed && (parsed.topicTitle || parsed.learningOutcomes || parsed.chapter || parsed.subject)) {
        let detectedGradeLevel: GradeLevel | undefined = undefined;
        if (parsed.gradeLevel === 'primary' || parsed.gradeLevel === 'secondary' || parsed.gradeLevel === 'high') {
          detectedGradeLevel = parsed.gradeLevel;
        } else if (parsed.grade) {
          const numGrade = parseInt(parsed.grade, 10);
          if (numGrade >= 1 && numGrade <= 5) detectedGradeLevel = 'primary';
          else if (numGrade >= 6 && numGrade <= 9) detectedGradeLevel = 'secondary';
          else if (numGrade >= 10 && numGrade <= 12) detectedGradeLevel = 'high';
        }

        return {
          gradeLevel: detectedGradeLevel,
          grade: parsed.grade ? String(parsed.grade) : undefined,
          subject: parsed.subject || undefined,
          textbook: parsed.textbook || undefined,
          topicTitle: parsed.topicTitle || '',
          chapter: parsed.chapter || '',
          learningOutcomes: parsed.learningOutcomes || '',
          readingPassage: parsed.readingPassage || '',
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Không thể tự động phân tích tài liệu: ${lastError}`);
}

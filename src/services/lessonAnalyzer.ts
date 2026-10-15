import { ExamConfig } from '../types/exam';

export interface SuggestedLessonData {
  topicTitle: string;
  chapter: string;
  learningOutcomes: string;
  readingPassage: string;
  subject?: string;
  grade?: string;
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
        .map((d, i) => `--- TÀI LIỆU ${i + 1}: ${d.name} ---\n${d.content.slice(0, 20000)}`)
        .join('\n\n')
    : '';

  const promptText = `
Bạn là Siêu Trí Tuệ Nhân Tạo & Chuyên gia Cao cấp về Chương trình Giáo dục GDPT 2018 của Bộ Giáo dục và Đào tạo Việt Nam.

NHIỆM VỤ QUAN TRỌNG NHẤT:
Hãy sử dụng tri thức sâu rộng của mô hình ngôn ngữ lớn (LLM) và khả năng suy luận thị giác/ngôn ngữ để tự động phân tích toàn bộ tài liệu đính kèm (tên file, nội dung chữ, bảng biểu, hình ảnh, công thức, sơ đồ...).

TUYỆT ĐỐI KHÔNG TRẢ VỀ CÁC CÂU KIỂU "Chưa xác định", "Không có nội dung văn bản", hay "Chưa thể xác định".
Dù tài liệu chỉ có từ khóa ngắn, tên tệp (ví dụ: "BAI 1.pdf"), hình ảnh hay công thức, bạn BẮT BUỘC phải đối chiếu với chương trình SGK GDPT 2018 (Kết nối tri thức, Cánh diều, Chân trời sáng tạo) để SUY LUẬN VÀ XÁC ĐỊNH CHÍNH XÁC:

1. subject: Tên môn học chính xác (Ví dụ: "Toán học", "Ngữ văn", "Vật lý", "Hóa học", "Sinh học", "Lịch sử & Địa lý", "Tiếng Anh", "Tin học", "GD kinh tế & Pháp luật"...).
2. grade: Khối lớp (Chỉ lấy số, ví dụ: "12", "11", "10", "9", "8", "7", "6"...).
3. topicTitle: Tên bài học / Chủ đề cụ thể chuẩn chương trình (Ví dụ: "Khảo sát và vẽ đồ thị hàm số", "Sóng dừng", "Tính chất hóa học của Este"...).
4. chapter: Tên chương hoặc Mạch kiến thức lớn tương ứng (Ví dụ: "Chương I: Ứng dụng đạo hàm để khảo sát hàm số", "Chương II: Sóng cơ"...).
5. learningOutcomes: Yêu cầu cần đạt / Mục tiêu đánh giá chi tiết theo GDPT 2018 (Liệt kê rõ các mục tiêu: Nhận biết..., Thông hiểu..., Vận dụng... dạng gạch đầu dòng chuyên nghiệp).
6. readingPassage: Tóm tắt ngắn gọn các kiến thức cốt lõi, công thức, định lý hoặc đoạn văn bản ngữ liệu quan trọng nhất của bài học này.

DỮ LIỆU ĐẦU VÀO TỪ GIÁO VIÊN:
${
  hasDocs
    ? `Danh sách tệp đính kèm:\n${docs.map((d, i) => `[File ${i + 1}]: ${d.name}\n${d.content.slice(0, 10000)}`).join('\n\n')}`
    : `Môn học hiện tại: ${config.subject || 'Toán học'}, Lớp: ${config.grade || '12'}, Bộ sách: ${config.textbook || 'Kết nối tri thức với cuộc sống'}`
}

YÊU CẦU ĐẦU RA:
Trả về duy nhất MỘT JSON Object hợp lệ (không kèm bất kỳ văn bản giải thích nào ngoài JSON):
{
  "subject": "...",
  "grade": "...",
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
      if (doc.base64) {
        parts.push({
          inlineData: {
            mimeType: doc.mimeType || 'application/pdf',
            data: doc.base64,
          },
        });
      }
    }
  }

  const MODEL_CANDIDATES = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-pro',
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
            temperature: 0.3,
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

      if (parsed && (parsed.topicTitle || parsed.learningOutcomes || parsed.chapter)) {
        return {
          topicTitle: parsed.topicTitle || '',
          chapter: parsed.chapter || '',
          learningOutcomes: parsed.learningOutcomes || '',
          readingPassage: parsed.readingPassage || '',
          subject: parsed.subject || undefined,
          grade: parsed.grade || undefined,
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Không thể tự động phân tích tài liệu: ${lastError}`);
}

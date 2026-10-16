import { ExamConfig, GradeLevel } from '../types/exam';
import { fetchGeminiWithFallback, extractTextFromGeminiResponse, tryRepairJson } from '../utils/geminiModels';
import { safeString } from '../utils/dataNormalizer';
import { getCachedFileAsBase64 } from '../utils/memoryManager';

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
  
  let promptText = '';
  if (hasDocs) {
    const combinedDocsText = docs
      .map((d, i) => `--- TÀI LIỆU ${i + 1}: ${d.name} ---\n${d.content.slice(0, 20000)}`)
      .join('\n\n');

    promptText = `
Bạn là chuyên gia Khảo thí Giáo dục GDPT 2018.
NHIỆM VỤ: Phân tích ĐỘC LẬP từng tài liệu sau đây (${docs.length} file).

DỮ LIỆU ĐẦU VÀO:
${combinedDocsText}

YÊU CẦU ĐẦU RA:
Trả về một mảng JSON các đối tượng (mỗi đối tượng cho 1 file), KHÔNG được bỏ sót file nào:
[
  {
    "fileName": "Tên file chính xác",
    "gradeLevel": "primary" | "secondary" | "high",
    "grade": "1-12",
    "subject": "Môn học",
    "textbook": "Bộ sách",
    "topicTitle": "Tên bài/Chủ đề",
    "chapter": "Chương/Phạm vi",
    "learningOutcomes": "Yêu cầu cần đạt",
    "readingPassage": "Tóm tắt nội dung/Ngữ liệu"
  },
  ...
]
`;
  } else {
    promptText = `
Bạn là chuyên gia GDPT 2018. Hãy đề xuất nội dung bài học dựa trên thiết lập hiện tại.
Thiết lập: Môn ${config.subject}, Lớp ${config.grade}, Sách ${config.textbook}.

YÊU CẦU ĐẦU RA:
Trả về duy nhất MỘT JSON Object:
{
  "topicTitle": "...",
  "chapter": "...",
  "learningOutcomes": "...",
  "readingPassage": "..."
}
`;
  }

  const requestParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: promptText },
  ];

  if (hasDocs) {
    for (const doc of docs) {
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
  }

  try {
    const { data } = await fetchGeminiWithFallback(
      { contents: [{ parts: requestParts }] },
      activeApiKey,
      {
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      }
    );

    const rawText = extractTextFromGeminiResponse(data);
    if (!rawText) throw new Error('AI không phản hồi nội dung.');

    const parsed = tryRepairJson(rawText);

    if (hasDocs) {
      const results = Array.isArray(parsed) ? parsed : [parsed];
      
      // Concatenate fields with file names
      const topicTitles: string[] = [];
      const chapters: string[] = [];
      const outcomes: string[] = [];
      const passages: string[] = [];
      
      let finalGradeLevel: GradeLevel | undefined;
      let finalGrade: string | undefined;
      let finalSubject: string | undefined;
      let finalBook: string | undefined;

      results.forEach((res: any, idx: number) => {
        const name = res.fileName || docs[idx]?.name || `File ${idx + 1}`;
        if (res.topicTitle) topicTitles.push(`[${name}]: ${safeString(res.topicTitle)}`);
        if (res.chapter) chapters.push(`[${name}]: ${safeString(res.chapter)}`);
        if (res.learningOutcomes) outcomes.push(`[${name}]: ${safeString(res.learningOutcomes)}`);
        if (res.readingPassage) passages.push(`[${name}]: ${safeString(res.readingPassage)}`);
        
        // Take grade/subject info from the last file or any valid one
        if (res.gradeLevel) finalGradeLevel = res.gradeLevel;
        if (res.grade) finalGrade = String(res.grade);
        if (res.subject) finalSubject = res.subject;
        if (res.textbook) finalBook = res.textbook;
      });

      return {
        gradeLevel: finalGradeLevel,
        grade: finalGrade,
        subject: finalSubject,
        textbook: finalBook,
        topicTitle: topicTitles.join('\n'),
        chapter: chapters.join('\n'),
        learningOutcomes: outcomes.join('\n'),
        readingPassage: passages.join('\n'),
      };
    } else {
      // No docs, single object mode
      return {
        topicTitle: safeString(parsed.topicTitle),
        chapter: safeString(parsed.chapter),
        learningOutcomes: safeString(parsed.learningOutcomes),
        readingPassage: safeString(parsed.readingPassage),
      };
    }
  } catch (err: any) {
    throw new Error(`Không thể tự động phân tích tài liệu: ${err.message || String(err)}`);
  }
}

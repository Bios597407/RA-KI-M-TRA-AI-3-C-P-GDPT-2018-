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
  docs: Array<{ id: string; name: string; content: string; size: number; mimeType?: string }>,
  config: Partial<ExamConfig>,
  apiKey?: string,
  onProgress?: (msg: string) => void
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
  
  if (!hasDocs) {
    const promptText = `
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
    try {
      const { data } = await fetchGeminiWithFallback(
        { contents: [{ parts: [{ text: promptText }] }] },
        activeApiKey,
        { temperature: 0.2, responseMimeType: 'application/json' }
      );
      const rawText = extractTextFromGeminiResponse(data);
      const parsed = tryRepairJson(rawText);
      return {
        topicTitle: safeString(parsed.topicTitle),
        chapter: safeString(parsed.chapter),
        learningOutcomes: safeString(parsed.learningOutcomes),
        readingPassage: safeString(parsed.readingPassage),
      };
    } catch (err: any) {
      throw new Error(`Lỗi đề xuất nội dung: ${err.message}`);
    }
  }

  // Multi-file Sequential Processing (Sequential Map-Reduce)
  const results: any[] = [];
  let fileIdx = 1;

  for (const doc of docs) {
    onProgress?.(`Đang đọc và trích xuất nội dung File ${fileIdx}/${docs.length}: ${doc.name}...`);
    
    // Convert to base64 only for this request to save RAM
    let inlineData: { mimeType: string; data: string } | undefined;
    if (doc.id) {
      try {
        const b64 = await getCachedFileAsBase64(doc.id);
        if (b64) inlineData = { mimeType: b64.mimeType, data: b64.base64 };
      } catch (e) {
        console.warn(`Could not get base64 for ${doc.name}`, e);
      }
    }

    const filePrompt = `
Bạn là chuyên gia Khảo thí và Chương trình Giáo dục phổ thông 2018 Việt Nam.
NHIỆM VỤ: Phân tích tài liệu để biên soạn đề thi. BẮT BUỘC TRẢ VỀ ĐẦY ĐỦ CÁC TRƯỜNG DƯỚI ĐÂY, KHÔNG ĐƯỢC BỎ SÓT BẤT KỲ TRƯỜNG NÀO:

TÊN FILE: ${doc.name}
NỘI DUNG VĂN BẢN (Nếu có): ${doc.content.slice(0, 18000)}

YÊU CẦU ĐỊNH DẠNG VÀ PHÂN TÍCH (BẮT BUỘC):
1. Tự động nhận diện Khối lớp (gradeLevel: 'primary'|'secondary'|'high') và Lớp cụ thể (grade: '1' đến '12').
2. Tự động nhận diện Môn học (subject).
3. Tự động nhận diện Bộ sách giáo khoa (textbook).
4. Tên Bài/Chủ đề: Lấy từ tài liệu.
5. Chương/Phạm vi: Ghi rõ chương hoặc phạm vi kiến thức.
6. Yêu cầu cần đạt: Liệt kê dạng DANH SÁCH (Bullet points).
7. Nội dung kiến thức cốt lõi: Tóm tắt dạng DANH SÁCH (Bullet points).

TRẢ VỀ JSON:
{
  "fileName": "${doc.name}",
  "gradeLevel": "primary" | "secondary" | "high",
  "grade": "1-12",
  "subject": "...",
  "textbook": "...",
  "topicTitle": "...",
  "chapter": "...",
  "learningOutcomes": "...",
  "readingPassage": "..."
}
`;

    const parts: any[] = [{ text: filePrompt }];
    if (inlineData) parts.push({ inlineData });

    try {
      const { data } = await fetchGeminiWithFallback(
        { contents: [{ parts }] },
        activeApiKey,
        { temperature: 0.1, responseMimeType: 'application/json' }
      );
      const rawText = extractTextFromGeminiResponse(data);
      let parsed = tryRepairJson(rawText);
      
      console.log('AI Parsed Result:', parsed); // DEBUG

      // Robustly handle if parsing returned an array instead of object
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed[0];
      }
      
      // Allow partial results but log warning
      if (!parsed || typeof parsed !== 'object') {
        console.warn('AI returned invalid or empty structure, falling back to empty fields.');
        parsed = {};
      }
      
      results.push(parsed);
    } catch (err: any) {
      console.error(`Lỗi phân tích file ${doc.name}:`, err);
      results.push({
        fileName: doc.name,
        topicTitle: `[Lỗi] ${doc.name}`,
        readingPassage: `Không thể trích xuất nội dung từ file này: ${err.message}`
      });
    }

    fileIdx++;
  }

  // Helper to sanitize and remove raw file tags like "📄 [filename.docx]:"
  const cleanFieldVal = (val: string) => {
    if (!val) return '';
    return safeString(val)
      .replace(/📄\s*\[.*?\]:?\s*/g, '')
      .replace(/\[.*?\.(docx|pdf|txt|png|jpg|jpeg)\]:?\s*/gi, '')
      .trim();
  };

  // Aggregate Results (Reduce step)
  onProgress?.(`Đang tổng hợp dữ liệu từ ${docs.length} tài liệu...`);
  
  const cleanTopics: string[] = [];
  const cleanChapters: string[] = [];
  const cleanOutcomesList: string[] = [];
  const cleanPassagesList: string[] = [];
  
  let finalGradeLevel: GradeLevel | undefined = config.gradeLevel;
  let finalGrade: string | undefined = config.grade;
  let finalSubject: string | undefined = config.subject;
  let finalBook: string | undefined = config.textbook;

  results.forEach((res: any, idx: number) => {
    const rawTitle = cleanFieldVal(res.topicTitle);
    const rawChapter = cleanFieldVal(res.chapter);
    const rawOutcomes = cleanFieldVal(res.learningOutcomes);
    const rawPassage = cleanFieldVal(res.readingPassage || res.content || '');

    // 1. Topic Title: Each lesson extracted on a separate line (Mỗi bài trên 1 dòng riêng)
    if (rawTitle) {
      // Split if multiple lines in single file
      rawTitle.split('\n').forEach((t) => {
        const trimmed = cleanFieldVal(t);
        if (trimmed && !cleanTopics.includes(trimmed)) {
          cleanTopics.push(trimmed);
        }
      });
    }

    // 2. Chapter / Scope: Each chapter/scope on a separate line
    if (rawChapter) {
      rawChapter.split('\n').forEach((c) => {
        const trimmed = cleanFieldVal(c);
        if (trimmed && !cleanChapters.includes(trimmed)) {
          cleanChapters.push(trimmed);
        }
      });
    }

    // 3. Learning Outcomes: Clean bullet points without file tag clutter
    if (rawOutcomes) {
      rawOutcomes.split('\n').forEach((line) => {
        const trimmed = cleanFieldVal(line);
        if (trimmed && !cleanOutcomesList.includes(trimmed)) {
          cleanOutcomesList.push(trimmed);
        }
      });
    }

    // 4. Reading Passage / Content
    if (rawPassage) {
      const docName = docs[idx]?.name || `File ${idx + 1}`;
      const header = docs.length > 1 ? `--- Nội dung tài liệu ${idx + 1}: ${docName} ---` : '';
      const formatted = header ? `${header}\n${rawPassage}` : rawPassage;
      if (!cleanPassagesList.includes(formatted)) {
        cleanPassagesList.push(formatted);
      }
    }

    if (res.gradeLevel) finalGradeLevel = res.gradeLevel;
    if (res.grade) finalGrade = String(res.grade);
    if (res.subject) finalSubject = res.subject;
    if (res.textbook) finalBook = res.textbook;
  });

  // If no chapter was extracted, generate a combined scope string for all extracted topics
  if (cleanChapters.length === 0 && cleanTopics.length > 0) {
    cleanChapters.push(`Phạm vi: ${cleanTopics.length} bài học đính kèm`);
  }

  return {
    gradeLevel: finalGradeLevel,
    grade: finalGrade,
    subject: finalSubject,
    textbook: finalBook,
    topicTitle: cleanTopics.join('\n'),
    chapter: cleanChapters.join('\n'),
    learningOutcomes: cleanOutcomesList.join('\n'),
    readingPassage: cleanPassagesList.join('\n\n'),
  };
}

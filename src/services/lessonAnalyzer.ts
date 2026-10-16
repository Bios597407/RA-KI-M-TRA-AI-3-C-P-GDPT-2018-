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

  // Aggregate Results (Reduce step)
  onProgress?.(`Đang tổng hợp dữ liệu từ ${docs.length} tài liệu...`);
  
  // Requirement: Preserve existing data from config if it exists
  const topicTitles: string[] = config.topicTitle ? config.topicTitle.split('\n') : [];
  const chapters: string[] = config.chapter ? config.chapter.split('\n') : [];
  const outcomes: string[] = config.learningOutcomes ? config.learningOutcomes.split('\n') : [];
  const passages: string[] = config.readingPassage ? config.readingPassage.split('\n\n') : [];
  
  let finalGradeLevel: GradeLevel | undefined = config.gradeLevel;
  let finalGrade: string | undefined = config.grade;
  let finalSubject: string | undefined = config.subject;
  let finalBook: string | undefined = config.textbook;

  results.forEach((res: any, idx: number) => {
    const name = res.fileName || docs[idx]?.name || `Tài liệu ${idx + 1}`;
    
    // Only add if not already present to avoid duplicates
    const titleEntry = `📄 [${name}]: ${safeString(res.topicTitle)}`;
    if (res.topicTitle && !topicTitles.includes(titleEntry)) topicTitles.push(titleEntry);
    
    const chapterEntry = `📄 [${name}]: ${safeString(res.chapter)}`;
    if (res.chapter && !chapters.includes(chapterEntry)) chapters.push(chapterEntry);
    
    const outcomeEntry = `📄 [${name}]: ${safeString(res.learningOutcomes)}`;
    if (res.learningOutcomes && !outcomes.includes(outcomeEntry)) outcomes.push(outcomeEntry);
    
    // Structured knowledge markers as requested
    const filePassage = safeString(res.readingPassage || res.content || '');
    const passageEntry = `=== BẮT ĐẦU NỘI DUNG FILE ${idx + 1}: ${name} ===\n${filePassage}\n=== KẾT THÚC NỘI DUNG FILE ${idx + 1} ===`;
    if (!passages.includes(passageEntry)) passages.push(passageEntry);
    
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
    readingPassage: passages.join('\n\n'),
  };
}

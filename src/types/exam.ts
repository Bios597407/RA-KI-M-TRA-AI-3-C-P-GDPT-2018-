/**
 * Định nghĩa cấu trúc dữ liệu cho Hệ thống Ra Đề Kiểm Tra AI - 3 Cấp (GDPT 2018)
 */

export type GradeLevel = 'primary' | 'secondary' | 'high';

export type CognitiveSystem = 'primary_3' | 'secondary_3' | 'secondary_4';

export type QuestionType =
  | 'mcq_single'      // Phần I: Trắc nghiệm 4 lựa chọn (chọn 1)
  | 'true_false_group'// Phần II: Trắc nghiệm Đúng/Sai 4 ý a,b,c,d (Định dạng 2025)
  | 'short_answer'    // Phần III: Trắc nghiệm trả lời ngắn
  | 'essay'           // Phần IV: Tự luận
  | 'matching'        // Dạng mở rộng: Nối cột ghép đôi
  | 'fill_blank';     // Dạng mở rộng: Điền khuyết

export interface SubStatement {
  id: string;
  label: 'a' | 'b' | 'c' | 'd';
  statement: string;
  isCorrect: boolean; // true = Đúng, false = Sai
  explanation?: string;
}

export interface RubricStep {
  step: string;
  point: number;
  detail: string;
}

export interface QuestionItem {
  id: string;
  part: 'part1' | 'part2' | 'part3' | 'part4';
  partTitle?: string;
  type: QuestionType;
  level: string; // "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao" | "Mức 1" | "Mức 2" | "Mức 3" | "Biết" | "Hiểu"
  topic: string;
  subTopic?: string;
  passage?: string; // Đoạn văn ngữ liệu / Đọc hiểu chùm câu hỏi
  audioTranscript?: string; // Kịch bản bài nghe môn Tiếng Anh
  question: string;
  options?: string[]; // [A, B, C, D]
  subItems?: SubStatement[]; // Cho câu Đúng/Sai 4 ý
  correctAnswer: string | boolean | string[]; // "A", "B", "C", "D" hoặc kết quả số/chuỗi ngắn
  explanation: string;
  distractorAnalysis?: Record<string, string>; // Phân tích bẫy tư duy của các phương án sai (A, B, C, D)
  rubric?: RubricStep[]; // Biểu điểm tự luận
  score: number;
  needsReview?: boolean;
  reviewReason?: string;
}

export interface StudyGuideFormula {
  name: string;
  formula: string;
  note: string;
}

export interface StudyGuideTrapItem {
  trapType: string;         // Tên bẫy tư duy (VD: "Bẫy điều kiện nghiệm", "Bẫy nhầm điểm cực trị x với y", "Bẫy đơn vị đo")
  description: string;      // Mô tả bẫy sai kinh điển mà học sinh rất hay mắc phải
  exampleQuestion?: string; // Ví dụ hoặc minh họa câu hỏi thực tế trong đề
  avoidanceTip: string;     // Bí quyết phòng tránh & Quy tắc kiểm tra nhanh trước khi chép đáp án
}

export interface StudyGuideData {
  topicTitle: string;
  coreConcepts: Array<{ term: string; definition: string }>;
  keyFormulas: StudyGuideFormula[];
  commonMistakes: string[];
  trapList?: StudyGuideTrapItem[];       // Bẫy sai kinh điển & Bí quyết phòng tránh
  timeStrategy?: Array<{ partTitle: string; timeAlloc: string; strategy: string }>; // Phân bổ thời gian & Mẹo từng phần
  readinessChecklist?: string[];          // Checklist tự ôn luyện trước giờ G
  reviewTips: string[];
}

export interface ExamMatrixRow {
  topic: string;
  subTopic?: string;
  part1: Record<string, number>; // level -> count
  part2: Record<string, number>;
  part3: Record<string, number>;
  part4: Record<string, number>;
  totalQuestions: number;
  totalScore: number;
  percent: number;
}

export interface ExamMatrix {
  levels: string[];
  rows: ExamMatrixRow[];
  totalByLevel: Record<string, { count: number; score: number; percent: number }>;
  grandTotal: { count: number; score: number; percent: number };
}

export interface ExamSpecificationRow {
  id: string;
  stt: number;
  topic: string;
  subTopic: string;
  competency: string; // Yêu cầu cần đạt
  level: string;
  questionType: string;
  questionCount: number;
  questionIds: string[];
  score: number;
}

export interface ExamConfig {
  schoolName: string;
  examTitle: string;
  examType: string; // 15', 45', Giữa học kỳ, Cuối học kỳ...
  gradeLevel: GradeLevel;
  grade: string; // '1' - '12'
  subject: string;
  customSubject?: string;
  textbook: string; // Kết nối tri thức, Chân trời sáng tạo, Cánh Diều, Chung
  durationMinutes: number;
  totalScore: number; // Mặc định 10
  scoreScale: 10 | 20 | 100;
  gradingRuleTF: 'stepped' | 'equal'; // Lũy tiến (0.1, 0.25, 0.5, 1.0) hoặc đều 0.25
  
  cognitiveSystem: CognitiveSystem;
  distMode: 'count' | 'percent';
  cognitiveDist: Record<string, number>; // Tỷ lệ % hoặc số câu theo mức độ

  sectionCounts: {
    part1: number;       // TN 4 lựa chọn
    part2: number;       // TN Đúng/Sai 4 ý
    part3: number;       // Trả lời ngắn
    part4: number;       // Tự luận
    matching?: number;   // Nối cột
    fill_blank?: number; // Điền khuyết
  };

  topicTitle: string;
  chapter: string;
  knowledgeScope: string;
  learningOutcomes: string;
  teacherNotes: string;
  readingPassage: string;

  sourceOption: 'doc_only' | 'doc_plus_standard' | 'teacher_prompt';
  uploadedDocs: Array<{ id: string; name: string; content: string; size: number; mimeType?: string }>;

  keepFixedQuestions: boolean;
  teacherFixedQuestions: QuestionItem[];
  testCodesCount: number; // Số mã đề thi (1 - 8)
  customTestCodesList?: string[]; // Danh sách mã đề tự chọn (vd: ["111", "222", "333", "444"])

  // Form tiêu đề chuẩn Bộ GD&ĐT / Sở GD&ĐT
  departmentName?: string;  // VD: "SỞ GIÁO DỤC & ĐÀO TẠO TPHCM"
  academicYear?: string;    // VD: "2025 - 2026"
  officialExamType?: string;// VD: "Đề chính thức" | "Đề dự bị"
  pageCountText?: string;   // VD: "2" trong "(Đề có _2_ trang)"
  durationNote?: string;    // VD: "(không kể thời gian phát đề)"
  
  // UI & Layout Preferences
  layoutLineHeight?: 'compact' | 'standard' | 'relaxed';
  layoutFontSize?: 'small' | 'medium' | 'large';
  appUiScale?: 'compact' | 'standard' | 'relaxed';
}

export interface ShuffledExamCode {
  code: string; // "101", "102", "103", "104"
  questions: QuestionItem[];
  quickAnswers: Array<{
    stt: number;
    part: string;
    answer: string;
  }>;
}

export interface ExamHistoryItem {
  id: string;
  timestamp: number;
  dateStr: string;
  examTitle: string;
  subject: string;
  grade: string;
  gradeLevel: GradeLevel;
  totalQuestions: number;
  totalScore: number;
  config: ExamConfig;
  questions: QuestionItem[];
}

export interface QAResultItem {
  id: number;
  title: string;
  passed: boolean;
  details: string;
  severity: 'success' | 'warning' | 'error';
}

export interface QAReport {
  score: number; // 0 - 100
  passedAll: boolean;
  items: QAResultItem[];
}

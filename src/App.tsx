import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import Workspace from './components/Workspace';
import GenerationStepper from './components/GenerationStepper';
import ApiKeyModal from './components/ApiKeyModal';
import AutoQAModal from './components/AutoQAModal';
import QuestionBankModal from './components/QuestionBankModal';
import EditQuestionModal from './components/EditQuestionModal';
import AnswerSheet from './components/AnswerSheet';
import ExamHistoryModal from './components/ExamHistoryModal';

import {
  ExamConfig,
  QuestionItem,
  ShuffledExamCode,
  ExamMatrix,
  ExamSpecificationRow,
  QAReport,
  ExamHistoryItem,
} from './types/exam';

import { generateExamQuestions, applyScoringRules } from './services/aiGenerator';
import { buildExamMatrix, buildExamSpecification } from './utils/matrixSpecBuilder';
import { runExamQA } from './utils/autoQA';
import { generateShuffledCodes } from './utils/examShuffler';
import {
  exportToWordDoc,
  exportExamOnlyWordDoc,
  exportAnswerKeyOnlyWordDoc,
} from './utils/exporter';
import { downloadStandaloneSingleFileHtml } from './utils/singleFileBundle';

const STORAGE_KEY_CONFIG = 'exam_ai_config_v2';
const STORAGE_KEY_QUESTIONS = 'exam_ai_questions_v2';
const STORAGE_KEY_BANK = 'exam_ai_bank_v2';
const STORAGE_KEY_HISTORY = 'exam_ai_history_v2';
const STORAGE_KEY_API_KEY = 'exam_ai_gemini_key_v2';

const DEFAULT_CONFIG: ExamConfig = {
  schoolName: 'TRƯỜNG THPT CHUYÊN LÊ QUÝ ĐÔN',
  examTitle: 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I',
  examType: 'Kiểm tra giữa học kỳ',
  gradeLevel: 'high',
  grade: '12',
  subject: 'Toán học',
  customSubject: '',
  textbook: 'Kết nối tri thức với cuộc sống',
  durationMinutes: 90,
  totalScore: 10,
  scoreScale: 10,
  gradingRuleTF: 'stepped',

  cognitiveSystem: 'secondary_4',
  distMode: 'percent',
  cognitiveDist: {
    'Nhận biết': 40,
    'Thông hiểu': 30,
    'Vận dụng': 20,
    'Vận dụng cao': 10,
  },

  sectionCounts: {
    part1: 12, // 12 câu TN nhiều lựa chọn (3.0đ)
    part2: 4,  // 4 câu Đúng/Sai 4 ý (4.0đ)
    part3: 6,  // 6 câu Trả lời ngắn (3.0đ)
    part4: 0,  // Tự luận (nếu có)
  },

  topicTitle: 'Ứng dụng đạo hàm khảo sát hàm số & Cực trị',
  chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số',
  knowledgeScope: 'Tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất và tiệm cận của đồ thị hàm số.',
  learningOutcomes: 'Xác định được cực trị, tiệm cận, vận dụng đạo hàm giải bài toán tối ưu trong thực tế.',
  teacherNotes: 'Chú ý các điểm phân loại vận dụng cao và định dạng cấu trúc mới 2025.',
  readingPassage: '',

  sourceOption: 'doc_plus_standard',
  uploadedDocs: [],

  keepFixedQuestions: false,
  teacherFixedQuestions: [],
  testCodesCount: 2,
};

export default function App() {
  // Local storage states
  const [config, setConfig] = useState<ExamConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  const [bank, setBank] = useState<QuestionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BANK);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<ExamHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [activeCode, setActiveCode] = useState<string>('101');

  // Generation progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  // Modals state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showQAModal, setShowQAModal] = useState(false);
  const [showAnswerSheetModal, setShowAnswerSheetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // Sync config, bank & history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Storage quota', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BANK, JSON.stringify(bank));
    } catch (e) {
      console.warn('Storage quota', e);
    }
  }, [bank]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Storage quota', e);
    }
  }, [history]);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem(STORAGE_KEY_API_KEY, newKey);
  };

  // Generate initial questions on mount if none exist
  useEffect(() => {
    const savedQs = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (savedQs) {
      try {
        const parsed = JSON.parse(savedQs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
          return;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    // Generate initial sample exam
    triggerGeneration(config, false);
  }, []);

  // Sync questions to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
      } catch (e) {
        console.warn('Storage quota', e);
      }
    }
  }, [questions]);

  // Derived Matrix and Specs
  const matrix: ExamMatrix = useMemo(() => {
    return buildExamMatrix(questions, config);
  }, [questions, config]);

  const specs: ExamSpecificationRow[] = useMemo(() => {
    return buildExamSpecification(questions, config);
  }, [questions, config]);

  // Derived Shuffled Codes (101, 102, 103, 104)
  const shuffledCodes: ShuffledExamCode[] = useMemo(() => {
    return generateShuffledCodes(questions, config.testCodesCount || 2);
  }, [questions, config.testCodesCount]);

  // Auto QA Report
  const qaReport: QAReport = useMemo(() => {
    return runExamQA(questions, config);
  }, [questions, config]);

  // Core Generation Function
  const triggerGeneration = async (currentConfig: ExamConfig, isEquivalent: boolean) => {
    setIsGenerating(true);
    setProgressStep(1);
    setProgressMsg('Khởi động quy trình phân tích khảo thí GDPT 2018...');

    try {
      const generated = await generateExamQuestions(
        currentConfig,
        apiKey,
        (step, msg) => {
          setProgressStep(step);
          setProgressMsg(msg);
        },
        isEquivalent
      );

      setQuestions(generated);
      setActiveCode('101');

      // Auto-save to History
      const now = new Date();
      const newHistoryItem: ExamHistoryItem = {
        id: `exam_${Date.now()}`,
        timestamp: Date.now(),
        dateStr: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
        examTitle: currentConfig.examTitle,
        subject: currentConfig.customSubject || currentConfig.subject,
        grade: currentConfig.grade,
        gradeLevel: currentConfig.gradeLevel,
        totalQuestions: generated.length,
        totalScore: currentConfig.totalScore,
        config: currentConfig,
        questions: generated,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]); // Keep last 20
    } catch (err: unknown) {
      console.error('Generation error', err);
      alert(`Đã xảy ra lỗi khi tạo đề: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
      setProgressStep(0);
    }
  };

  // Handlers
  const handleGenerate = () => {
    triggerGeneration(config, false);
  };

  const handleRegenerateEquivalent = () => {
    triggerGeneration(config, true);
  };

  const handleBuildMatrixOnly = () => {
    alert('Ma trận & Bản đặc tả đã được cập nhật theo cấu hình hiện tại! Mời thầy cô xem ở Tab 4 và Tab 5.');
  };

  const handleResetDefaults = () => {
    if (confirm('Khôi phục toàn bộ cấu hình về mặc định chuẩn Bộ GD&ĐT?')) {
      setConfig(DEFAULT_CONFIG);
      triggerGeneration(DEFAULT_CONFIG, false);
    }
  };

  // History Handlers
  const handleRestoreHistory = (item: ExamHistoryItem) => {
    setConfig(item.config);
    setQuestions(item.questions);
    setActiveCode('101');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  // Inline Question Tools
  const handleEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
  };

  const handleSaveEditedQuestion = (updated: QuestionItem) => {
    const newQuestions = questions.map((q) => (q.id === updated.id ? updated : q));
    applyScoringRules(newQuestions, config);
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Xóa câu hỏi này khỏi đề thi?')) {
      const newQuestions = questions.filter((q) => q.id !== id);
      applyScoringRules(newQuestions, config);
      setQuestions(newQuestions);
    }
  };

  const handleRegenerateSingleQuestion = async (oldQ: QuestionItem) => {
    setIsGenerating(true);
    setProgressStep(4);
    setProgressMsg(`Đang biên soạn lại riêng Câu hỏi (${oldQ.level} - ${oldQ.type})...`);

    try {
      const tempConfig: ExamConfig = {
        ...config,
        sectionCounts: {
          part1: oldQ.part === 'part1' ? 1 : 0,
          part2: oldQ.part === 'part2' ? 1 : 0,
          part3: oldQ.part === 'part3' ? 1 : 0,
          part4: oldQ.part === 'part4' ? 1 : 0,
        },
      };

      const [newQ] = await generateExamQuestions(tempConfig, apiKey, undefined, true);
      if (newQ) {
        newQ.id = oldQ.id;
        newQ.score = oldQ.score;
        newQ.level = oldQ.level;
        newQ.part = oldQ.part;

        const updatedList = questions.map((q) => (q.id === oldQ.id ? newQ : q));
        applyScoringRules(updatedList, config);
        setQuestions(updatedList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setProgressStep(0);
    }
  };

  const handleSaveToBank = (q: QuestionItem) => {
    const exists = bank.some((b) => b.id === q.id || b.question === q.question);
    if (exists) {
      alert('Câu hỏi này đã có trong Ngân hàng câu hỏi cá nhân!');
      return;
    }
    setBank([...bank, { ...q, id: `bank_${Date.now()}` }]);
    alert('Đã lưu thành công câu hỏi vào Ngân hàng câu hỏi!');
  };

  const handleInsertFromBank = (bankQ: QuestionItem) => {
    const newQ: QuestionItem = {
      ...bankQ,
      id: `q_${Date.now()}`,
    };
    const updated = [...questions, newQ];
    applyScoringRules(updated, config);
    setQuestions(updated);
    alert('Đã chèn câu hỏi từ Ngân hàng vào đề thi!');
  };

  const handleAddNewQuestion = () => {
    const newQ: QuestionItem = {
      id: `q_${Date.now()}`,
      part: 'part1',
      type: 'mcq_single',
      level: 'Nhận biết',
      topic: config.topicTitle || 'Chủ đề mới',
      question: 'Nhập nội dung câu hỏi mới tại đây (hỗ trợ công thức toán $...$)...',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswer: 'A',
      explanation: 'Lời giải chi tiết...',
      score: 0.25,
    };
    const updated = [...questions, newQ];
    applyScoringRules(updated, config);
    setQuestions(updated);
    setEditingQuestion(newQ);
  };

  // Exporters
  const getActiveExam = () => {
    return shuffledCodes.find((c) => c.code === activeCode) || {
      code: '101',
      questions,
      quickAnswers: [],
    };
  };

  const handleExportFullWord = () => {
    exportToWordDoc(config, getActiveExam(), matrix, specs);
  };

  const handleExportExamOnly = () => {
    exportExamOnlyWordDoc(config, getActiveExam());
  };

  const handleExportAnswerOnly = () => {
    exportAnswerKeyOnlyWordDoc(config, getActiveExam());
  };

  const handlePrintA4 = () => {
    window.print();
  };

  const handleCopyContent = () => {
    const plainText = questions
      .map((q, idx) => {
        let text = `Câu ${idx + 1} (${q.score}đ) [${q.level}]: ${q.question}\n`;
        if (q.options) {
          text += q.options.map((opt, oIdx) => `  ${['A', 'B', 'C', 'D'][oIdx]}. ${opt}`).join('\n') + '\n';
        }
        if (q.subItems) {
          text += q.subItems.map((s) => `  ${s.label}) ${s.statement}`).join('\n') + '\n';
        }
        text += `-> Đáp án: ${String(q.correctAnswer)}\n`;
        return text;
      })
      .join('\n');

    navigator.clipboard.writeText(
      `${config.examTitle}\nMôn: ${config.customSubject || config.subject} - Lớp ${config.grade}\n\n` + plainText
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <Header
        onOpenApiKey={() => setShowApiKeyModal(true)}
        onOpenQuestionBank={() => setShowBankModal(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
        onResetDefaults={handleResetDefaults}
        onDownloadStandalone={downloadStandaloneSingleFileHtml}
        savedBankCount={bank.length}
        historyCount={history.length}
        hasApiKey={!!apiKey}
      />

      {/* Main Dual-Column Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột Trái: Bảng thiết lập đầu vào & cấu trúc (5/12) */}
          <div className="lg:col-span-5 no-print">
            <div className="sticky top-20">
              <ConfigPanel
                config={config}
                onChange={setConfig}
                onGenerate={handleGenerate}
                onBuildMatrixOnly={handleBuildMatrixOnly}
                isGenerating={isGenerating}
              />
            </div>
          </div>

          {/* Cột Phải: Không gian làm việc 5 Tab & Trình diễn đề (7/12) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Realtime 7-Step Stepper during Generation */}
            {isGenerating && (
              <GenerationStepper currentStep={progressStep} message={progressMsg} />
            )}

            {/* 5 Tab Workspace */}
            <Workspace
              config={config}
              questions={questions}
              shuffledCodes={shuffledCodes}
              activeCode={activeCode}
              onSelectCode={setActiveCode}
              matrix={matrix}
              specs={specs}
              qaReport={qaReport}
              onOpenQA={() => setShowQAModal(true)}
              onOpenAnswerSheet={() => setShowAnswerSheetModal(true)}
              onExportExamOnly={handleExportExamOnly}
              onExportAnswerOnly={handleExportAnswerOnly}
              onExportFullWord={handleExportFullWord}
              onPrintA4={handlePrintA4}
              onCopyContent={handleCopyContent}
              onRegenerateAll={handleGenerate}
              onGenerateEquivalent={handleRegenerateEquivalent}
              onEditQuestion={handleEditQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onRegenerateSingleQuestion={handleRegenerateSingleQuestion}
              onSaveToBank={handleSaveToBank}
              onAddNewQuestion={handleAddNewQuestion}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <AutoQAModal
        isOpen={showQAModal}
        onClose={() => setShowQAModal(false)}
        report={qaReport}
      />

      <AnswerSheet
        isOpen={showAnswerSheetModal}
        onClose={() => setShowAnswerSheetModal(false)}
        config={config}
        currentCode={getActiveExam()}
      />

      <ExamHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onRestore={handleRestoreHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearAllHistory={handleClearAllHistory}
      />

      <QuestionBankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        bank={bank}
        onInsertToExam={handleInsertFromBank}
        onDeleteFromBank={(id) => setBank(bank.filter((b) => b.id !== id))}
        onAddNewToBank={(q) => setBank([...bank, q])}
      />

      <EditQuestionModal
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
        onSave={handleSaveEditedQuestion}
      />
    </div>
  );
}

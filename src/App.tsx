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
import AzotaExportModal from './components/AzotaExportModal';
import ExamImportModal from './components/ExamImportModal';
import MatrixSpecModal from './components/MatrixSpecModal';
import ConfirmModal from './components/ConfirmModal';
import PrintPreviewModal from './components/PrintPreviewModal';
import { useToast } from './components/Toast';

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
import { buildStudyGuide } from './utils/studyGuideBuilder';
import { runExamQA } from './utils/autoQA';
import { generateShuffledCodes } from './utils/examShuffler';
import {
  exportToWordDoc,
  exportExamOnlyWordDoc,
  exportAnswerKeyOnlyWordDoc,
  exportMatrixAndSpecsOnlyWordDoc,
  exportStudyGuideWordDoc,
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
    part1: 12, // 12 câu TN nhiều lựa chọn
    part2: 4,  // 4 câu Đúng/Sai 4 ý
    part3: 6,  // 6 câu Trả lời ngắn
    part4: 0,  // Tự luận
  },

  topicTitle: '',
  chapter: '',
  knowledgeScope: '',
  learningOutcomes: '',
  teacherNotes: '',
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
  const [showAzotaModal, setShowAzotaModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocType, setPrintDocType] = useState<'exam' | 'answers' | 'matrix' | 'study_guide' | 'full'>('exam');
  const [workspaceTab, setWorkspaceTab] = useState<'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide'>('exam');
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  const toast = useToast();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

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

  // Load initial saved questions on mount
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

      toast.success(
        isEquivalent
          ? 'Đã tạo xong Đề tương đương (Đề B) với số liệu mới!'
          : `Đã biên soạn thành công ${generated.length} câu hỏi theo chuẩn GDPT 2018!`
      );

      // Smooth scroll to workspace
      const el = document.getElementById('workspace-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Generation error', err);
      toast.error(`Đã xảy ra lỗi khi tạo đề: ${err instanceof Error ? err.message : String(err)}`, 'Lỗi tạo đề');
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
    setShowMatrixModal(true);
    setWorkspaceTab('matrix');
  };

  const handleExportMatrixOnlyWord = () => {
    exportMatrixAndSpecsOnlyWordDoc(config, matrix, specs);
    toast.success('Đang tải xuống tài liệu: Ma trận & Bản đặc tả (.doc)...');
  };

  const handleResetDefaults = () => {
    setConfirmState({
      isOpen: true,
      title: 'Khôi phục cấu hình mặc định',
      message: 'Bạn có chắc chắn muốn đưa toàn bộ cấu hình về chuẩn gốc của Bộ GD&ĐT (Trường THPT Chuyên, Toán 12, cấu trúc 12-4-6)?',
      confirmLabel: 'Khôi phục ngay',
      isDestructive: true,
      onConfirm: () => {
        setConfig(DEFAULT_CONFIG);
        triggerGeneration(DEFAULT_CONFIG, false);
        toast.info('Đã khôi phục cấu hình mặc định và tạo lại đề chuẩn.');
      },
    });
  };

  // History Handlers
  const handleRestoreHistory = (item: ExamHistoryItem) => {
    setConfig(item.config);
    setQuestions(item.questions);
    setActiveCode('101');
    toast.success(`Đã nạp lại đề thi từ lịch sử: ${item.examTitle}`);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    toast.info('Đã xóa đề khỏi lịch sử.');
  };

  const handleClearAllHistory = () => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa toàn bộ lịch sử',
      message: 'Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử các đề đã tạo? Thao tác này không thể hoàn tác.',
      confirmLabel: 'Xóa sạch',
      isDestructive: true,
      onConfirm: () => {
        setHistory([]);
        toast.info('Đã xóa sạch toàn bộ lịch sử.');
      },
    });
  };

  // Inline Question Tools
  const handleEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
  };

  const handleSaveEditedQuestion = (updated: QuestionItem) => {
    const newQuestions = questions.map((q) => (q.id === updated.id ? updated : q));
    applyScoringRules(newQuestions, config);
    setQuestions(newQuestions);
    toast.success('Đã lưu các chỉnh sửa của câu hỏi!');
  };

  const handleDeleteQuestion = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa câu hỏi khỏi đề',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi? Thang điểm toàn đề sẽ tự động cân bằng lại.',
      confirmLabel: 'Xóa câu hỏi',
      isDestructive: true,
      onConfirm: () => {
        const newQuestions = questions.filter((q) => q.id !== id);
        applyScoringRules(newQuestions, config);
        setQuestions(newQuestions);
        toast.info('Đã xóa 1 câu hỏi khỏi đề thi.');
      },
    });
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
        toast.success('Đã biên soạn lại câu hỏi này với dữ liệu mới!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Không thể tạo lại câu hỏi, vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      setProgressStep(0);
    }
  };

  const handleSaveToBank = (q: QuestionItem) => {
    const exists = bank.some((b) => b.id === q.id || b.question === q.question);
    if (exists) {
      toast.warning('Câu hỏi này đã có trong Ngân hàng câu hỏi cá nhân!');
      return;
    }
    setBank([...bank, { ...q, id: `bank_${Date.now()}` }]);
    toast.success('Đã lưu thành công câu hỏi vào Ngân hàng câu hỏi!');
  };

  const handleInsertFromBank = (bankQ: QuestionItem) => {
    const newQ: QuestionItem = {
      ...bankQ,
      id: `q_${Date.now()}`,
    };
    const updated = [...questions, newQ];
    applyScoringRules(updated, config);
    setQuestions(updated);
    toast.success('Đã chèn 1 câu hỏi từ Ngân hàng vào đề thi!');
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
    toast.info('Đã thêm 1 câu hỏi mới. Mời thầy cô hoàn thiện nội dung trong hộp thoại.');
  };

  const handleImportQuestions = (importedQs: QuestionItem[]) => {
    // Automatically count sections
    const p1 = importedQs.filter((q) => q.part === 'part1' || q.type === 'mcq_single').length;
    const p2 = importedQs.filter((q) => q.part === 'part2' || q.type === 'true_false_group').length;
    const p3 = importedQs.filter((q) => q.part === 'part3' || q.type === 'short_answer').length;
    const p4 = importedQs.filter((q) => q.part === 'part4' || q.type === 'essay').length;

    const newConfig: ExamConfig = {
      ...config,
      sectionCounts: { part1: p1, part2: p2, part3: p3, part4: p4 },
    };

    applyScoringRules(importedQs, newConfig);
    setConfig(newConfig);
    setQuestions(importedQs);
    setActiveCode('101');
    toast.success(`Đã nạp thành công ${importedQs.length} câu hỏi vào đề và vẽ lại Ma trận!`);
  };

  const handleSaveImportedToBank = (importedQs: QuestionItem[]) => {
    setBank((prev) => [...prev, ...importedQs]);
    toast.success(`Đã lưu ${importedQs.length} câu hỏi vào Ngân hàng!`);
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
    toast.success('Đang tải xuống Trọn bộ Hồ sơ (Đề + ĐA + Ma trận + Bản đặc tả)...');
  };

  const handleExportExamOnly = () => {
    exportExamOnlyWordDoc(config, getActiveExam());
    toast.success('Đang tải xuống Đề thi riêng cho học sinh (.doc)...');
  };

  const handleExportAnswerOnly = () => {
    exportAnswerKeyOnlyWordDoc(config, getActiveExam());
    toast.success('Đang tải xuống Bảng đáp án & HD chấm riêng (.doc)...');
  };

  const handleExportStudyGuideWord = () => {
    const studyGuide = buildStudyGuide(config, questions);
    exportStudyGuideWordDoc(config, studyGuide);
    toast.success('Đang tải xuống Đề cương ôn tập & Cẩm nang trọng tâm (.doc)...');
  };

  const handleOpenPrintPreview = (
    docType: 'exam' | 'answers' | 'matrix' | 'study_guide' | 'full' = 'exam'
  ) => {
    setPrintDocType(docType);
    setShowPrintModal(true);
  };

  const handlePrintA4 = () => {
    handleOpenPrintPreview('exam');
  };

  const handleDownloadStandalone = () => {
    downloadStandaloneSingleFileHtml();
    toast.success('Đang tải xuống bản HTML Offline độc lập chạy không cần mạng!');
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
    toast.success('Đã sao chép toàn bộ nội dung đề vào bộ nhớ tạm (Clipboard)!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <Header
        onOpenApiKey={() => setShowApiKeyModal(true)}
        onOpenQuestionBank={() => setShowBankModal(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
        onResetDefaults={handleResetDefaults}
        onDownloadStandalone={handleDownloadStandalone}
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
          <div id="workspace-section" className="lg:col-span-7 space-y-4">
            {/* Realtime 7-Step Stepper during Generation */}
            {isGenerating && (
              <GenerationStepper currentStep={progressStep} message={progressMsg} />
            )}

            {/* 6 Tab Workspace */}
            <Workspace
              config={config}
              questions={questions}
              shuffledCodes={shuffledCodes}
              activeCode={activeCode}
              onSelectCode={setActiveCode}
              matrix={matrix}
              specs={specs}
              qaReport={qaReport}
              currentTab={workspaceTab}
              onTabChange={setWorkspaceTab}
              onOpenQA={() => setShowQAModal(true)}
              onOpenAnswerSheet={() => setShowAnswerSheetModal(true)}
              onOpenAzotaExport={() => setShowAzotaModal(true)}
              onOpenImport={() => setShowImportModal(true)}
              onOpenMatrixModal={() => setShowMatrixModal(true)}
              onExportExamOnly={handleExportExamOnly}
              onExportAnswerOnly={handleExportAnswerOnly}
              onExportFullWord={handleExportFullWord}
              onExportMatrixSpecsWord={handleExportMatrixOnlyWord}
              onExportStudyGuideWord={handleExportStudyGuideWord}
              onOpenPrintPreview={handleOpenPrintPreview}
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

      <AzotaExportModal
        isOpen={showAzotaModal}
        onClose={() => setShowAzotaModal(false)}
        questions={questions}
        config={config}
      />

      <ExamImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        config={config}
        onImportToExam={handleImportQuestions}
        onSaveToBank={handleSaveImportedToBank}
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

      <MatrixSpecModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
        config={config}
        matrix={matrix}
        specs={specs}
        onGenerateFromMatrix={() => {
          setShowMatrixModal(false);
          handleGenerate();
        }}
        onExportWord={handleExportMatrixOnlyWord}
        onPrint={handlePrintA4}
        onOpenInWorkspace={() => {
          setShowMatrixModal(false);
          setWorkspaceTab('matrix');
          const el = document.getElementById('workspace-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        isGenerating={isGenerating}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <PrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        config={config}
        currentCode={getActiveExam()}
        matrix={matrix}
        specs={specs}
        studyGuide={useMemo(() => buildStudyGuide(config, questions), [config, questions])}
        initialDocType={printDocType}
      />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  HelpCircle,
  Grid,
  ListTree,
  Printer,
  FileDown,
  Copy,
  RotateCw,
  Shuffle,
  ShieldAlert,
  Sparkles,
  Edit3,
  Trash2,
  BookmarkPlus,
  Plus,
  AlertTriangle,
  Layers,
  ChevronRight,
  BookOpen,
  Share2,
  Upload,
} from 'lucide-react';
import {
  QuestionItem,
  ExamConfig,
  ExamMatrix,
  ExamSpecificationRow,
  ShuffledExamCode,
  QAReport,
  StudyGuideData,
} from '../types/exam';
import MathRenderer from '../utils/mathRenderer';
import { buildStudyGuide, generateAIStudyGuide } from '../utils/studyGuideBuilder';
import { useToast } from './Toast';
import OfficialExamHeader from './OfficialExamHeader';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';

interface WorkspaceProps {
  config: ExamConfig;
  questions: QuestionItem[];
  shuffledCodes: ShuffledExamCode[];
  activeCode: string;
  onSelectCode: (code: string) => void;
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  qaReport: QAReport | null;
  onOpenQA: () => void;
  onOpenAnswerSheet: () => void;
  onOpenAzotaExport: () => void;
  onOpenImport: () => void;
  onExportExamOnly: () => void;
  onExportAnswerOnly: () => void;
  onExportFullWord: () => void;
  onExportMatrixSpecsWord?: () => void;
  onExportStudyGuideWord?: () => void;
  onOpenPrintPreview?: (docType?: 'exam' | 'answers' | 'matrix' | 'study_guide' | 'full') => void;
  onOpenMatrixModal?: () => void;
  onPrintA4: () => void;
  onCopyContent: () => void;
  onRegenerateAll: () => void;
  onGenerateEquivalent: () => void;
  onEditQuestion: (q: QuestionItem) => void;
  onDeleteQuestion: (id: string) => void;
  onRegenerateSingleQuestion: (q: QuestionItem) => void;
  onSaveToBank: (q: QuestionItem) => void;
  onAddNewQuestion: () => void;
  isGenerating: boolean;
  apiKey?: string;
  currentTab?: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide';
  onTabChange?: (tab: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide') => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  config,
  questions,
  shuffledCodes,
  activeCode,
  onSelectCode,
  matrix,
  specs,
  qaReport,
  onOpenQA,
  onOpenAnswerSheet,
  onOpenAzotaExport,
  onOpenImport,
  onExportExamOnly,
  onExportAnswerOnly,
  onExportFullWord,
  onExportMatrixSpecsWord,
  onExportStudyGuideWord,
  onOpenPrintPreview,
  onOpenMatrixModal,
  onPrintA4,
  onCopyContent,
  onRegenerateAll,
  onGenerateEquivalent,
  onEditQuestion,
  onDeleteQuestion,
  onRegenerateSingleQuestion,
  onSaveToBank,
  onAddNewQuestion,
  isGenerating,
  apiKey,
  currentTab,
  onTabChange,
}) => {
  const toast = useToast();
  const [localTab, setLocalTab] = useState<'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide'>('exam');
  const activeTab = currentTab !== undefined ? currentTab : localTab;
  const setActiveTab = (tab: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide') => {
    setLocalTab(tab);
    onTabChange?.(tab);
  };
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showWordMenu, setShowWordMenu] = useState(false);
  const [aiStudyGuide, setAiStudyGuide] = useState<StudyGuideData | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  const currentExam = shuffledCodes.find((c) => c.code === activeCode) || {
    code: '101',
    questions,
    quickAnswers: [],
  };

  const defaultStudyGuide = useMemo(() => buildStudyGuide(config, questions), [config, questions]);
  const studyGuide = aiStudyGuide || defaultStudyGuide;

  const handleSynthesizeAIStudyGuide = async () => {
    setIsGeneratingGuide(true);
    try {
      const guide = await generateAIStudyGuide(config, questions, apiKey);
      setAiStudyGuide(guide);
      toast.success('🎉 Gemini AI đã tổng hợp thành công Cẩm Nang Ôn Tập & Bẫy Thi Kinh Điển!');
    } catch (err: unknown) {
      console.error('AI Study guide error', err);
      toast.error(`Không thể tổng hợp Cẩm nang: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleCopy = () => {
    onCopyContent();
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const totalScore = Number(questions.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2));

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Action Group */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRegenerateAll}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Tạo lại</span>
            </button>

            <button
              onClick={onGenerateEquivalent}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-xs"
              title="Giữ nguyên 100% Ma trận & Đặc tả, chỉ đổi số liệu bài toán để tạo Đề B / Đề Dự bị"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Đề tương đương (Đề B)</span>
            </button>

            <button
              onClick={onOpenQA}
              className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                qaReport?.passedAll
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Kiểm tra QA ({qaReport?.score || 100}/100)</span>
            </button>

            {/* In Phiếu Trả Lời Trắc Nghiệm Button */}
            <button
              onClick={onOpenAnswerSheet}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
              title="In Phiếu trả lời trắc nghiệm chuẩn Bộ GD&ĐT (A4) để phát kèm cho học sinh"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>In Phiếu Trắc Nghiệm</span>
            </button>

            {/* Xuất Azota / K12 Button */}
            <button
              onClick={onOpenAzotaExport}
              className="flex items-center space-x-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800 hover:bg-orange-100 transition shadow-xs"
              title="Xuất sang cú pháp Azota, bảng K12Online hoặc Google Forms"
            >
              <Share2 className="h-3.5 w-3.5 text-orange-600" />
              <span>Xuất Azota/K12</span>
            </button>

            {/* Nhập đề có sẵn Button */}
            <button
              onClick={onOpenImport}
              className="flex items-center space-x-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-xs"
              title="Nhập đề thi cũ từ Word (.docx), PDF hoặc dán văn bản để bóc tách câu hỏi và vẽ ma trận"
            >
              <Upload className="h-3.5 w-3.5 text-teal-600" />
              <span>Nhập đề có sẵn</span>
            </button>
          </div>

          {/* Export Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Shuffled Code selector */}
            {shuffledCodes.length >= 1 && (
              <div className="flex items-center space-x-1 rounded-lg border border-indigo-200 bg-indigo-50/70 p-1 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-indigo-900 px-1">Mã đề:</span>
                {(Array.isArray(shuffledCodes) ? shuffledCodes : []).map((sc) => (
                  <button
                    key={sc.code}
                    onClick={() => onSelectCode(sc.code)}
                    className={`rounded px-2.5 py-0.5 text-xs font-bold transition cursor-pointer ${
                      activeCode === sc.code
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-800 hover:bg-indigo-200/60'
                    }`}
                  >
                    {sc.code}
                  </button>
                ))}
              </div>
            )}

            {/* Split Word Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowWordMenu(!showWordMenu)}
                className="flex items-center space-x-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-800 transition shadow-xs"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Xuất file Word (.doc) ▾</span>
              </button>

              {showWordMenu && (
                <div
                  className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowWordMenu(false)}
                >
                  <button
                    onClick={() => {
                      onExportExamOnly();
                      setShowWordMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>📝</span>
                    <span>Xuất Đề thi riêng (cho học sinh)</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportAnswerOnly();
                      setShowWordMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>🔑</span>
                    <span>Xuất Đáp án & HD chấm riêng</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportMatrixSpecsWord?.();
                      setShowWordMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>📊</span>
                    <span>Xuất riêng Ma trận & Bản đặc tả (.doc)</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportStudyGuideWord?.();
                      setShowWordMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>💡</span>
                    <span>Xuất riêng Đề cương ôn tập (.doc)</span>
                  </button>
                  <div className="border-t my-1"></div>
                  <button
                    onClick={() => {
                      onExportFullWord();
                      setShowWordMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <span>📦</span>
                    <span>Xuất Trọn bộ Hồ sơ (Đề+ĐA+Ma trận+Đề cương)</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const docType =
                  activeTab === 'answers'
                    ? 'answers'
                    : activeTab === 'matrix' || activeTab === 'spec'
                    ? 'matrix'
                    : activeTab === 'study_guide'
                    ? 'study_guide'
                    : 'exam';
                if (onOpenPrintPreview) {
                  onOpenPrintPreview(docType);
                } else {
                  onPrintA4();
                }
              }}
              className="flex items-center space-x-1.5 rounded-lg border border-blue-600 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-blue-700" />
              <span>Xem trước & In ấn</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Sao chép toàn bộ đề vào Clipboard"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>{copiedNotification ? 'Đã sao chép!' : 'Sao chép'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Tab Navigation */}
      <div className="no-print border-b border-slate-200 bg-white rounded-t-2xl px-5 pt-4">
        <div className="flex space-x-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {(Array.isArray([
            { id: 'exam', label: 'ĐỀ KIỂM TRA', icon: FileText, count: questions.length },
            { id: 'answers', label: 'BẢNG ĐÁP ÁN', icon: CheckCircle },
            { id: 'rubric', label: 'HƯỚNG DẪN CHẤM', icon: HelpCircle },
            { id: 'matrix', label: 'MA TRẬN ĐỀ', icon: Grid },
            { id: 'spec', label: 'BẢN ĐẶC TẢ', icon: ListTree },
            { id: 'study_guide', label: 'ĐỀ CƯƠNG ÔN TẬP', icon: BookOpen },
          ]) ? [
            { id: 'exam', label: 'ĐỀ KIỂM TRA', icon: FileText, count: questions.length },
            { id: 'answers', label: 'BẢNG ĐÁP ÁN', icon: CheckCircle },
            { id: 'rubric', label: 'HƯỚNG DẪN CHẤM', icon: HelpCircle },
            { id: 'matrix', label: 'MA TRẬN ĐỀ', icon: Grid },
            { id: 'spec', label: 'BẢN ĐẶC TẢ', icon: ListTree },
            { id: 'study_guide', label: 'ĐỀ CƯƠNG ÔN TẬP', icon: BookOpen },
          ] : []).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 border-b-2 px-5 py-3 text-[11px] font-black transition whitespace-nowrap tracking-wide uppercase ${
                  isActive
                    ? 'border-blue-700 text-blue-800 bg-blue-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 rounded-t-xl'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Academic Safety Banner */}
      <div className="no-print rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Lưu ý chuyên môn:</strong> Đề thi được AI hỗ trợ biên soạn theo cấu trúc GDPT 2018. Thầy cô vui lòng kiểm duyệt kỹ các câu có nhãn{' '}
            <span className="font-bold text-amber-700">"⚠ Cần GV kiểm tra"</span> trước khi in ấn chính thức.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500">
          Tổng điểm: <strong className="text-blue-700">{totalScore} điểm</strong>
        </span>
      </div>

      {/* Tab 1: ĐỀ KIỂM TRA CHUẨN MỰC A4 */}
      {activeTab === 'exam' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm print-sheet">
          {/* Quick Action Bar for Tab 1 */}
          <div className="no-print mb-6 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-900">Đề Kiểm Tra (Mã đề {currentExam.code})</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onExportExamOnly}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Xuất Word Đề (.doc)</span>
              </button>
              <button
                onClick={() => (onOpenPrintPreview ? onOpenPrintPreview('exam') : onPrintA4())}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Đề Thi A4</span>
              </button>
              <button
                onClick={onExportFullWord}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Xuất Trọn Bộ (.doc)</span>
              </button>
            </div>
          </div>

          {/* Official Exam Header */}
          <OfficialExamHeader config={config} activeCode={currentExam.code} />

          {/* Exam Questions List */}
          <div className="space-y-6 font-exam text-slate-900 leading-relaxed text-sm sm:text-base">
            {renderExamQuestions(
              currentExam.questions,
              onEditQuestion,
              onDeleteQuestion,
              onRegenerateSingleQuestion,
              onSaveToBank
            )}
          </div>

          {/* Bottom Add Question Button */}
          <div className="no-print mt-8 border-t border-dashed border-slate-300 pt-4 text-center">
            <button
              onClick={onAddNewQuestion}
              className="inline-flex items-center space-x-2 rounded-xl border border-blue-300 bg-blue-50/70 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm câu hỏi mới vào cuối đề</span>
            </button>
          </div>

          {/* Exam End Footer */}
          <div className="text-center mt-8 pt-4 border-t border-slate-200 text-xs italic font-exam text-slate-600">
            --- HẾT ---<br />
            (Cán bộ coi thi không giải thích gì thêm)
          </div>
        </div>
      )}

      {/* Tab 2: BẢNG ĐÁP ÁN */}
      {activeTab === 'answers' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bảng Đáp Án Nhanh – Mã Đề {currentExam.code}</h3>
              <p className="text-xs text-slate-500">Dành cho cán bộ chấm thi và đối chiếu kết quả</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onExportAnswerOnly}
                className="no-print text-xs font-bold text-slate-700 border border-slate-300 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                <span>Xuất Word Đáp Án (.doc)</span>
              </button>
              <button
                onClick={() => (onOpenPrintPreview ? onOpenPrintPreview('answers') : onPrintA4())}
                className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Bảng Đáp Án</span>
              </button>
            </div>
          </div>

          {/* Quick Answers Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 uppercase font-bold text-slate-700">
                <tr>
                  <th className="p-2.5 border border-slate-300 text-center w-14">Câu</th>
                  <th className="p-2.5 border border-slate-300 w-28">Phần thi</th>
                  <th className="p-2.5 border border-slate-300 w-24 text-center">Mức độ</th>
                  <th className="p-2.5 border border-slate-300 w-20 text-center">Điểm</th>
                  <th className="p-2.5 border border-slate-300">Đáp án chính xác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(Array.isArray(currentExam.questions) ? currentExam.questions : []).map((q, idx) => (
                  <tr key={q.id || idx} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                    <td className="p-2.5 border border-slate-300 font-semibold text-slate-600">
                      {q.part === 'part1' ? 'Phần I (TN 4 LC)' : q.part === 'part2' ? 'Phần II (Đ/S)' : q.part === 'part3' ? 'Phần III (Ngắn)' : 'Phần IV (Tự luận)'}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{String(q.level)}</span>
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-blue-700">{q.score}đ</td>
                    <td className="p-2.5 border border-slate-300 font-bold text-emerald-800">
                      {q.type === 'mcq_single' || q.part === 'part1' ? (
                        <span>{String(q.correctAnswer)}</span>
                      ) : q.type === 'true_false_group' || q.part === 'part2' ? (
                        <div className="flex flex-wrap gap-2 text-xs font-mono">
                          {(Array.isArray(q.subItems) ? q.subItems : []).map((s) => (
                            <span key={s.id} className={s.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                              {String(s.label)}: <strong>{s.isCorrect ? 'ĐÚNG' : 'SAI'}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>{String(q.correctAnswer)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Explanations */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Lời Giải Và Phân Tích Chi Tiết Từng Câu</h4>
            {(Array.isArray(currentExam.questions) ? currentExam.questions : []).map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Câu {idx + 1} ({q.score} điểm) – [{String(q.level)}]</span>
                  <span className="text-emerald-700">Đáp án: {String(q.correctAnswer)}</span>
                </div>
                <div className="text-xs text-slate-600 font-exam">
                  <MathRenderer text={String(q.question)} />
                </div>
                <div className="rounded-lg bg-white p-3 border border-slate-200 text-xs text-slate-800 space-y-1">
                  <strong className="text-blue-800 block">Hướng dẫn giải:</strong>
                  <MathRenderer text={String(q.explanation || 'Áp dụng định lý và tính toán theo chuẩn kiến thức.')} />
                </div>
                {q.distractorAnalysis && Object.keys(q.distractorAnalysis).length > 0 && (
                  <div className="rounded-lg bg-amber-50/80 p-3 border border-amber-200 text-xs space-y-1.5">
                    <strong className="text-amber-900 block flex items-center space-x-1.5">
                      <span>🧠 Phân tích bẫy tư duy học sinh hay chọn nhầm:</span>
                    </strong>
                    <div className="space-y-1 text-slate-700">
                      {(Array.isArray(Object.entries(q.distractorAnalysis)) ? Object.entries(q.distractorAnalysis) : []).map(([opt, reason]) => (
                        <div key={opt} className="flex items-start space-x-1.5">
                          <span className="font-bold text-amber-800 shrink-0">Phương án {String(opt)}:</span>
                          <span>{String(reason)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: HƯỚNG DẪN CHẤM */}
      {activeTab === 'rubric' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Hướng Dẫn Chấm Và Biểu Điểm Chi Tiết</h3>
              <p className="text-xs text-slate-500">Quy tắc quy đổi điểm và biểu điểm step-by-step cho phần Tự luận</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onExportAnswerOnly}
                className="no-print text-xs font-bold text-slate-700 border border-slate-300 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                <span>Xuất Word HD Chấm (.doc)</span>
              </button>
              <button
                onClick={() => (onOpenPrintPreview ? onOpenPrintPreview('answers') : onPrintA4())}
                className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Hướng Dẫn Chấm</span>
              </button>
            </div>
          </div>

          {/* Stepped scoring explanation for Part II */}
          {config.sectionCounts.part2 > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 space-y-2">
              <h4 className="font-bold text-blue-900 flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Quy tắc chấm Trắc nghiệm Đúng/Sai (Phần II) theo chuẩn Bộ GD&ĐT:</span>
              </h4>
              <p>Thí sinh trả lời cho 4 lệnh hỏi a, b, c, d của từng câu:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Thí sinh chỉ lựa chọn chính xác <strong>01 ý</strong> trong 1 câu hỏi được: <strong>0,10 điểm</strong>.</li>
                <li>Thí sinh chỉ lựa chọn chính xác <strong>02 ý</strong> trong 1 câu hỏi được: <strong>0,25 điểm</strong>.</li>
                <li>Thí sinh chỉ lựa chọn chính xác <strong>03 ý</strong> trong 1 câu hỏi được: <strong>0,50 điểm</strong>.</li>
                <li>Thí sinh lựa chọn chính xác cả <strong>04 ý</strong> trong 1 câu hỏi được: <strong>1,00 điểm</strong>.</li>
              </ul>
            </div>
          )}

          {/* Essay Rubrics */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Biểu Điểm Tự Luận Từng Bước (Step-by-step)</h4>
            {(Array.isArray(currentExam.questions) ? currentExam.questions : [])
              .filter((q) => q.type === 'essay' || q.part === 'part4')
              .map((q, idx) => (
                <div key={q.id || idx} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Câu Tự luận ({q.score} điểm) – [{String(q.level)}]</span>
                    <span className="text-blue-700">{String(q.topic)}</span>
                  </div>
                  <div className="text-xs text-slate-700 italic font-exam">
                    <MathRenderer text={String(q.question)} />
                  </div>

                  <table className="w-full text-xs border border-slate-300">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-300 w-24 text-center">Bước</th>
                        <th className="p-2 border border-slate-300">Nội dung yêu cầu cần đạt</th>
                        <th className="p-2 border border-slate-300 w-20 text-center">Điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.rubric && q.rubric.length > 0 ? (
                        (Array.isArray(q.rubric) ? q.rubric : []).map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{String(r.step)}</td>
                            <td className="p-2 border border-slate-300">{String(r.detail)}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{r.point}đ</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 border border-slate-300 text-center font-bold">1</td>
                          <td className="p-2 border border-slate-300">{String(q.explanation || 'Trình bày đầy đủ lời giải logic.')}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{q.score}đ</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 4: MA TRẬN ĐỀ KIỂM TRA */}
      {activeTab === 'matrix' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Ma Trận Đề Kiểm Tra Chuẩn GDPT 2018</h3>
              <p className="text-xs text-slate-500">
                Tính toán tự động bằng thuật toán, khớp tuyệt đối 100% với số lượng câu hỏi và tỷ lệ % trong đề
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenMatrixModal && (
                <button
                  onClick={onOpenMatrixModal}
                  className="no-print text-xs font-bold text-indigo-700 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center space-x-1"
                  title="Mở ma trận & bản đặc tả dạng cửa sổ đầy đủ"
                >
                  <span>🔍 Phóng to / Chi tiết</span>
                </button>
              )}
              {onExportMatrixSpecsWord && (
                <button
                  onClick={onExportMatrixSpecsWord}
                  className="no-print text-xs font-bold text-slate-700 border border-slate-300 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center space-x-1"
                  title="Xuất file Word Ma trận & Bản đặc tả riêng biệt"
                >
                  <FileDown className="h-3.5 w-3.5 text-blue-600" />
                  <span>Xuất Word (.doc)</span>
                </button>
              )}
              <button
                onClick={() => (onOpenPrintPreview ? onOpenPrintPreview('matrix') : onPrintA4())}
                className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Ma trận</span>
              </button>
            </div>
          </div>

          <OfficialMatrixTable matrix={matrix} config={config} />
        </div>
      )}

      {/* Tab 5: BẢN ĐẶC TẢ ĐỀ KIỂM TRA */}
      {activeTab === 'spec' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bản Đặc Tả Đề Kiểm Tra Chi Tiết</h3>
              <p className="text-xs text-slate-500">
                Quy định chuẩn năng lực, yêu cầu cần đạt và phân loại dạng câu hỏi theo Thông tư GDPT 2018
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenMatrixModal && (
                <button
                  onClick={onOpenMatrixModal}
                  className="no-print text-xs font-bold text-indigo-700 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center space-x-1"
                  title="Mở ma trận & bản đặc tả dạng cửa sổ đầy đủ"
                >
                  <span>🔍 Phóng to / Chi tiết</span>
                </button>
              )}
              {onExportMatrixSpecsWord && (
                <button
                  onClick={onExportMatrixSpecsWord}
                  className="no-print text-xs font-bold text-slate-700 border border-slate-300 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center space-x-1"
                  title="Xuất file Word Ma trận & Bản đặc tả riêng biệt"
                >
                  <FileDown className="h-3.5 w-3.5 text-blue-600" />
                  <span>Xuất Word (.doc)</span>
                </button>
              )}
              <button
                onClick={() => (onOpenPrintPreview ? onOpenPrintPreview('matrix') : onPrintA4())}
                className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Bản đặc tả</span>
              </button>
            </div>
          </div>

          <OfficialSpecificationTable matrix={matrix} specs={specs} config={config} />
        </div>
      )}

      {/* Tab 6: ĐỀ CƯƠNG ÔN TẬP & CẨM NANG BẮT BẪY THI DÀNH CHO HỌC SINH */}
      {activeTab === 'study_guide' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[11px] uppercase tracking-wide">
                  Tài liệu phát cho học sinh
                </span>
                <span className="text-xs text-slate-400">• Ôn trước giờ G</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-1">
                Đề Cương Ôn Tập & Cẩm Nang Phòng Tránh Bẫy Sai Kinh Điển
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tài liệu bổ trợ phát trực tiếp cho học sinh để hệ thống hóa kiến thức trọng tâm, tránh các bẫy phương án nhiễu & tối ưu thời gian làm bài
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSynthesizeAIStudyGuide}
                disabled={isGeneratingGuide}
                className="no-print text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                title="Dùng Gemini AI tổng hợp chi tiết cẩm nang bẫy thi dựa trên danh sách câu hỏi thực tế"
              >
                <Sparkles className={`h-4 w-4 text-yellow-300 ${isGeneratingGuide ? 'animate-spin' : ''}`} />
                <span>{isGeneratingGuide ? 'AI Đang tổng hợp Cẩm nang...' : '✨ AI Tổng hợp Bắt Bẫy Thi'}</span>
              </button>

              {onExportStudyGuideWord && (
                <button
                  onClick={onExportStudyGuideWord}
                  className="no-print text-xs font-bold text-slate-700 border border-slate-300 bg-white px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center space-x-1 cursor-pointer shadow-2xs"
                  title="Xuất file Word Cẩm nang phát cho học sinh"
                >
                  <FileDown className="h-4 w-4 text-blue-600" />
                  <span>Xuất Word (.doc)</span>
                </button>
              )}

              <button
                onClick={() => (onOpenPrintPreview ? onOpenPrintPreview('study_guide') : onPrintA4())}
                className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <Printer className="h-4 w-4" />
                <span>In Cẩm Nang</span>
              </button>
            </div>
          </div>

          {/* 1. Core Concepts */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                1
              </span>
              <span>💡 Khái Niệm & Từ Khóa Cốt Lõi (Core Concepts)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Array.isArray(studyGuide.coreConcepts) ? studyGuide.coreConcepts : []).map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1">
                  <div className="font-bold text-xs text-blue-900 flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    <span>{item.term}</span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed font-exam pl-3">
                    <MathRenderer text={item.definition} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Key Formulas */}
          {studyGuide.keyFormulas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                  2
                </span>
                <span>📐 Bảng Công Thức Vàng & Quy Tắc Giải Nhanh</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5 border-b border-r border-slate-200 text-left w-1/4">Tên quy tắc / công thức</th>
                      <th className="p-2.5 border-b border-r border-slate-200 text-center w-2/5">Biểu thức toán / khoa học</th>
                      <th className="p-2.5 border-b border-slate-200 text-left">Ghi chú & Mẹo vận dụng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(Array.isArray(studyGuide.keyFormulas) ? studyGuide.keyFormulas : []).map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{f.name}</td>
                        <td className="p-2.5 border-r border-slate-200 font-exam text-center font-bold text-indigo-900 bg-indigo-50/30">
                          <MathRenderer text={f.formula} />
                        </td>
                        <td className="p-2.5 text-slate-600">{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. 🔥 CRITICAL PITFALL & TRAP HANDBOOK */}
          {studyGuide.trapList && studyGuide.trapList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-700 text-xs font-bold">
                    3
                  </span>
                  <span className="text-rose-900 font-extrabold">🔥 CẨM NANG BẪY SAI KINHDIỂN VÀ BÍ QUYẾT PHÒNG TRÁNH</span>
                </h4>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  ⚠️ Trọng tâm phát học sinh
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(Array.isArray(studyGuide.trapList) ? studyGuide.trapList : []).map((trap, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-rose-900 flex items-center space-x-1.5">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>Bẫy #{idx + 1}: {trap.trapType}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 leading-relaxed pl-5">
                      <MathRenderer text={trap.description} />
                    </div>

                    {trap.exampleQuestion && (
                      <div className="ml-5 p-2 rounded-lg bg-white/80 border border-rose-200/60 text-[11px] italic text-slate-600">
                        <span className="font-bold text-slate-700 not-italic">Ví dụ trong đề: </span>
                        <MathRenderer text={trap.exampleQuestion} />
                      </div>
                    )}

                    <div className="ml-5 pt-1 flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Bí quyết phòng tránh: </span>
                      <span className="font-normal text-emerald-900"><MathRenderer text={trap.avoidanceTip} /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Common Mistakes */}
          {studyGuide.commonMistakes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                  4
                </span>
                <span>⚠️ Lỗi Tác Phong & Sai Lầm Thường Gặp Khi Tô Phiếu</span>
              </h4>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                {(Array.isArray(studyGuide.commonMistakes) ? studyGuide.commonMistakes : []).map((mistake, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-amber-950">
                    <span className="font-bold text-amber-700 shrink-0">•</span>
                    <span><MathRenderer text={mistake} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Time Strategy */}
          {studyGuide.timeStrategy && studyGuide.timeStrategy.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                  5
                </span>
                <span>⏰ Phân Bổ Thời Gian & Chiến Thuật Từng Dạng Đề GDPT 2018</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Array.isArray(studyGuide.timeStrategy) ? studyGuide.timeStrategy : []).map((ts, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <div className="font-bold text-xs text-emerald-900">{ts.partTitle}</div>
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded w-fit">
                      ⏱ {ts.timeAlloc}
                    </div>
                    <p className="text-xs text-slate-700 pt-1 leading-relaxed">{ts.strategy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Pre-Exam Readiness Checklist */}
          {studyGuide.readinessChecklist && studyGuide.readinessChecklist.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                  6
                </span>
                <span>✅ Checklist Tự Kiểm Tra Kiến Thức Trước Giờ G</span>
              </h4>
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-2">
                {(Array.isArray(studyGuide.readinessChecklist) ? studyGuide.readinessChecklist : []).map((chk, idx) => (
                  <label key={idx} className="flex items-center space-x-2.5 text-xs text-indigo-950 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" defaultChecked />
                    <span><MathRenderer text={chk} /></span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 7. Review Tips & Teacher Notes */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-xs font-bold">
                7
              </span>
              <span>🎯 Lời Dặn Của Giáo Viên & Bí Quyết Bứt Phá Điểm Số</span>
            </h4>
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
              {(Array.isArray(studyGuide.reviewTips) ? studyGuide.reviewTips : []).map((tip, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-teal-950">
                  <span className="font-bold text-teal-700 shrink-0">✔</span>
                  <span><MathRenderer text={tip} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Render Question Blocks for Tab 1 with inline mini-tools
 */
function renderExamQuestions(
  questions: QuestionItem[],
  onEdit: (q: QuestionItem) => void,
  onDelete: (id: string) => void,
  onRegenerate: (q: QuestionItem) => void,
  onSaveBank: (q: QuestionItem) => void
) {
  let currentPart = '';
  let questionNumber = 1;

  return questions.map((q) => {
    let showPartHeader = false;
    let partTitle = '';

    if (q.part !== currentPart) {
      currentPart = q.part;
      showPartHeader = true;

      if (q.part === 'part1') {
        partTitle = 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn';
      } else if (q.part === 'part2') {
        partTitle = 'PHẦN II. Câu trắc nghiệm Đúng/Sai (Mỗi câu gồm 4 ý a, b, c, d; chọn Đúng hoặc Sai cho từng ý)';
      } else if (q.part === 'part3') {
        partTitle = 'PHẦN III. Câu trắc nghiệm trả lời ngắn (Học sinh điền kết quả vào phiếu)';
      } else {
        partTitle = 'PHẦN IV. Câu hỏi Tự luận';
      }
    }

    const currentNum = questionNumber++;

    return (
      <React.Fragment key={q.id}>
        {showPartHeader && (
          <div className="pt-4 pb-2 border-b-2 border-slate-300 mb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base uppercase tracking-wide">
              {partTitle}
            </h3>
          </div>
        )}

        {/* Clustered passage if available */}
        {q.passage && (
          <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-blue-600 my-2 text-xs sm:text-sm italic text-slate-800 leading-relaxed">
            <strong className="block text-blue-900 font-sans not-italic mb-1">
              Đọc đoạn trích / ngữ liệu sau và trả lời các câu hỏi:
            </strong>
            <MathRenderer text={q.passage} />
          </div>
        )}

        {/* Question Container */}
        <div className="group relative rounded-xl p-3 sm:p-4 hover:bg-blue-50/30 border border-transparent hover:border-blue-200 transition">
          {/* Mini Toolbar on Hover */}
          <div className="no-print absolute right-2 top-2 flex sm:opacity-0 sm:group-hover:opacity-100 items-center space-x-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-md z-10 transition-opacity">
            <button
              onClick={() => onRegenerate(q)}
              className="p-1.5 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
              title="Tạo lại riêng câu này với AI"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(q)}
              className="p-1.5 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
              title="Chỉnh sửa trực tiếp câu hỏi"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onSaveBank(q)}
              className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
              title="Lưu câu hỏi này vào ngân hàng cá nhân"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(q.id)}
              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Xóa câu hỏi này khỏi đề thi"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Question Text */}
          <div className="flex items-start space-x-2">
            <span className="font-bold text-slate-900 shrink-0">
              Câu {currentNum} ({q.score} điểm):
            </span>
            <div className="flex-1 font-medium text-slate-900">
              <MathRenderer text={q.question} />

              {/* Warning badge */}
              {q.needsReview && (
                <span className="no-print ml-2 inline-flex items-center space-x-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  <span>⚠ Cần GV kiểm tra</span>
                </span>
              )}
            </div>
          </div>

          {/* Part I: 4 Options */}
          {(q.type === 'mcq_single' || q.part === 'part1') && q.options && q.options.length === 4 && (
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pl-4 sm:pl-6">
              {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                <div key={letter} className="flex items-start space-x-1.5">
                  <span className="font-bold text-slate-800 shrink-0">{letter}.</span>
                  <span>
                    <MathRenderer text={q.options![optIdx]} />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Part II: 4 True/False Sub-items */}
          {(q.type === 'true_false_group' || q.part === 'part2') && q.subItems && (
            <div className="mt-2.5 space-y-1.5 pl-4 sm:pl-6 text-xs sm:text-sm">
              {q.subItems.map((sub) => (
                <div key={sub.id} className="flex items-start space-x-2">
                  <span className="font-bold text-slate-800 shrink-0">{sub.label})</span>
                  <div className="flex-1">
                    <MathRenderer text={sub.statement} />
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-tighter">
                    <span>Đúng</span>
                    <div className="h-4 w-4 rounded-full border border-slate-300"></div>
                    <span>Sai</span>
                    <div className="h-4 w-4 rounded-full border border-slate-300"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Part III: Short Answer */}
          {(q.type === 'short_answer' || q.part === 'part3') && (
            <div className="mt-3 pl-4 sm:pl-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Trả lời:</span>
                <div className="flex-1 border-b border-dashed border-slate-400 h-5"></div>
              </div>
            </div>
          )}

          {/* Part IV: Essay */}
          {(q.type === 'essay' || q.part === 'part4') && (
            <div className="mt-3 pl-4 sm:pl-6 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phần trả lời tự luận của học sinh:</div>
              <div className="border border-dashed border-slate-200 rounded-lg h-32 bg-slate-50/30"></div>
            </div>
          )}
        </div>
      </React.Fragment>
    );
  });
}

export default Workspace;

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  QuestionItem,
  ExamConfig,
  ExamMatrix,
  ExamSpecificationRow,
  ShuffledExamCode,
  QAReport,
} from '../types/exam';
import MathRenderer from '../utils/mathRenderer';

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
  onExportExamOnly: () => void;
  onExportAnswerOnly: () => void;
  onExportFullWord: () => void;
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
  onExportExamOnly,
  onExportAnswerOnly,
  onExportFullWord,
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
}) => {
  const [activeTab, setActiveTab] = useState<'exam' | 'answers' | 'rubric' | 'matrix' | 'spec'>('exam');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showWordMenu, setShowWordMenu] = useState(false);

  const currentExam = shuffledCodes.find((c) => c.code === activeCode) || {
    code: '101',
    questions,
    quickAnswers: [],
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
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
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
          </div>

          {/* Export Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Shuffled Code selector */}
            {shuffledCodes.length > 1 && (
              <div className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <span className="text-[10px] font-bold text-slate-500 px-1">Mã đề:</span>
                {shuffledCodes.map((sc) => (
                  <button
                    key={sc.code}
                    onClick={() => onSelectCode(sc.code)}
                    className={`rounded px-2 py-0.5 text-xs font-bold transition ${
                      activeCode === sc.code
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
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
                  <div className="border-t my-1"></div>
                  <button
                    onClick={() => {
                      onExportFullWord();
                      setShowWordMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <span>📦</span>
                    <span>Xuất Trọn bộ Hồ sơ (Đề+ĐA+Ma trận)</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onPrintA4}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>In A4 / PDF</span>
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

      {/* 5 Tab Navigation */}
      <div className="no-print border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'exam', label: '1. Đề Kiểm Tra', icon: FileText, count: questions.length },
            { id: 'answers', label: '2. Bảng Đáp Án', icon: CheckCircle },
            { id: 'rubric', label: '3. Hướng Dẫn Chấm', icon: HelpCircle },
            { id: 'matrix', label: '4. Ma Trận Đề', icon: Grid },
            { id: 'spec', label: '5. Bản Đặc Tả', icon: ListTree },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                    {tab.count} câu
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
          {/* Exam Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex justify-between items-start text-xs sm:text-sm font-exam leading-tight">
              <div className="text-center w-5/12">
                <div className="font-bold uppercase tracking-wider">{config.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</div>
                <div className="font-semibold uppercase text-xs">TRƯỜNG THPT / THCS CHUYÊN</div>
                <div className="mt-1 font-bold">MÃ ĐỀ THI: {currentExam.code}</div>
              </div>
              <div className="text-center w-7/12">
                <div className="font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-semibold underline">Độc lập – Tự do – Hạnh phúc</div>
                <div className="text-[11px] italic mt-1">Chuẩn Chương trình GDPT 2018</div>
              </div>
            </div>

            <div className="text-center mt-5">
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide font-exam text-slate-900">
                {config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ'}
              </h2>
              <div className="text-sm font-bold uppercase font-exam text-slate-800 mt-0.5">
                MÔN: {config.customSubject || config.subject} – {config.gradeLevel === 'primary' ? `KHỐI ${config.grade}` : `LỚP ${config.grade}`}
              </div>
              <div className="text-xs italic text-slate-600 font-exam mt-1">
                Bộ sách: {config.textbook} • Thời gian làm bài: {config.durationMinutes} phút (Không kể phát đề)
              </div>
            </div>

            {/* Student info box */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-exam p-2 border border-slate-300 rounded">
              <div>
                Họ và tên thí sinh: ................................................................ Lớp: ................
              </div>
              <div>Số báo danh: ............................................................................................</div>
            </div>

            {/* Teacher comment and score box */}
            <div className="mt-2 grid grid-cols-3 border border-slate-400 text-center text-xs font-exam">
              <div className="p-2 border-r border-slate-400">
                <div className="font-bold uppercase">Điểm số</div>
                <div className="h-10 flex items-center justify-center text-slate-400 italic">(Bằng số & chữ)</div>
              </div>
              <div className="col-span-2 p-2">
                <div className="font-bold uppercase">Lời phê của giáo viên</div>
                <div className="h-10"></div>
              </div>
            </div>
          </div>

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
            <button
              onClick={onPrintA4}
              className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
            >
              In bảng đáp án
            </button>
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
                {currentExam.questions.map((q, idx) => (
                  <tr key={q.id || idx} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                    <td className="p-2.5 border border-slate-300 font-semibold text-slate-600">
                      {q.part === 'part1' ? 'Phần I (TN 4 LC)' : q.part === 'part2' ? 'Phần II (Đ/S)' : q.part === 'part3' ? 'Phần III (Ngắn)' : 'Phần IV (Tự luận)'}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{q.level}</span>
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-blue-700">{q.score}đ</td>
                    <td className="p-2.5 border border-slate-300 font-bold text-emerald-800">
                      {q.type === 'mcq_single' || q.part === 'part1' ? (
                        <span>{String(q.correctAnswer)}</span>
                      ) : q.type === 'true_false_group' || q.part === 'part2' ? (
                        <div className="flex flex-wrap gap-2 text-xs font-mono">
                          {q.subItems?.map((s) => (
                            <span key={s.id} className={s.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                              {s.label}: <strong>{s.isCorrect ? 'ĐÚNG' : 'SAI'}</strong>
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
            {currentExam.questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Câu {idx + 1} ({q.score} điểm) – [{q.level}]</span>
                  <span className="text-emerald-700">Đáp án: {String(q.correctAnswer)}</span>
                </div>
                <div className="text-xs text-slate-600 font-exam">
                  <MathRenderer text={q.question} />
                </div>
                <div className="rounded-lg bg-white p-3 border border-slate-200 text-xs text-slate-800 space-y-1">
                  <strong className="text-blue-800 block">Hướng dẫn giải:</strong>
                  <MathRenderer text={q.explanation || 'Áp dụng định lý và tính toán theo chuẩn kiến thức.'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: HƯỚNG DẪN CHẤM */}
      {activeTab === 'rubric' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-800 text-base">Hướng Dẫn Chấm Và Biểu Điểm Chi Tiết</h3>
            <p className="text-xs text-slate-500">Quy tắc quy đổi điểm và biểu điểm step-by-step cho phần Tự luận</p>
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
            {currentExam.questions
              .filter((q) => q.type === 'essay' || q.part === 'part4')
              .map((q, idx) => (
                <div key={q.id || idx} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Câu Tự luận ({q.score} điểm) – [{q.level}]</span>
                    <span className="text-blue-700">{q.topic}</span>
                  </div>
                  <div className="text-xs text-slate-700 italic font-exam">
                    <MathRenderer text={q.question} />
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
                        q.rubric.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{r.step}</td>
                            <td className="p-2 border border-slate-300">{r.detail}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{r.point}đ</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 border border-slate-300 text-center font-bold">1</td>
                          <td className="p-2 border border-slate-300">{q.explanation || 'Trình bày đầy đủ lời giải logic.'}</td>
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
            <button
              onClick={onPrintA4}
              className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
            >
              In Ma trận
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-center border-collapse">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th rowSpan={2} className="p-2.5 border border-slate-300 w-12">TT</th>
                  <th rowSpan={2} className="p-2.5 border border-slate-300 text-left min-w-[200px]">
                    Chủ đề / Đơn vị kiến thức
                  </th>
                  {matrix.levels.map((lvl) => (
                    <th key={lvl} colSpan={2} className="p-2 border border-slate-300">
                      {lvl}
                    </th>
                  ))}
                  <th colSpan={2} className="p-2 border border-slate-300 bg-blue-50 text-blue-900">
                    Tổng cộng
                  </th>
                </tr>
                <tr className="bg-slate-50 text-[11px]">
                  {matrix.levels.map((lvl) => (
                    <React.Fragment key={`${lvl}-sub`}>
                      <th className="p-1.5 border border-slate-300 w-14">Số câu</th>
                      <th className="p-1.5 border border-slate-300 w-14">Điểm</th>
                    </React.Fragment>
                  ))}
                  <th className="p-1.5 border border-slate-300 w-16 bg-blue-50">Số câu</th>
                  <th className="p-1.5 border border-slate-300 w-16 bg-blue-50">Tỉ lệ %</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-2 border border-slate-300 font-bold">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 text-left font-medium text-slate-800">{row.topic}</td>
                    {matrix.levels.map((lvl) => {
                      const count =
                        (row.part1[lvl] || 0) +
                        (row.part2[lvl] || 0) +
                        (row.part3[lvl] || 0) +
                        (row.part4[lvl] || 0);
                      return (
                        <React.Fragment key={`${idx}-${lvl}`}>
                          <td className="p-2 border border-slate-300 font-bold text-slate-700">
                            {count > 0 ? count : '-'}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-500">
                            {count > 0 ? `${(count * 0.25).toFixed(2)}` : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-2 border border-slate-300 font-extrabold text-blue-800 bg-blue-50/30">
                      {row.totalQuestions}
                    </td>
                    <td className="p-2 border border-slate-300 font-extrabold text-blue-800 bg-blue-50/30">
                      {row.percent}%
                    </td>
                  </tr>
                ))}

                {/* Grand Total Row */}
                <tr className="bg-blue-100/70 font-extrabold text-slate-900">
                  <td colSpan={2} className="p-2.5 border border-slate-300 uppercase tracking-wider text-center">
                    Tổng Toàn Đề
                  </td>
                  {matrix.levels.map((lvl) => {
                    const data = matrix.totalByLevel[lvl] || { count: 0, score: 0 };
                    return (
                      <React.Fragment key={`tot-${lvl}`}>
                        <td className="p-2.5 border border-slate-300">{data.count}</td>
                        <td className="p-2.5 border border-slate-300">{data.score}đ</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="p-2.5 border border-slate-300 text-blue-900 font-black">
                    {matrix.grandTotal.count}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-blue-900 font-black">
                    100% ({matrix.grandTotal.score}đ)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
            <button
              onClick={onPrintA4}
              className="no-print text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
            >
              In Bản đặc tả
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left border-collapse">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="p-2.5 border border-slate-300 w-12 text-center">TT</th>
                  <th className="p-2.5 border border-slate-300 w-44">Chủ đề</th>
                  <th className="p-2.5 border border-slate-300">Yêu cầu cần đạt / Mức độ đánh giá</th>
                  <th className="p-2.5 border border-slate-300 w-40">Dạng câu hỏi</th>
                  <th className="p-2.5 border border-slate-300 w-24 text-center">Mức độ</th>
                  <th className="p-2.5 border border-slate-300 w-16 text-center">Số câu</th>
                  <th className="p-2.5 border border-slate-300 w-16 text-center">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {specs.map((spec) => (
                  <tr key={spec.id} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-slate-700">{spec.stt}</td>
                    <td className="p-2.5 border border-slate-300 font-semibold text-slate-800">{spec.topic}</td>
                    <td className="p-2.5 border border-slate-300 text-slate-700 leading-relaxed">{spec.competency}</td>
                    <td className="p-2.5 border border-slate-300 font-medium text-slate-600">{spec.questionType}</td>
                    <td className="p-2.5 border border-slate-300 text-center">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{spec.level}</span>
                    </td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold">{spec.questionCount}</td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-blue-700">{spec.score}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="no-print absolute right-3 top-3 hidden group-hover:flex items-center space-x-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-md z-10">
            <button
              onClick={() => onRegenerate(q)}
              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
              title="Tạo lại riêng câu này với AI"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(q)}
              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
              title="Chỉnh sửa trực tiếp"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onSaveBank(q)}
              className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
              title="Lưu vào ngân hàng câu hỏi"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(q.id)}
              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Xóa câu hỏi này"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </React.Fragment>
    );
  });
}

export default Workspace;

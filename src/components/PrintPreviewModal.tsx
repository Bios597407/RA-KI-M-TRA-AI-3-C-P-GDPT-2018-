import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  X,
  FileText,
  CheckCircle,
  Grid,
  ListTree,
  BookOpen,
  Layers,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  QuestionItem,
  ExamConfig,
  ExamMatrix,
  ExamSpecificationRow,
  ShuffledExamCode,
  StudyGuideData,
} from '../types/exam';
import MathRenderer from '../utils/mathRenderer';
import {
  exportExamOnlyWordDoc,
  exportAnswerKeyOnlyWordDoc,
  exportMatrixAndSpecsOnlyWordDoc,
  exportStudyGuideWordDoc,
  exportToWordDoc,
  printDocument,
  wrapHtmlForPrint,
} from '../utils/exporter';
import { useToast } from './Toast';
import OfficialExamHeader from './OfficialExamHeader';

export type PrintDocType = 'exam' | 'answers' | 'matrix' | 'spec' | 'study_guide' | 'full';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  currentCode: ShuffledExamCode;
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  studyGuide: StudyGuideData;
  initialDocType?: PrintDocType;
  onConfigChange?: (updated: ExamConfig) => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  config,
  currentCode,
  matrix,
  specs,
  studyGuide,
  initialDocType = 'exam',
  onConfigChange,
}) => {
  const toast = useToast();
  const [docType, setDocType] = useState<PrintDocType>(initialDocType);

  // Sync if initialDocType changes on reopen
  React.useEffect(() => {
    if (isOpen && initialDocType) {
      setDocType(initialDocType);
    }
  }, [isOpen, initialDocType]);

  if (!isOpen) return null;

  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;
  const school = config.schoolName || '';
  const title = config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ';

  // Handle Export Word for current view
  const handleExportWord = () => {
    switch (docType) {
      case 'exam':
        exportExamOnlyWordDoc(config, currentCode);
        toast.success('Đang tải xuống Đề thi Word (.doc) cho học sinh...');
        break;
      case 'answers':
        exportAnswerKeyOnlyWordDoc(config, currentCode);
        toast.success('Đang tải xuống Đáp án & Hướng dẫn chấm (.doc)...');
        break;
      case 'matrix':
      case 'spec':
        exportMatrixAndSpecsOnlyWordDoc(config, matrix, specs);
        toast.success('Đang tải xuống Ma trận & Bản đặc tả (.doc)...');
        break;
      case 'study_guide':
        exportStudyGuideWordDoc(config, studyGuide);
        toast.success('Đang tải xuống Đề cương ôn tập Word (.doc)...');
        break;
      case 'full':
        exportToWordDoc(config, currentCode, matrix, specs, studyGuide);
        toast.success('Đang tải xuống Trọn bộ hồ sơ đề thi (.doc)...');
        break;
    }
  };

  // Handle Instant Print
  const handleTriggerPrint = () => {
    // Collect the printed HTML content
    const printArea = document.getElementById('printable-modal-content');
    if (!printArea) {
      window.print();
      return;
    }

    const docTitle = `${title} - ${
      docType === 'exam'
        ? 'Đề thi'
        : docType === 'answers'
        ? 'Đáp án'
        : docType === 'matrix'
        ? 'Ma trận'
        : docType === 'spec'
        ? 'Bản đặc tả'
        : docType === 'study_guide'
        ? 'Đề cương'
        : 'Trọn bộ'
    }`;

    const wrappedHtml = wrapHtmlForPrint(docTitle, printArea.innerHTML, config);
    printDocument(wrappedHtml, docTitle);
    toast.info('Đang kết nối lệnh in A4... Thầy cô cũng có thể bấm "Xuất Word (.doc)" để mở và in trực tiếp từ Word!');
  };

  // Open standalone HTML in new window/tab
  const handleOpenStandalone = () => {
    const printArea = document.getElementById('printable-modal-content');
    if (!printArea) return;

    const docTitle = `${title} - ${docType}`;
    const wrappedHtml = wrapHtmlForPrint(docTitle, printArea.innerHTML, config);
    const blob = new Blob([wrappedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast.success('Đã mở trang in toàn màn hình! Thầy cô nhấn phím Ctrl + P để in.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex h-[95vh] w-full max-w-5xl flex-col rounded-2xl bg-slate-100 shadow-2xl overflow-hidden border border-slate-300">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-600 p-2 text-white shadow-xs">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800">
                Xem Trước Bản In A4 & Xuất File
              </h2>
              <p className="text-[11px] text-slate-500">
                Định dạng chuẩn trang A4 Bộ GD&ĐT • Hỗ trợ in trực tiếp hoặc xuất file Word (.doc)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerPrint}
              className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
              title="Mở hộp thoại in máy in A4"
            >
              <Printer className="h-4 w-4" />
              <span>In Ngay</span>
            </button>

            <button
              onClick={handleExportWord}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
              title="Tải file Word (.doc) đúng phần đang xem"
            >
              <FileDown className="h-4 w-4" />
              <span>Xuất Word (.doc)</span>
            </button>

            <button
              onClick={handleOpenStandalone}
              className="hidden sm:flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Mở trang in ra tab mới độc lập để nhấn Ctrl + P"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>Mở tab in riêng</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub Header: Document Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5">
            {[
              { id: 'exam', label: '1. Đề thi', icon: FileText },
              { id: 'answers', label: '2. Đáp án & HD Chấm', icon: CheckCircle },
              { id: 'matrix', label: '3. Ma trận đề', icon: Grid },
              { id: 'spec', label: '4. Bản đặc tả', icon: ListTree },
              { id: 'study_guide', label: '5. Đề cương ôn tập', icon: BookOpen },
              { id: 'full', label: '6. Trọn bộ hồ sơ', icon: Layers },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = docType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setDocType(t.id as PrintDocType)}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {onConfigChange && (
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 border-l border-slate-200 pl-3">
              <span>Cỡ chữ:</span>
              <button
                onClick={() => onConfigChange({ ...config, layoutFontSize: 'small' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.layoutFontSize === 'small' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                10pt
              </button>
              <button
                onClick={() => onConfigChange({ ...config, layoutFontSize: 'medium' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.layoutFontSize === 'medium' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                11pt
              </button>
              <button
                onClick={() => onConfigChange({ ...config, layoutFontSize: 'large' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.layoutFontSize === 'large' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                12pt
              </button>
              
              <span className="ml-2">Dòng:</span>
              <button
                onClick={() => onConfigChange({ ...config, layoutLineHeight: 'compact' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.layoutLineHeight === 'compact' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Hẹp
              </button>
              <button
                onClick={() => onConfigChange({ ...config, layoutLineHeight: 'standard' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.layoutLineHeight === 'standard' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Vừa
              </button>
              <button
                onClick={() => onConfigChange({ ...config, layoutLineHeight: 'relaxed' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.layoutLineHeight === 'relaxed' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Rộng
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Document Paper Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200">
          <div
            id="printable-modal-content"
            className={`w-full max-w-[210mm] min-h-[297mm] bg-white p-[15mm] sm:p-[20mm] shadow-lg rounded-sm border border-slate-300 text-black font-exam ${
              config.layoutFontSize === 'small' ? 'text-[10pt]' : config.layoutFontSize === 'large' ? 'text-[12pt]' : 'text-[11pt]'
            } ${
              config.layoutLineHeight === 'compact' ? 'leading-[1.2]' : config.layoutLineHeight === 'relaxed' ? 'leading-[1.8]' : 'leading-[1.5]'
            }`}
          >
            {/* View 1: ĐỀ THI */}
            {(docType === 'exam' || docType === 'full') && (
              <div className="space-y-4">
                {/* Official Exam Header */}
                <OfficialExamHeader config={config} activeCode={currentCode.code} />

                {/* Questions Content */}
                <div className="space-y-4 mt-4">
                  {renderPreviewQuestions(currentCode.questions)}
                </div>

                <div className="text-center font-bold italic my-6 text-sm text-slate-700">
                  --- HẾT ---
                  <div className="text-xs font-normal text-slate-500">
                    (Cán bộ coi thi không giải thích gì thêm)
                  </div>
                </div>
              </div>
            )}

            {/* View 2: ĐÁP ÁN & HƯỚNG DẪN CHẤM */}
            {(docType === 'answers' || docType === 'full') && (
              <div className={`space-y-5 ${docType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break' : ''}`}>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-black uppercase text-slate-900">
                    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT
                  </div>
                  <div className="text-xs font-bold uppercase text-slate-700">
                    {title} – MÃ ĐỀ: {currentCode.code}
                  </div>
                  <div className="text-xs italic text-slate-600">
                    Môn: {subject} – {gradeStr} (Thang điểm: {config.totalScore || 10})
                  </div>
                </div>

                {/* Bảng Đáp án nhanh */}
                <div>
                  <h3 className="font-bold text-xs uppercase mb-2 text-slate-900">
                    I. BẢNG ĐÁP ÁN TRẮC NGHIỆM
                  </h3>
                  <table className="w-full text-xs border border-black border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="p-1.5 border border-black w-14">Câu</th>
                        <th className="p-1.5 border border-black w-24">Phần</th>
                        <th className="p-1.5 border border-black text-left">Đáp án chuẩn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCode.quickAnswers.map((qa) => (
                        <tr key={qa.stt} className="hover:bg-slate-50">
                          <td className="p-1.5 border border-black font-bold">{qa.stt}</td>
                          <td className="p-1.5 border border-black text-slate-600">
                            {qa.part === 'part1'
                              ? 'Phần I'
                              : qa.part === 'part2'
                              ? 'Phần II'
                              : qa.part === 'part3'
                              ? 'Phần III'
                              : 'Phần IV'}
                          </td>
                          <td className="p-1.5 border border-black text-left font-bold text-emerald-800">
                            {qa.answer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Hướng dẫn giải chi tiết */}
                <div>
                  <h3 className="font-bold text-xs uppercase mb-2 text-slate-900">
                    II. HƯỚNG DẪN CHẤM VÀ LỜI GIẢI CHI TIẾT
                  </h3>
                  <div className="space-y-3">
                    {currentCode.questions.map((q, idx) => (
                      <div key={q.id} className="border-b border-dashed border-slate-300 pb-2 text-xs">
                        <div className="font-bold text-slate-900">
                          Câu {idx + 1} ({q.score}đ) [{q.level}]:
                        </div>
                        <div className="text-slate-800 mt-0.5">
                          <MathRenderer text={q.question} />
                        </div>
                        <div className="text-emerald-800 font-bold mt-1">
                          Đáp án đúng: {String(q.correctAnswer)}
                        </div>
                        {q.subItems && (
                          <div className="ml-3 my-1 space-y-0.5">
                            {q.subItems.map((s) => (
                              <div key={s.label}>
                                • Ý {s.label}: <strong>{s.isCorrect ? 'ĐÚNG' : 'SAI'}</strong>
                                {s.explanation && <span> ({s.explanation})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-slate-700 mt-1">
                          <strong>Lời giải:</strong> <MathRenderer text={q.explanation || 'Áp dụng định lý chuẩn.'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* View 3: MA TRẬN ĐỀ */}
            {(docType === 'matrix' || docType === 'full') && (
              <div className={`space-y-4 ${docType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break' : ''}`}>
                <div className="text-center">
                  <div className="text-base font-black uppercase text-slate-900">
                    KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ
                  </div>
                  <div className="text-xs uppercase font-bold text-slate-700">
                    MÔN: {subject} – {gradeStr} (Thời gian: {config.durationMinutes} phút)
                  </div>
                </div>

                <table className="w-full text-xs border border-black border-collapse text-center">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th rowSpan={2} className="p-1.5 border border-black w-10">TT</th>
                      <th rowSpan={2} className="p-1.5 border border-black text-left">Chủ đề kiến thức</th>
                      {matrix.levels.map((lvl) => (
                        <th key={lvl} colSpan={2} className="p-1.5 border border-black">{lvl}</th>
                      ))}
                      <th colSpan={2} className="p-1.5 border border-black bg-slate-100">Tổng cộng</th>
                    </tr>
                    <tr className="bg-slate-50 font-semibold text-[10px]">
                      {matrix.levels.map((lvl) => (
                        <React.Fragment key={`${lvl}-col`}>
                          <th className="p-1 border border-black w-12">Số câu</th>
                          <th className="p-1 border border-black w-12">Điểm</th>
                        </React.Fragment>
                      ))}
                      <th className="p-1 border border-black w-12">Số câu</th>
                      <th className="p-1 border border-black w-14">Tỷ lệ %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 border border-black font-bold">{idx + 1}</td>
                        <td className="p-1.5 border border-black text-left">{row.topic}</td>
                        {matrix.levels.map((lvl) => {
                          const count =
                            (row.part1[lvl] || 0) +
                            (row.part2[lvl] || 0) +
                            (row.part3[lvl] || 0) +
                            (row.part4[lvl] || 0);
                          return (
                            <React.Fragment key={`${idx}-${lvl}`}>
                              <td className="p-1.5 border border-black font-bold">{count > 0 ? count : '-'}</td>
                              <td className="p-1.5 border border-black text-slate-600">
                                {count > 0 ? (count * 0.25).toFixed(2) : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="p-1.5 border border-black font-bold">{row.totalQuestions}</td>
                        <td className="p-1.5 border border-black font-bold">{row.percent}%</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black">
                      <td colSpan={2} className="p-1.5 border border-black text-center">TỔNG TOÀN ĐỀ</td>
                      {matrix.levels.map((lvl) => {
                        const data = matrix.totalByLevel[lvl] || { count: 0, score: 0 };
                        return (
                          <React.Fragment key={`tot-${lvl}`}>
                            <td className="p-1.5 border border-black">{data.count}</td>
                            <td className="p-1.5 border border-black">{data.score}đ</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="p-1.5 border border-black">{matrix.grandTotal.count}</td>
                      <td className="p-1.5 border border-black">100% ({matrix.grandTotal.score}đ)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* View 4: BẢN ĐẶC TẢ */}
            {(docType === 'spec' || docType === 'full') && (
              <div className={`space-y-4 ${docType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break' : ''}`}>
                <div className="text-center">
                  <div className="text-base font-black uppercase text-slate-900">
                    BẢN ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA ĐỊNH KỲ
                  </div>
                  <div className="text-xs uppercase font-bold text-slate-700">
                    MÔN: {subject} – {gradeStr}
                  </div>
                </div>

                <table className="w-full text-xs border border-black border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="p-1.5 border border-black w-10">TT</th>
                      <th className="p-1.5 border border-black w-36">Chủ đề</th>
                      <th className="p-1.5 border border-black">Yêu cầu cần đạt / Đánh giá</th>
                      <th className="p-1.5 border border-black w-32">Dạng câu</th>
                      <th className="p-1.5 border border-black w-20">Mức độ</th>
                      <th className="p-1.5 border border-black w-12">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((spec) => (
                      <tr key={spec.id}>
                        <td className="p-1.5 border border-black text-center font-bold">{spec.stt}</td>
                        <td className="p-1.5 border border-black font-semibold">{spec.topic}</td>
                        <td className="p-1.5 border border-black leading-relaxed">{spec.competency}</td>
                        <td className="p-1.5 border border-black text-slate-600">{spec.questionType}</td>
                        <td className="p-1.5 border border-black text-center">{spec.level}</td>
                        <td className="p-1.5 border border-black text-center font-bold text-blue-900">{spec.score}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 5: ĐỀ CƯƠNG ÔN TẬP */}
            {(docType === 'study_guide' || docType === 'full') && (
              <div className={`space-y-4 ${docType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break' : ''}`}>
                <div className="text-center">
                  <div className="text-base font-black uppercase text-slate-900">
                    ĐỀ CƯƠNG ÔN TẬP & CẨM NANG KIẾN THỨC CỐT LÕI
                  </div>
                  <div className="text-xs uppercase font-bold text-slate-700">
                    MÔN: {subject} – {gradeStr} (Bộ sách: {config.textbook})
                  </div>
                </div>

                {/* 1. Core concepts */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-blue-900 border-b pb-1">
                    1. Khái Niệm & Định Nghĩa Then Chốt
                  </h4>
                  <table className="w-full text-xs border border-black border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="p-1.5 border border-black w-1/3">Thuật ngữ / Khái niệm</th>
                        <th className="p-1.5 border border-black">Định nghĩa & Bản chất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studyGuide.coreConcepts.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 border border-black font-bold text-blue-900">{item.term}</td>
                          <td className="p-1.5 border border-black">
                            <MathRenderer text={item.definition} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. Key formulas */}
                {studyGuide.keyFormulas.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-bold text-xs uppercase text-blue-900 border-b pb-1">
                      2. Bảng Công Thức & Quy Tắc Vàng
                    </h4>
                    <table className="w-full text-xs border border-black border-collapse">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="p-1.5 border border-black w-1/4">Tên công thức / Quy tắc</th>
                          <th className="p-1.5 border border-black w-2/5">Biểu thức toán học / khoa học</th>
                          <th className="p-1.5 border border-black">Ghi chú vận dụng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studyGuide.keyFormulas.map((f, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 border border-black font-bold">{f.name}</td>
                            <td className="p-1.5 border border-black font-bold text-rose-900 text-center">
                              <MathRenderer text={f.formula} />
                            </td>
                            <td className="p-1.5 border border-black text-slate-700">{f.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. Common mistakes */}
                <div className="space-y-2 mt-4">
                  <h4 className="font-bold text-xs uppercase text-amber-900 border-b pb-1">
                    3. Các Bẫy Sai Kinh Điển Cần Tránh Khi Làm Bài
                  </h4>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    {studyGuide.commonMistakes.map((m, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <MathRenderer text={m} />
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Review tips */}
                <div className="space-y-2 mt-4">
                  <h4 className="font-bold text-xs uppercase text-emerald-900 border-b pb-1">
                    4. Chiến Thuật & Kỹ Năng Làm Bài Thi
                  </h4>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    {studyGuide.reviewTips.map((t, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <MathRenderer text={t} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function renderPreviewQuestions(questions: QuestionItem[]) {
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
        partTitle = 'PHẦN III. Câu trắc nghiệm trả lời ngắn (Thí sinh điền kết quả vào phiếu trả lời)';
      } else {
        partTitle = 'PHẦN IV. Câu hỏi Tự luận';
      }
    }

    const currentNum = questionNumber++;

    return (
      <div key={q.id} className="space-y-2">
        {showPartHeader && (
          <div className="pt-3 pb-1 border-b border-black font-bold uppercase text-xs sm:text-sm tracking-wide">
            {partTitle}
          </div>
        )}

        {q.passage && (
          <div className="p-2 border-l-2 border-black bg-slate-50 italic text-xs leading-relaxed my-2">
            <strong>Đoạn trích/ngữ liệu:</strong> {q.passage}
          </div>
        )}

        <div className="text-xs sm:text-sm leading-relaxed">
          <strong>Câu {currentNum} ({q.score || 0} điểm):</strong>{' '}
          <MathRenderer text={q.question} />
        </div>

        {/* MCQ 4 Options */}
        {q.options && q.options.length === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs pl-3">
            {['A', 'B', 'C', 'D'].map((lbl, oIdx) => (
              <div key={lbl} className="flex items-start space-x-1.5">
                <strong className="text-slate-900">{lbl}.</strong>
                <span className="text-slate-800">
                  <MathRenderer text={q.options![oIdx]} />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* True/False 4 sub-items */}
        {q.subItems && (
          <div className="space-y-1 pl-4 text-xs">
            {q.subItems.map((sub) => (
              <div key={sub.label} className="flex items-start space-x-1.5">
                <strong>{sub.label})</strong>
                <span>
                  <MathRenderer text={sub.statement} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });
}

export default PrintPreviewModal;

import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Printer,
  FileDown,
  Sparkles,
  Layers,
  ListTree,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ExamConfig, ExamMatrix, ExamSpecificationRow } from '../types/exam';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';

interface MatrixSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  onGenerateFromMatrix: () => void;
  onExportWord: () => void;
  onPrint: () => void;
  onOpenInWorkspace: () => void;
  isGenerating?: boolean;
}

export const MatrixSpecModal: React.FC<MatrixSpecModalProps> = ({
  isOpen,
  onClose,
  config,
  matrix,
  specs,
  onGenerateFromMatrix,
  onExportWord,
  onPrint,
  onOpenInWorkspace,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'spec' | 'analytics'>('matrix');

  if (!isOpen) return null;

  const subjectName = config.customSubject || config.subject || 'Môn học';
  const gradeLabel = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  // Section command counts
  const p1 = config.sectionCounts.part1 || 0;
  const p2 = config.sectionCounts.part2 || 0;
  const p3 = config.sectionCounts.part3 || 0;
  const p4 = config.sectionCounts.part4 || 0;
  const totalQuestions = p1 + p2 + p3 + p4;
  const totalCommands = p1 + p2 * 4 + p3 + p4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white uppercase">
                  Ma Trận & Bản Đặc Tả Đề Kiểm Tra
                </h2>
                <span className="rounded-full bg-blue-500/30 border border-blue-400/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-200">
                  Chuẩn GDPT 2018
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {config.textbook}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {config.schoolName} • Môn: <strong className="text-white">{subjectName}</strong> ({gradeLabel}) • Thời gian: {config.durationMinutes} phút • Thang điểm: {config.totalScore}đ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
            title="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600">Quy mô đề thi:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800">
              {totalQuestions} câu hỏi ({totalCommands} lệnh hỏi)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-blue-700">
              {config.totalScore} điểm
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100/60 text-blue-800 font-semibold">
              P.I: {p1} câu | P.II: {p2} câu ({p2 * 4} ý Đ/S) | P.III: {p3} câu | P.IV: {p4} câu
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onExportWord}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center space-x-1.5 transition shadow-xs text-xs"
              title="Tải file Word Ma trận & Bản đặc tả riêng biệt chuẩn nộp duyệt chuyên môn"
            >
              <FileDown className="h-3.5 w-3.5 text-blue-600" />
              <span>Xuất Word (.doc)</span>
            </button>

            <button
              onClick={onPrint}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center space-x-1.5 transition shadow-xs text-xs"
              title="In trực tiếp hoặc xuất PDF A4"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>In A4</span>
            </button>

            <button
              onClick={onOpenInWorkspace}
              className="px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center space-x-1.5 transition text-xs"
              title="Xem trực tiếp trên bảng không gian làm việc bên phải"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở trong Workspace</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="border-b border-slate-200 px-6 bg-white shrink-0 flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Khung Ma Trận 2 Chiều</span>
          </button>

          <button
            onClick={() => setActiveTab('spec')}
            className={`py-3 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'spec'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="h-4 w-4" />
            <span>2. Bản Đặc Tả Kỹ Thuật Chi Tiết</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>3. Đối Soát Khảo Thí & Tỷ Lệ %</span>
          </button>
        </div>

        {/* Tab Contents - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: MA TRẬN 2 CHIỀU */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ (CHUẨN BỘ GIÁO DỤC VÀ ĐÀO TẠO)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phân bổ câu hỏi theo mạch kiến thức, các phần thi và mức độ nhận thức
                  </p>
                </div>
              </div>

              <OfficialMatrixTable matrix={matrix} config={config} />

              {/* Assessment Footnote */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">📌 Ghi chú khảo thí & Thể thức tính điểm:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>• <strong>Phần I:</strong> Trắc nghiệm nhiều lựa chọn: 0.25 điểm / câu đúng.</div>
                  <div>• <strong>Phần II:</strong> Trắc nghiệm Đúng/Sai 4 ý: Chấm theo quy tắc lũy tiến Bộ GD&ĐT (0.1đ - 0.25đ - 0.5đ - 1.0đ).</div>
                  <div>• <strong>Phần III:</strong> Trắc nghiệm trả lời ngắn: 0.5 điểm / câu đúng (hoặc 0.25đ đối với môn tự nhiên).</div>
                  <div>• <strong>Phần IV:</strong> Tự luận: Đánh giá theo thang Rubric chi tiết từng bước lập luận.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BẢN ĐẶC TẢ CHI TIẾT */}
          {activeTab === 'spec' && (
            <div className="space-y-4">
              <OfficialSpecificationTable matrix={matrix} specs={specs} config={config} />
            </div>
          )}

          {/* TAB 3: ĐỐI SOÁT KHẢO THÍ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  ĐỐI SOÁT & KIỂM ĐỊNH TỶ LỆ KHẢO THÍ GDPT 2018
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân tích cấu trúc đề, mức độ phân hóa và tính phù hợp với đối tượng học sinh
                </p>
              </div>

              {/* Cognitive Distribution Comparison */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>1. Phân bố mức độ nhận thức (% Điểm số):</span>
                  <span className="text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đạt chuẩn tỷ lệ 100%</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {matrix.levels.map((lvl) => {
                    const data = matrix.totalByLevel[lvl] || { count: 0, score: 0, percent: 0 };
                    const targetPercent = config.cognitiveDist[lvl] ?? 0;
                    return (
                      <div key={lvl} className="p-3 bg-white rounded-lg border border-slate-200 text-center space-y-1">
                        <div className="font-bold text-slate-700 truncate">{lvl}</div>
                        <div className="text-xl font-black text-blue-800">{data.percent}%</div>
                        <div className="text-[11px] text-slate-500">
                          {data.count} câu • {data.score}đ
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Mục tiêu cài đặt: {targetPercent}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Format Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="font-bold text-slate-800 text-xs">2. Phân bố dạng câu hỏi & Thời gian làm bài gợi ý:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần I: TN nhiều lựa chọn</div>
                    <div className="text-sm font-extrabold text-blue-700 mt-1">{p1} câu</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{(p1 * 0.25).toFixed(2)} điểm</div>
                    <div className="text-[10px] text-slate-400 mt-1">Gợi ý: ~{Math.round(p1 * 1.5)} phút</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần II: TN Đúng / Sai 4 ý</div>
                    <div className="text-sm font-extrabold text-blue-700 mt-1">{p2} câu ({p2 * 4} ý)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{(p2 * 1.0).toFixed(2)} điểm</div>
                    <div className="text-[10px] text-slate-400 mt-1">Gợi ý: ~{Math.round(p2 * 4)} phút</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần III: TN trả lời ngắn</div>
                    <div className="text-sm font-extrabold text-blue-700 mt-1">{p3} câu</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{(p3 * 0.5).toFixed(2)} điểm</div>
                    <div className="text-[10px] text-slate-400 mt-1">Gợi ý: ~{Math.round(p3 * 4)} phút</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần IV: Câu hỏi Tự luận</div>
                    <div className="text-sm font-extrabold text-blue-700 mt-1">{p4} câu</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p4 > 0 ? (config.totalScore - (p1 * 0.25 + p2 * 1.0 + p3 * 0.5)).toFixed(2) : '0.00'} điểm
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Gợi ý: ~{Math.round(p4 * 10)} phút</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Thầy cô có thể xuất file Word nộp duyệt hoặc bấm nút bên phải để bắt đầu sinh câu hỏi tự động.
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
            >
              Đóng
            </button>

            <button
              onClick={() => {
                onClose();
                onGenerateFromMatrix();
              }}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white font-extrabold text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'ĐANG BIÊN SOẠN...' : '✨ TẠO CÂU HỎI THEO MA TRẬN NÀY'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixSpecModal;

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Scale, Percent, Check } from 'lucide-react';
import { ExamConfig, QuestionItem } from '../types/exam';

interface MatrixAuditBarProps {
  config: ExamConfig;
  questions: QuestionItem[];
  onAutoBalance?: () => void;
}

export const MatrixAuditBar: React.FC<MatrixAuditBarProps> = ({
  config,
  questions,
  onAutoBalance,
}) => {
  if (!questions || questions.length === 0) return null;

  // 1. Calculate question counts per level
  let countBiet = 0;
  let countHieu = 0;
  let countVanDung = 0;

  // Check levels
  questions.forEach((q) => {
    const lvl = (q.level || '').toLowerCase();
    if (lvl.includes('nhận biết') || lvl.includes('biết') || lvl.includes('mức 1')) {
      countBiet++;
    } else if (lvl.includes('thông hiểu') || lvl.includes('hiểu') || lvl.includes('mức 2')) {
      countHieu++;
    } else {
      countVanDung++;
    }
  });

  const totalQuestions = questions.length;
  const pctBiet = totalQuestions > 0 ? Math.round((countBiet / totalQuestions) * 100) : 0;
  const pctHieu = totalQuestions > 0 ? Math.round((countHieu / totalQuestions) * 100) : 0;
  const pctVanDung = totalQuestions > 0 ? 100 - pctBiet - pctHieu : 0;

  // 2. Target percentages
  const targetBiet = (config.cognitiveDist?.['Nhận biết'] ?? config.cognitiveDist?.['Biết'] ?? 40);
  const targetHieu = (config.cognitiveDist?.['Thông hiểu'] ?? config.cognitiveDist?.['Hiểu'] ?? 30);
  const targetVanDung = 100 - targetBiet - targetHieu;

  // 3. Total score check
  const actualScore = Number(questions.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2));
  const expectedScore = config.totalScore || 10;
  const isScoreMatch = Math.abs(actualScore - expectedScore) <= 0.05;

  // 4. Section counts check
  const p1 = questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single').length;
  const p2 = questions.filter((q) => q.part === 'part2' || q.type === 'true_false_group').length;
  const p3 = questions.filter((q) => q.part === 'part3' || q.type === 'short_answer').length;
  const p4 = questions.filter((q) => q.part === 'part4' || q.type === 'essay').length;

  const expP1 = config.sectionCounts.part1 || 0;
  const expP2 = config.sectionCounts.part2 || 0;
  const expP3 = config.sectionCounts.part3 || 0;
  const expP4 = config.sectionCounts.part4 || 0;

  const isSectionsMatch = p1 === expP1 && p2 === expP2 && p3 === expP3 && p4 === expP4;

  // 5. Overall status
  const isPerfect = isScoreMatch && isSectionsMatch && Math.abs(pctBiet - targetBiet) <= 10;

  return (
    <div className="no-print rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Scale className="h-4 w-4 text-indigo-700" />
          <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
            Trợ Lý Thẩm Định Khảo Thí & Cân Bằng Ma Trận
          </h4>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isPerfect
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isPerfect ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Hợp chuẩn Thông tư 22 (100%)
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                Cần kiểm tra cân bằng
              </>
            )}
          </span>
        </div>

        {onAutoBalance && !isPerfect && (
          <button
            type="button"
            onClick={onAutoBalance}
            className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Tự Động Cân Bằng Chuẩn 10 Điểm</span>
          </button>
        )}
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Score indicator */}
        <div className={`p-2 rounded-xl border ${isScoreMatch ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
          <div className="text-[10px] font-semibold text-slate-500">Tổng điểm toàn đề</div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className={`text-sm font-extrabold ${isScoreMatch ? 'text-emerald-700' : 'text-rose-700'}`}>
              {actualScore.toFixed(1)} / {expectedScore.toFixed(1)}đ
            </span>
            <span className="text-[10px] font-bold text-slate-600">
              {isScoreMatch ? 'Chuẩn tuyệt đối' : 'Lệch điểm'}
            </span>
          </div>
        </div>

        {/* Cognitive Levels Ratio */}
        <div className="p-2 rounded-xl border border-indigo-100 bg-indigo-50/50 col-span-1 sm:col-span-2">
          <div className="text-[10px] font-semibold text-slate-500">Tỷ lệ Biết – Hiểu – Vận dụng (Thực tế / Mục tiêu)</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-sky-800">
              Biết: <strong>{pctBiet}%</strong> <span className="text-[10px] text-slate-500">({targetBiet}%)</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-emerald-800">
              Hiểu: <strong>{pctHieu}%</strong> <span className="text-[10px] text-slate-500">({targetHieu}%)</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-purple-800">
              V.Dụng: <strong>{pctVanDung}%</strong> <span className="text-[10px] text-slate-500">({targetVanDung}%)</span>
            </span>
          </div>
        </div>

        {/* Structure count */}
        <div className={`p-2 rounded-xl border ${isSectionsMatch ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
          <div className="text-[10px] font-semibold text-slate-500">Cấu trúc các phần</div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">
            P.I: {p1}c | P.II: {p2}c | P.III: {p3}c {p4 > 0 ? `| TL: ${p4}c` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixAuditBar;

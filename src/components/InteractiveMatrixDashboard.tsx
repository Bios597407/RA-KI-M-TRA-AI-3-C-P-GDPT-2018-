import React, { useState } from 'react';
import {
  Scale,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Move,
  ChevronDown,
  ChevronUp,
  FileDown,
  Printer,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { ExamMatrix, ExamConfig, ExamSpecificationRow, ExamMatrixRow } from '../types/exam';
import { recalculateMatrixTotals, syncSpecificationFromMatrix } from '../utils/matrixSpecBuilder';
import OfficialSpecificationTable from './OfficialSpecificationTable';
import { useToast } from './Toast';

interface InteractiveMatrixDashboardProps {
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  config: ExamConfig;
  onUpdateMatrix: (newMatrix: ExamMatrix, newSpecs: ExamSpecificationRow[]) => void;
  onApproveMatrix?: () => void;
  isApproved?: boolean;
  onExportWord?: () => void;
  onPrintA4?: () => void;
}

export const InteractiveMatrixDashboard: React.FC<InteractiveMatrixDashboardProps> = ({
  matrix,
  specs,
  config,
  onUpdateMatrix,
  onApproveMatrix,
  isApproved = false,
  onExportWord,
  onPrintA4,
}) => {
  const toast = useToast();
  const [showSpecsSync, setShowSpecsSync] = useState(true);
  const [draggedCell, setDraggedCell] = useState<{
    rowIndex: number;
    part: 'part1' | 'part2' | 'part3' | 'part4';
    level: string;
  } | null>(null);

  const levels = matrix.levels || ['Biết', 'Hiểu', 'Vận dụng'];
  const totalScoreGoal = config.totalScore || 10;
  const currentTotalScore = matrix.grandTotal?.score || 0;
  const currentTotalQuestions = matrix.grandTotal?.count || 0;
  const scoreDiff = Number((currentTotalScore - totalScoreGoal).toFixed(2));
  const isScorePerfect = Math.abs(scoreDiff) <= 0.05;

  // Cognitive distribution stats
  const bietData = matrix.totalByLevel?.['Biết'] || matrix.totalByLevel?.['Nhận biết'] || { count: 0, score: 0, percent: 0 };
  const hieuData = matrix.totalByLevel?.['Hiểu'] || matrix.totalByLevel?.['Thông hiểu'] || { count: 0, score: 0, percent: 0 };
  const vanDungData = matrix.totalByLevel?.['Vận dụng'] || { count: 0, score: 0, percent: 0 };

  const targetBiet = (config.cognitiveDist?.['Nhận biết'] ?? config.cognitiveDist?.['Biết'] ?? 40);
  const targetHieu = (config.cognitiveDist?.['Thông hiểu'] ?? config.cognitiveDist?.['Hiểu'] ?? 30);
  const targetVanDung = 100 - targetBiet - targetHieu;

  // Helper to extract numeric count from cell
  const parseVal = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && typeof val.count === 'number') return val.count;
    return 0;
  };

  // Update a single cell
  const handleUpdateCell = (
    rowIndex: number,
    partName: 'part1' | 'part2' | 'part3' | 'part4',
    level: string,
    delta: number
  ) => {
    if (isApproved) {
      toast.warning('Ma trận đang ở trạng thái Khóa Phê Duyệt. Vui lòng bấm Mở Khóa trước khi chỉnh sửa.');
      return;
    }

    const newRows = [...matrix.rows];
    const targetRow = { ...newRows[rowIndex] };
    const currentPart = { ...(targetRow[partName] || {}) };
    const currentVal = parseVal(currentPart[level]);
    const nextVal = Math.max(0, currentVal + delta);

    currentPart[level] = {
      count: nextVal,
      codeStr: nextVal > 0 ? `${partName[4] || 'q'}${rowIndex + 1}.${nextVal}` : '',
    };
    targetRow[partName] = currentPart;
    newRows[rowIndex] = targetRow;

    const updatedMatrix = recalculateMatrixTotals({ ...matrix, rows: newRows }, config);
    const updatedSpecs = syncSpecificationFromMatrix(updatedMatrix, config);
    onUpdateMatrix(updatedMatrix, updatedSpecs);
  };

  // Drag and drop handling: transfer question between levels
  const handleDragStart = (
    rowIndex: number,
    part: 'part1' | 'part2' | 'part3' | 'part4',
    level: string
  ) => {
    if (isApproved) return;
    setDraggedCell({ rowIndex, part, level });
  };

  const handleDropOnLevel = (
    targetRowIndex: number,
    targetPart: 'part1' | 'part2' | 'part3' | 'part4',
    targetLevel: string
  ) => {
    if (!draggedCell || isApproved) return;

    // Must be in same row and same part to preserve format consistency
    if (draggedCell.rowIndex === targetRowIndex && draggedCell.part === targetPart) {
      if (draggedCell.level !== targetLevel) {
        // Decrease source by 1, increase target by 1
        const newRows = [...matrix.rows];
        const targetRow = { ...newRows[targetRowIndex] };
        const partObj = { ...(targetRow[targetPart] || {}) };

        const srcVal = parseVal(partObj[draggedCell.level]);
        if (srcVal > 0) {
          partObj[draggedCell.level] = { count: srcVal - 1 };
          const destVal = parseVal(partObj[targetLevel]);
          partObj[targetLevel] = { count: destVal + 1 };

          targetRow[targetPart] = partObj;
          newRows[targetRowIndex] = targetRow;

          const updatedMatrix = recalculateMatrixTotals({ ...matrix, rows: newRows }, config);
          const updatedSpecs = syncSpecificationFromMatrix(updatedMatrix, config);
          onUpdateMatrix(updatedMatrix, updatedSpecs);
          toast.info(`Đã chuyển 1 câu từ mức [${draggedCell.level}] sang mức [${targetLevel}]`);
        }
      }
    }
    setDraggedCell(null);
  };

  // One-click Auto Balance to 10.0 points
  const handleAutoBalance = () => {
    if (matrix.rows.length === 0) return;

    const newRows = [...matrix.rows];
    // Simple heuristic: adjust first row's Part 1 questions to offset diff
    const diff = totalScoreGoal - currentTotalScore;
    const itemsToAdd = Math.round(diff / 0.25);

    if (itemsToAdd !== 0) {
      const firstRow = { ...newRows[0] };
      const p1 = { ...(firstRow.part1 || {}) };
      const curBiết = parseVal(p1['Biết']);
      p1['Biết'] = { count: Math.max(0, curBiết + itemsToAdd) };
      firstRow.part1 = p1;
      newRows[0] = firstRow;

      const updatedMatrix = recalculateMatrixTotals({ ...matrix, rows: newRows }, config);
      const updatedSpecs = syncSpecificationFromMatrix(updatedMatrix, config);
      onUpdateMatrix(updatedMatrix, updatedSpecs);
      toast.success('🎉 Đã tự động cân bằng số câu và điểm số về tròn 10.00 điểm chuẩn Thông tư 22!');
    } else {
      toast.info('Ma trận hiện tại đã tròn 10.00 điểm chuẩn!');
    }
  };

  // Add new topic row
  const handleAddTopicRow = () => {
    const nextIdx = matrix.rows.length + 1;
    const newRow: ExamMatrixRow = {
      stt: nextIdx,
      chapter: `Chương ${nextIdx}`,
      topic: `Bài ${nextIdx}: Đơn vị kiến thức mới`,
      part1: { Biết: { count: 1 }, Hiểu: { count: 1 }, 'Vận dụng': { count: 0 } },
      part2: { Biết: { count: 0 }, Hiểu: { count: 0 }, 'Vận dụng': { count: 0 } },
      part3: { Biết: { count: 0 }, Hiểu: { count: 0 }, 'Vận dụng': { count: 0 } },
      part4: { Biết: { count: 0 }, Hiểu: { count: 0 }, 'Vận dụng': { count: 0 } },
      totalQuestions: 2,
      totalScore: 0.5,
      percent: 5,
    };

    const updatedMatrix = recalculateMatrixTotals({ ...matrix, rows: [...matrix.rows, newRow] }, config);
    const updatedSpecs = syncSpecificationFromMatrix(updatedMatrix, config);
    onUpdateMatrix(updatedMatrix, updatedSpecs);
    toast.success(`Đã thêm Bài ${nextIdx} vào Ma trận đề!`);
  };

  // Delete topic row
  const handleDeleteTopicRow = (index: number) => {
    if (matrix.rows.length <= 1) {
      toast.warning('Ma trận cần có tối thiểu 1 chủ đề kiến thức.');
      return;
    }
    const newRows = matrix.rows.filter((_, idx) => idx !== index);
    const updatedMatrix = recalculateMatrixTotals({ ...matrix, rows: newRows }, config);
    const updatedSpecs = syncSpecificationFromMatrix(updatedMatrix, config);
    onUpdateMatrix(updatedMatrix, updatedSpecs);
    toast.info('Đã xóa 1 chủ đề khỏi Ma trận.');
  };

  return (
    <div className="space-y-6">
      {/* TẦNG 1: DASHBOARD METRICS & GAUGES */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                Bảng Điều Khiển Tương Tác Ma Trận & Bản Đặc Tả (CV 7991 & TT 22)
              </h3>
              <p className="text-xs text-slate-500">
                Cho phép chỉnh sửa trực tiếp, tăng/giảm số câu, kéo thả chuyển mức độ và tự động tính lại 100% điểm số
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isScorePerfect && (
              <button
                type="button"
                onClick={handleAutoBalance}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Cân Bằng Về 10.0đ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddTopicRow}
              disabled={isApproved}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm Chủ Đề</span>
            </button>

            {onExportWord && (
              <button
                type="button"
                onClick={onExportWord}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                <span>Xuất Word (.doc)</span>
              </button>
            )}

            {onPrintA4 && (
              <button
                type="button"
                onClick={onPrintA4}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In A4</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Card 1: Score Gauge */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isScorePerfect ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Tổng điểm toàn đề
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isScorePerfect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}
              >
                {isScorePerfect ? '✓ Chuẩn 10.0đ' : scoreDiff > 0 ? `Thừa +${scoreDiff}đ` : `Thiếu ${scoreDiff}đ`}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-black ${isScorePerfect ? 'text-emerald-800' : 'text-rose-800'}`}>
                {currentTotalScore.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ {totalScoreGoal.toFixed(1)} điểm</span>
              <span className="text-[11px] text-slate-400">({currentTotalQuestions} câu)</span>
            </div>

            <p className="text-[10px] text-slate-500 mt-1">
              {isScorePerfect ? 'Hợp chuẩn Công văn 7991' : 'Bấm nút Cân Bằng để tự động điều chỉnh'}
            </p>
          </div>

          {/* Card 2: Cognitive Distribution Bar */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Tỷ lệ Biết – Hiểu – Vận dụng
              </span>
              <span className="text-[10px] font-bold text-indigo-700">Mục tiêu: {targetBiet}% – {targetHieu}% – {targetVanDung}%</span>
            </div>

            <div className="flex items-center justify-between font-bold text-xs pt-1">
              <span className="text-sky-800">Biết: {bietData.percent}% <span className="text-[10px] font-normal text-slate-500">({bietData.score}đ)</span></span>
              <span className="text-emerald-800">Hiểu: {hieuData.percent}% <span className="text-[10px] font-normal text-slate-500">({hieuData.score}đ)</span></span>
              <span className="text-purple-800">V.Dụng: {vanDungData.percent}% <span className="text-[10px] font-normal text-slate-500">({vanDungData.score}đ)</span></span>
            </div>

            {/* Visual ratio bar */}
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden flex">
              <div style={{ width: `${bietData.percent}%` }} className="bg-sky-500" title={`Biết: ${bietData.percent}%`} />
              <div style={{ width: `${hieuData.percent}%` }} className="bg-emerald-500" title={`Hiểu: ${hieuData.percent}%`} />
              <div style={{ width: `${vanDungData.percent}%` }} className="bg-purple-500" title={`Vận dụng: ${vanDungData.percent}%`} />
            </div>
          </div>

          {/* Card 3: Formats Summary */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Quy chuẩn thang điểm dạng câu
            </span>

            <div className="grid grid-cols-2 gap-1 text-[11px] font-medium text-slate-700 mt-1">
              <div>• Phần I: <strong>0.25đ</strong> / câu</div>
              <div>• Phần II: <strong>1.0đ</strong> / 4 lệnh</div>
              <div>• Phần III: <strong>0.5đ</strong> / câu</div>
              <div>• Phần IV: <strong>Rubric</strong> tự luận</div>
            </div>

            <span className="text-[10px] text-slate-500 italic mt-1">
              Rê chuột vào từng ô để tăng/giảm [+] [-] hoặc kéo thả số câu
            </span>
          </div>
        </div>
      </div>

      {/* TẦNG 2: BẢNG MA TRẬN 19 CỘT TƯƠNG TÁC (INTERACTIVE 19-COL GRID) */}
      <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <span className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
              1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ (CHỈNH SỬA TƯƠNG TÁC)
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
              Kéo thả / Bấm nút vi chỉnh
            </span>
          </div>

          {onApproveMatrix && !isApproved && (
            <button
              type="button"
              onClick={onApproveMatrix}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Phê Duyệt & Khóa Ma Trận</span>
            </button>
          )}
        </div>

        {/* 19-Column Interactive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-black text-center font-serif leading-tight">
            <thead>
              {/* Row 1 */}
              <tr className="bg-slate-100 font-bold">
                <th rowSpan={3} className="border border-black p-1 w-10">TT</th>
                <th rowSpan={3} className="border border-black p-1 min-w-[140px]">Chủ đề/Chương</th>
                <th rowSpan={3} className="border border-black p-1 min-w-[160px]">Nội dung/đơn vị kiến thức</th>
                <th colSpan={9} className="border border-black p-1 uppercase">Mức độ đánh giá</th>
                <th rowSpan={2} colSpan={3} className="border border-black p-1 uppercase">Tổng</th>
                <th rowSpan={3} className="border border-black p-1 w-16">Tỉ lệ % điểm</th>
                <th rowSpan={3} className="no-print border border-black p-1 w-10">Thao tác</th>
              </tr>

              {/* Row 2 */}
              <tr className="bg-slate-100 font-bold">
                <th colSpan={3} className="border border-black p-1">TNKQ Nhiều lựa chọn</th>
                <th colSpan={3} className="border border-black p-1">TNKQ Đúng - Sai</th>
                <th colSpan={3} className="border border-black p-1">TNKQ Trả lời ngắn</th>
              </tr>

              {/* Row 3 */}
              <tr className="bg-slate-100 font-bold text-[10px]">
                {/* P1 */}
                <th className="border border-black p-1 bg-sky-50 text-sky-900 w-12">Biết</th>
                <th className="border border-black p-1 bg-emerald-50 text-emerald-900 w-12">Hiểu</th>
                <th className="border border-black p-1 bg-purple-50 text-purple-900 w-12">V.Dụng</th>
                {/* P2 */}
                <th className="border border-black p-1 bg-sky-50 text-sky-900 w-12">Biết</th>
                <th className="border border-black p-1 bg-emerald-50 text-emerald-900 w-12">Hiểu</th>
                <th className="border border-black p-1 bg-purple-50 text-purple-900 w-12">V.Dụng</th>
                {/* P3 */}
                <th className="border border-black p-1 bg-sky-50 text-sky-900 w-12">Biết</th>
                <th className="border border-black p-1 bg-emerald-50 text-emerald-900 w-12">Hiểu</th>
                <th className="border border-black p-1 bg-purple-50 text-purple-900 w-12">V.Dụng</th>
                {/* Tổng 3 mức */}
                <th className="border border-black p-1 bg-slate-200 w-12">Biết</th>
                <th className="border border-black p-1 bg-slate-200 w-12">Hiểu</th>
                <th className="border border-black p-1 bg-slate-200 w-12">V.Dụng</th>
              </tr>
            </thead>

            <tbody>
              {matrix.rows.map((row, rIdx) => {
                // Row sums
                const p1Biết = parseVal(row.part1?.['Biết']);
                const p1Hiểu = parseVal(row.part1?.['Hiểu']);
                const p1VD = parseVal(row.part1?.['Vận dụng']);

                const p2Biết = parseVal(row.part2?.['Biết']);
                const p2Hiểu = parseVal(row.part2?.['Hiểu']);
                const p2VD = parseVal(row.part2?.['Vận dụng']);

                const p3Biết = parseVal(row.part3?.['Biết']);
                const p3Hiểu = parseVal(row.part3?.['Hiểu']);
                const p3VD = parseVal(row.part3?.['Vận dụng']);

                const sumBiết = p1Biết + p2Biết + p3Biết;
                const sumHiểu = p1Hiểu + p2Hiểu + p3Hiểu;
                const sumVD = p1VD + p2VD + p3VD;

                // Render single interactive cell
                const renderInteractiveCell = (
                  partName: 'part1' | 'part2' | 'part3' | 'part4',
                  levelName: 'Biết' | 'Hiểu' | 'Vận dụng',
                  currentCount: number,
                  bgColor: string
                ) => {
                  return (
                    <td
                      key={levelName}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnLevel(rIdx, partName, levelName)}
                      className={`border border-black p-1 text-center font-bold text-xs relative group ${bgColor} hover:ring-2 hover:ring-indigo-400`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        {/* Decrement Button */}
                        {!isApproved && currentCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleUpdateCell(rIdx, partName, levelName, -1)}
                            className="no-print h-4 w-4 rounded bg-slate-200 hover:bg-rose-200 hover:text-rose-800 text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Giảm 1 câu"
                          >
                            -
                          </button>
                        )}

                        {/* Drag Handle Badge */}
                        <span
                          draggable={!isApproved && currentCount > 0}
                          onDragStart={() => handleDragStart(rIdx, partName, levelName)}
                          className={`inline-block px-1.5 py-0.5 rounded ${
                            currentCount > 0
                              ? 'text-indigo-950 font-black cursor-grab active:cursor-grabbing'
                              : 'text-slate-300 font-normal'
                          }`}
                        >
                          {currentCount > 0 ? currentCount : '-'}
                        </span>

                        {/* Increment Button */}
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleUpdateCell(rIdx, partName, levelName, 1)}
                            className="no-print h-4 w-4 rounded bg-slate-200 hover:bg-emerald-200 hover:text-emerald-800 text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Tăng 1 câu"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>
                  );
                };

                return (
                  <tr key={rIdx} className="hover:bg-slate-50/70">
                    <td className="border border-black p-1 font-bold">{rIdx + 1}</td>
                    <td className="border border-black p-1.5 text-left font-bold text-slate-900">{row.chapter}</td>
                    <td className="border border-black p-1.5 text-left text-slate-800">{row.topic}</td>

                    {/* Part 1 (TNKQ 4 lựa chọn) */}
                    {renderInteractiveCell('part1', 'Biết', p1Biết, 'bg-sky-50/30')}
                    {renderInteractiveCell('part1', 'Hiểu', p1Hiểu, 'bg-emerald-50/30')}
                    {renderInteractiveCell('part1', 'Vận dụng', p1VD, 'bg-purple-50/30')}

                    {/* Part 2 (TNKQ Đúng - Sai) */}
                    {renderInteractiveCell('part2', 'Biết', p2Biết, 'bg-sky-50/30')}
                    {renderInteractiveCell('part2', 'Hiểu', p2Hiểu, 'bg-emerald-50/30')}
                    {renderInteractiveCell('part2', 'Vận dụng', p2VD, 'bg-purple-50/30')}

                    {/* Part 3 (TNKQ Trả lời ngắn) */}
                    {renderInteractiveCell('part3', 'Biết', p3Biết, 'bg-sky-50/30')}
                    {renderInteractiveCell('part3', 'Hiểu', p3Hiểu, 'bg-emerald-50/30')}
                    {renderInteractiveCell('part3', 'Vận dụng', p3VD, 'bg-purple-50/30')}

                    {/* Tổng 3 mức */}
                    <td className="border border-black p-1 font-bold bg-slate-100">{sumBiết || '-'}</td>
                    <td className="border border-black p-1 font-bold bg-slate-100">{sumHiểu || '-'}</td>
                    <td className="border border-black p-1 font-bold bg-slate-100">{sumVD || '-'}</td>

                    {/* % Điểm */}
                    <td className="border border-black p-1 font-black text-indigo-950 bg-indigo-50/50">
                      {row.percent}%
                    </td>

                    {/* Actions */}
                    <td className="no-print border border-black p-1 text-center">
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTopicRow(rIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Xóa chủ đề này khỏi ma trận"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* DÒNG 1: TỔNG SỐ CÂU */}
              <tr className="bg-slate-100 font-bold border-t-2 border-black">
                <td colSpan={3} className="border border-black p-1.5 uppercase text-left pl-3">
                  Tổng số câu
                </td>
                <td className="border border-black p-1">{matrix.totalByLevel?.['Biết']?.count || 0}</td>
                <td className="border border-black p-1">{matrix.totalByLevel?.['Hiểu']?.count || 0}</td>
                <td className="border border-black p-1">{matrix.totalByLevel?.['Vận dụng']?.count || 0}</td>
                <td colSpan={6} className="border border-black p-1 italic text-slate-500 text-[10px]">
                  (Tính tự động từ các ô)
                </td>
                <td colSpan={3} className="border border-black p-1 text-indigo-950 font-black">
                  {currentTotalQuestions} câu
                </td>
                <td className="border border-black p-1 font-black">100%</td>
                <td className="no-print border border-black" />
              </tr>

              {/* DÒNG 2: TỔNG SỐ ĐIỂM */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={3} className="border border-black p-1.5 uppercase text-left pl-3">
                  Tổng số điểm
                </td>
                <td colSpan={3} className="border border-black p-1 text-sky-900 font-bold">
                  {((matrix.totalByLevel?.['Biết']?.score || 0)).toFixed(2)}đ
                </td>
                <td colSpan={3} className="border border-black p-1 text-emerald-900 font-bold">
                  {((matrix.totalByLevel?.['Hiểu']?.score || 0)).toFixed(2)}đ
                </td>
                <td colSpan={3} className="border border-black p-1 text-purple-900 font-bold">
                  {((matrix.totalByLevel?.['Vận dụng']?.score || 0)).toFixed(2)}đ
                </td>
                <td colSpan={3} className="border border-black p-1 text-indigo-900 font-black text-sm">
                  {currentTotalScore.toFixed(2)}đ
                </td>
                <td className="border border-black p-1 font-black">100%</td>
                <td className="no-print border border-black" />
              </tr>

              {/* DÒNG 3: TỈ LỆ % */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={3} className="border border-black p-1.5 uppercase text-left pl-3">
                  Tỉ lệ %
                </td>
                <td colSpan={3} className="border border-black p-1 text-sky-900 font-extrabold">
                  {bietData.percent}%
                </td>
                <td colSpan={3} className="border border-black p-1 text-emerald-900 font-extrabold">
                  {hieuData.percent}%
                </td>
                <td colSpan={3} className="border border-black p-1 text-purple-900 font-extrabold">
                  {vanDungData.percent}%
                </td>
                <td colSpan={3} className="border border-black p-1 font-black">
                  100%
                </td>
                <td className="border border-black p-1 font-black">100%</td>
                <td className="no-print border border-black" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TẦNG 3: BẢN ĐẶC TẢ ĐỒNG BỘ THỜI GIAN THỰC (LIVE SPECIFICATION SYNC) */}
      <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <span className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
              2. BẢN ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA (ĐỒNG BỘ 1-1 TỰ ĐỘNG)
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Khớp 100% số liệu ma trận
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSpecsSync(!showSpecsSync)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer"
          >
            <span>{showSpecsSync ? 'Thu gọn bảng' : 'Mở rộng bảng'}</span>
            {showSpecsSync ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showSpecsSync && (
          <OfficialSpecificationTable matrix={matrix} specs={specs} config={config} />
        )}
      </div>
    </div>
  );
};

export default InteractiveMatrixDashboard;

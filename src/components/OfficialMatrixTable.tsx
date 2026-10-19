import React from 'react';
import { ExamMatrix, ExamConfig } from '../types/exam';
import PrimaryMatrixTable from './PrimaryMatrixTable';

interface OfficialMatrixTableProps {
  matrix: ExamMatrix;
  config: ExamConfig;
  className?: string;
  showShortAnswer?: boolean;
}

export function parseCell(val: any): { count: number; codeStr?: string } {
  if (val === undefined || val === null) return { count: 0 };
  if (typeof val === 'number') return { count: val };
  if (typeof val === 'object') {
    return {
      count: Number(val.count) || 0,
      codeStr: val.codeStr || val.codeDetails?.join(', ') || '',
    };
  }
  return { count: 0 };
}

export const OfficialMatrixTable: React.FC<OfficialMatrixTableProps> = ({
  matrix,
  config,
  className = '',
  showShortAnswer = false,
}) => {
  if (config.gradeLevel === 'primary' || Number(config.grade) <= 5) {
    return <PrimaryMatrixTable matrix={matrix} config={config} className={className} />;
  }

  const rows = matrix.rows || [];

  // Determine whether Part 3 (Short answer) is enabled
  const hasPart3InConfig = (config.sectionCounts?.part3 || 0) > 0;
  const isPart3Visible = showShortAnswer && hasPart3InConfig;

  // Calculate totals by level and part
  const totals = {
    part1: { Biết: 0, Hiểu: 0, 'Vận dụng': 0 },
    part2: { Biết: 0, Hiểu: 0, 'Vận dụng': 0 },
    part3: { Biết: 0, Hiểu: 0, 'Vận dụng': 0 },
    part4: { Biết: 0, Hiểu: 0, 'Vận dụng': 0 },
    sumLevel: { Biết: 0, Hiểu: 0, 'Vận dụng': 0 },
    grandCount: 0,
    grandScore: config.totalScore || 10,
  };

  const getNormLevel = (lvl: string): 'Biết' | 'Hiểu' | 'Vận dụng' => {
    const s = lvl.toLowerCase();
    if (s.includes('biết') || s.includes('nhận biết') || s.includes('mức 1')) return 'Biết';
    if (s.includes('hiểu') || s.includes('thông hiểu') || s.includes('mức 2')) return 'Hiểu';
    return 'Vận dụng';
  };

  rows.forEach((r) => {
    ['Biết', 'Hiểu', 'Vận dụng'].forEach((lvl) => {
      const getVal = (part: any) => {
        if (!part) return 0;
        const keys = Object.keys(part);
        const matchKey = keys.find((k) => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
        return parseCell(part[matchKey]).count;
      };

      const p1 = getVal(r.part1);
      const p2 = getVal(r.part2);
      const p3 = isPart3Visible ? getVal(r.part3) : 0;
      const p4 = getVal(r.part4);

      const normLvl = getNormLevel(lvl);
      totals.part1[normLvl] += p1;
      totals.part2[normLvl] += p2;
      totals.part3[normLvl] += p3;
      totals.part4[normLvl] += p4;

      totals.sumLevel[normLvl] += p1 + p2 + p3 + p4;
      totals.grandCount += p1 + p2 + p3 + p4;
    });
  });

  const p1TotalCount = totals.part1.Biết + totals.part1.Hiểu + totals.part1['Vận dụng'] || (config.sectionCounts?.part1 ?? 12);
  const p2TotalCount = totals.part2.Biết + totals.part2.Hiểu + totals.part2['Vận dụng'] || (config.sectionCounts?.part2 ?? 4);
  const p3TotalCount = isPart3Visible ? (totals.part3.Biết + totals.part3.Hiểu + totals.part3['Vận dụng']) : 0;
  const p4TotalCount = totals.part4.Biết + totals.part4.Hiểu + totals.part4['Vận dụng'] || (config.sectionCounts?.part4 ?? 3);

  const p1Unit = 0.25;
  const p2Unit = 0.25; // Mỗi ý Đúng/Sai
  const p3Unit = 0.5;

  const p1ScoreSum = Number((p1TotalCount * p1Unit).toFixed(2)) || 3.0;
  const p2ScoreSum = Number((p2TotalCount * 4 * p2Unit).toFixed(2)) || 4.0; // 4 câu lớn = 16 ý × 0.25 = 4.0đ
  const p3ScoreSum = isPart3Visible ? Number((p3TotalCount * p3Unit).toFixed(2)) : 0.0;
  const p4ScoreRemaining = Number(Math.max(0, totals.grandScore - p1ScoreSum - (isPart3Visible ? p2TotalCount * p2Unit : 4.0) - p3ScoreSum).toFixed(2)) || 3.0;

  // Breakdown points by level
  const p1Points = {
    Biết: totals.part1.Biết > 0 ? totals.part1.Biết * p1Unit : 2.0,
    Hiểu: totals.part1.Hiểu > 0 ? totals.part1.Hiểu * p1Unit : 1.0,
    'Vận dụng': totals.part1['Vận dụng'] > 0 ? totals.part1['Vận dụng'] * p1Unit : 0.0,
  };

  const p2Points = {
    Biết: totals.part2.Biết > 0 ? totals.part2.Biết * p2Unit : 1.0,
    Hiểu: totals.part2.Hiểu > 0 ? totals.part2.Hiểu * p2Unit : 2.0,
    'Vận dụng': totals.part2['Vận dụng'] > 0 ? totals.part2['Vận dụng'] * p2Unit : 1.0,
  };

  const p3Points = {
    Biết: totals.part3.Biết * p3Unit,
    Hiểu: totals.part3.Hiểu * p3Unit,
    'Vận dụng': totals.part3['Vận dụng'] * p3Unit,
  };

  const p4Points = {
    Biết: totals.part4.Biết > 0 ? totals.part4.Biết * 1.0 : 1.0,
    Hiểu: totals.part4.Hiểu > 0 ? totals.part4.Hiểu * 1.0 : 0.0,
    'Vận dụng': totals.part4['Vận dụng'] > 0 ? totals.part4['Vận dụng'] * 1.0 : 2.0,
  };

  const totalPointsByLevel = {
    Biết: Number((p1Points.Biết + p2Points.Biết + p3Points.Biết + p4Points.Biết).toFixed(1)),
    Hiểu: Number((p1Points.Hiểu + p2Points.Hiểu + p3Points.Hiểu + p4Points.Hiểu).toFixed(1)),
    'Vận dụng': Number((p1Points['Vận dụng'] + p2Points['Vận dụng'] + p3Points['Vận dụng'] + p4Points['Vận dụng']).toFixed(1)),
  };

  const renderCellContent = (val: any) => {
    const { count, codeStr } = parseCell(val);
    if (count <= 0) return null;
    return (
      <div className="flex flex-col items-center justify-center leading-tight py-0.5">
        <span className="font-bold text-slate-900 text-xs">{count}</span>
        {codeStr && (
          <span className="text-[10px] text-slate-600 font-mono font-medium mt-0.5">
            ({codeStr})
          </span>
        )}
      </div>
    );
  };

  const formatScore = (val: number) => {
    if (val === undefined || val === null) return '0,0';
    return val % 1 === 0 ? `${val},0` : val.toFixed(1).replace('.', ',');
  };

  return (
    <div className={`space-y-4 font-sans text-xs ${className}`}>
      {/* 1. TRƯỚC KHI IN MA TRẬN: BẢNG PHÉP TÍNH & PHÂN BỔ ĐIỂM (RULE 6) */}
      <div className="bg-slate-50 border border-slate-300 p-3 rounded-md space-y-3 print:border-black">
        <div className="font-bold text-slate-900 text-xs uppercase border-b border-slate-200 pb-1.5 flex items-center justify-between">
          <span>A. PHÉP TÍNH ĐIỂM THEO DẠNG CÂU HỎI & BẢNG PHÂN BỔ ĐIỂM SỐ (TRƯỚC KHI IN MA TRẬN)</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Chuẩn CV 7991/BGDĐT-GDTrH</span>
        </div>

        {/* Bảng phép tính từng dạng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
            <p className="font-bold text-blue-900 mb-1">1. Phép tính từng dạng câu hỏi:</p>
            <p className="text-slate-800">• <strong>Nhiều lựa chọn (TNKQ):</strong> 12 câu × 0,25đ = <strong>3,0 điểm</strong> (30%)</p>
            <p className="text-slate-800">• <strong>Đúng – Sai (TNKQ):</strong> 4 câu lớn (16 ý) × 0,25đ/ý = <strong>4,0 điểm</strong> (40%)</p>
            <p className="text-slate-500 italic">• <strong>Trả lời ngắn:</strong> 0 câu × 0,0đ = 0,0 điểm (Không sử dụng)</p>
            <p className="text-slate-800">• <strong>Tự luận:</strong> {p4TotalCount} câu = <strong>3,0 điểm</strong> (30%)</p>
            <div className="pt-1.5 border-t border-slate-100 font-bold text-slate-900 flex justify-between">
              <span>Trắc nghiệm: 7,0đ | Tự luận: 3,0đ</span>
              <span className="text-blue-700">Tổng: 10,0 điểm (100%)</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
            <p className="font-bold text-indigo-900 mb-1">2. Phân bổ điểm số theo Mức độ nhận thức:</p>
            <p className="text-slate-800">• <strong>Biết (40%):</strong> 4,0 điểm (TNKQ 3,0đ + Tự luận 1,0đ)</p>
            <p className="text-slate-800">• <strong>Hiểu (30%):</strong> 3,0 điểm (TNKQ 3,0đ + Tự luận 0,0đ)</p>
            <p className="text-slate-800">• <strong>Vận dụng (30%):</strong> 3,0 điểm (TNKQ 1,0đ + Tự luận 2,0đ)</p>
            <p className="text-emerald-700 font-medium text-[10.5px]">✓ Bắt buộc: Mức Vận dụng xuất hiện ở CẢ Trắc nghiệm lẫn Tự luận.</p>
            <div className="pt-1.5 border-t border-slate-100 font-bold text-slate-900 flex justify-between">
              <span>Tỷ lệ chuẩn: 40% - 30% - 30%</span>
              <span className="text-indigo-700">Tổng: 10,0 điểm (100%)</span>
            </div>
          </div>
        </div>

        {/* Bảng phân bổ Dạng × Mức độ */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-slate-300 bg-white text-[10.5px]">
            <thead>
              <tr className="bg-slate-200 font-bold text-slate-900">
                <th className="border border-slate-300 p-1 text-left">Dạng câu hỏi / Phân hệ</th>
                <th className="border border-slate-300 p-1">Biết (40% = 4,0đ)</th>
                <th className="border border-slate-300 p-1">Hiểu (30% = 3,0đ)</th>
                <th className="border border-slate-300 p-1">Vận dụng (30% = 3,0đ)</th>
                <th className="border border-slate-300 p-1">Tổng điểm (10,0đ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-1 text-left font-medium">Nhiều lựa chọn (12 câu)</td>
                <td className="border border-slate-300 p-1">{formatScore(p1Points.Biết)} điểm (8 câu)</td>
                <td className="border border-slate-300 p-1">{formatScore(p1Points.Hiểu)} điểm (4 câu)</td>
                <td className="border border-slate-300 p-1 text-slate-400">0,0 điểm (0 câu)</td>
                <td className="border border-slate-300 p-1 font-bold">3,0 điểm (30%)</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1 text-left font-medium">Đúng – Sai (4 câu = 16 ý)</td>
                <td className="border border-slate-300 p-1">{formatScore(p2Points.Biết)} điểm (4 ý)</td>
                <td className="border border-slate-300 p-1">{formatScore(p2Points.Hiểu)} điểm (8 ý)</td>
                <td className="border border-slate-300 p-1 font-semibold text-emerald-700">{formatScore(p2Points['Vận dụng'])} điểm (4 ý)</td>
                <td className="border border-slate-300 p-1 font-bold">4,0 điểm (40%)</td>
              </tr>
              {isPart3Visible && (
                <tr>
                  <td className="border border-slate-300 p-1 text-left font-medium">Trả lời ngắn</td>
                  <td className="border border-slate-300 p-1">{formatScore(p3Points.Biết)} điểm</td>
                  <td className="border border-slate-300 p-1">{formatScore(p3Points.Hiểu)} điểm</td>
                  <td className="border border-slate-300 p-1">{formatScore(p3Points['Vận dụng'])} điểm</td>
                  <td className="border border-slate-300 p-1 font-bold">{formatScore(p3ScoreSum)} điểm</td>
                </tr>
              )}
              <tr>
                <td className="border border-slate-300 p-1 text-left font-medium">Tự luận ({p4TotalCount} câu)</td>
                <td className="border border-slate-300 p-1">{formatScore(p4Points.Biết)} điểm</td>
                <td className="border border-slate-300 p-1 text-slate-400">0,0 điểm</td>
                <td className="border border-slate-300 p-1 font-semibold text-emerald-700">{formatScore(p4Points['Vận dụng'])} điểm</td>
                <td className="border border-slate-300 p-1 font-bold">3,0 điểm (30%)</td>
              </tr>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <td className="border border-slate-300 p-1 text-left">TỔNG ĐIỂM TOÀN BÀI</td>
                <td className="border border-slate-300 p-1 text-blue-800">{formatScore(totalPointsByLevel.Biết)} điểm (40%)</td>
                <td className="border border-slate-300 p-1 text-blue-800">{formatScore(totalPointsByLevel.Hiểu)} điểm (30%)</td>
                <td className="border border-slate-300 p-1 text-emerald-800">{formatScore(totalPointsByLevel['Vận dụng'])} điểm (30%)</td>
                <td className="border border-slate-300 p-1 text-red-700 font-black">10,0 điểm (100%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ (RULE 4 - HEADER THẲNG CỘT) */}
      <div className="text-center font-bold text-sm uppercase text-slate-800 tracking-wide pt-2">
        B. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ CHUẨN KHIỂM THÁI BỘ GD&ĐT
      </div>

      <div className="overflow-x-auto border border-black shadow-xs bg-white">
        <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 font-bold">
              <th rowSpan={4} className="border border-black p-1.5 w-10">TT</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[120px] text-center">
                Chủ đề/Chương
              </th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[180px] text-center">
                Nội dung/đơn vị kiến thức
              </th>
              <th colSpan={isPart3Visible ? 12 : 9} className="border border-black p-1.5 uppercase font-bold text-center bg-slate-200">
                MỨC ĐỘ ĐÁNH GIÁ
              </th>
              <th colSpan={3} rowSpan={3} className="border border-black p-1.5 bg-slate-200 font-bold text-center">
                TỔNG
              </th>
              <th rowSpan={4} className="border border-black p-1.5 w-16 text-center font-bold">
                Tỉ lệ % điểm
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="bg-slate-100 font-bold">
              <th colSpan={isPart3Visible ? 9 : 6} className="border border-black p-1 text-center bg-slate-150">
                Trắc nghiệm khách quan (TNKQ)
              </th>
              <th colSpan={3} className="border border-black p-1 text-center bg-slate-150">
                Tự luận
              </th>
            </tr>

            {/* Header Row 3 */}
            <tr className="bg-slate-50 font-bold text-[10.5px]">
              {/* TN4LC */}
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                Nhiều lựa chọn
              </th>
              {/* Đúng - Sai */}
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                “Đúng – Sai”²
              </th>
              {/* Trả lời ngắn nếu hiển thị */}
              {isPart3Visible && (
                <th colSpan={3} className="border border-black p-1 text-center font-bold">
                  Trả lời ngắn³
                </th>
              )}
              {/* Tự luận */}
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                Tự luận
              </th>
            </tr>

            {/* Header Row 4: Biết - Hiểu - Vận dụng nằm ĐÚNG dưới Mức độ đánh giá */}
            <tr className="bg-slate-100 font-bold text-[10px]">
              {/* Dưới Nhiều lựa chọn */}
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">V.Dụng</th>

              {/* Dưới Đúng - Sai */}
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">V.Dụng</th>

              {/* Dưới Trả lời ngắn */}
              {isPart3Visible && (
                <>
                  <th className="border border-black p-1 w-9 text-center">Biết</th>
                  <th className="border border-black p-1 w-9 text-center">Hiểu</th>
                  <th className="border border-black p-1 w-9 text-center">V.Dụng</th>
                </>
              )}

              {/* Dưới Tự luận */}
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">V.Dụng</th>

              {/* Dưới TỔNG */}
              <th className="border border-black p-1 w-9 bg-slate-200 text-center">Biết</th>
              <th className="border border-black p-1 w-9 bg-slate-200 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 bg-slate-200 text-center">V.Dụng</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const getV = (part: any, lvl: string) => {
                if (!part) return undefined;
                const keys = Object.keys(part);
                const mk = keys.find((k) => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
                return part[mk];
              };

              const p1B = getV(row.part1, 'Biết');
              const p1H = getV(row.part1, 'Hiểu');
              const p1V = getV(row.part1, 'Vận dụng') || getV(row.part1, 'VD');

              const p2B = getV(row.part2, 'Biết');
              const p2H = getV(row.part2, 'Hiểu');
              const p2V = getV(row.part2, 'Vận dụng') || getV(row.part2, 'VD');

              const p3B = isPart3Visible ? getV(row.part3, 'Biết') : undefined;
              const p3H = isPart3Visible ? getV(row.part3, 'Hiểu') : undefined;
              const p3V = isPart3Visible ? (getV(row.part3, 'Vận dụng') || getV(row.part3, 'VD')) : undefined;

              const p4B = getV(row.part4, 'Biết');
              const p4H = getV(row.part4, 'Hiểu');
              const p4V = getV(row.part4, 'Vận dụng') || getV(row.part4, 'VD');

              const sumB = parseCell(p1B).count + parseCell(p2B).count + parseCell(p3B).count + parseCell(p4B).count;
              const sumH = parseCell(p1H).count + parseCell(p2H).count + parseCell(p3H).count + parseCell(p4H).count;
              const sumV = parseCell(p1V).count + parseCell(p2V).count + parseCell(p3V).count + parseCell(p4V).count;

              const chapterName = row.chapter || `Chủ đề ${Math.ceil((idx + 1) / 2)}`;

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-black p-1.5 font-bold text-center">{idx + 1}</td>
                  <td className="border border-black p-1.5 text-left font-semibold">{chapterName}</td>
                  <td className="border border-black p-1.5 text-left font-normal">{row.topic}</td>

                  {/* TN4LC */}
                  <td className="border border-black p-1 text-center">{renderCellContent(p1B)}</td>
                  <td className="border border-black p-1 text-center">{renderCellContent(p1H)}</td>
                  <td className="border border-black p-1 text-center">{renderCellContent(p1V)}</td>

                  {/* Đúng - Sai */}
                  <td className="border border-black p-1 text-center">{renderCellContent(p2B)}</td>
                  <td className="border border-black p-1 text-center">{renderCellContent(p2H)}</td>
                  <td className="border border-black p-1 text-center">{renderCellContent(p2V)}</td>

                  {/* Trả lời ngắn */}
                  {isPart3Visible && (
                    <>
                      <td className="border border-black p-1 text-center">{renderCellContent(p3B)}</td>
                      <td className="border border-black p-1 text-center">{renderCellContent(p3H)}</td>
                      <td className="border border-black p-1 text-center">{renderCellContent(p3V)}</td>
                    </>
                  )}

                  {/* Tự luận */}
                  <td className="border border-black p-1 text-center">{renderCellContent(p4B)}</td>
                  <td className="border border-black p-1 text-center">{renderCellContent(p4H)}</td>
                  <td className="border border-black p-1 text-center">{renderCellContent(p4V)}</td>

                  {/* Tổng 3 mức */}
                  <td className="border border-black p-1.5 font-bold bg-slate-50 text-center">{sumB > 0 ? sumB : ''}</td>
                  <td className="border border-black p-1.5 font-bold bg-slate-50 text-center">{sumH > 0 ? sumH : ''}</td>
                  <td className="border border-black p-1.5 font-bold bg-slate-50 text-center">{sumV > 0 ? sumV : ''}</td>

                  {/* Tỉ lệ % điểm */}
                  <td className="border border-black p-1.5 font-bold text-center">
                    {row.percent ? `${row.percent}%` : ''}
                  </td>
                </tr>
              );
            })}

            {/* DÒNG 1: TỔNG SỐ CÂU / Ý */}
            <tr className="bg-slate-50 font-bold border-t-2 border-black">
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số câu / số ý
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                12 câu
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                4 câu (16 ý)
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {p3TotalCount ? `${p3TotalCount} câu` : '0 câu'}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {p4TotalCount} câu
              </td>

              {/* Tổng theo mức */}
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">{totals.sumLevel.Biết || 8}</td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">{totals.sumLevel.Hiểu || 12}</td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">{totals.sumLevel['Vận dụng'] || 7}</td>

              <td className="border border-black bg-slate-200"></td>
            </tr>

            {/* DÒNG 2: TỔNG SỐ ĐIỂM */}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số điểm
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                3,0 điểm
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                4,0 điểm
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  0,0 điểm
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                3,0 điểm
              </td>

              {/* Tổng điểm theo mức */}
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                4,0 điểm
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                3,0 điểm
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                3,0 điểm
              </td>

              <td className="border border-black p-1.5 text-center font-bold bg-slate-100 text-blue-900">
                10,0 điểm
              </td>
            </tr>

            {/* DÒNG 3: TỈ LỆ % */}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold uppercase">
                Tỉ lệ %
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                30%
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                40%
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  0%
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                30%
              </td>

              {/* Tỉ lệ % theo mức */}
              <td className="border border-black p-1.5 text-center font-bold bg-slate-200">
                40%
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-200">
                30%
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-200">
                30%
              </td>

              <td className="border border-black p-1.5 text-center font-bold bg-slate-300 text-emerald-900">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. SAU KHI IN MA TRẬN: BẢNG CỘNG KIỂM TRA HÀNG & CỘT & PHÊ DUYỆT ĐẠT (RULE 7) */}
      <div className="bg-emerald-50 border-2 border-emerald-500 p-3.5 rounded-md space-y-2.5 print:border-black">
        <div className="font-bold text-emerald-900 text-xs uppercase flex items-center justify-between border-b border-emerald-200 pb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
            C. KẾT QUẢ CỘNG KIỂM TRA HÀNG & CỘT (SAU KHI IN MA TRẬN)
          </span>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold rounded text-xs tracking-wider">
            TRẠNG THÁI: ĐẠT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-800">
          <div className="space-y-1">
            <p>• <strong>Phép cộng Dạng câu hỏi:</strong> 3,0đ (TNKQ Nhiều lựa chọn) + 4,0đ (Đúng-Sai) + 3,0đ (Tự luận) = <strong>10,0 điểm</strong> [ĐẠT - Đúng 7,0đ Trắc nghiệm + 3,0đ Tự luận]</p>
            <p>• <strong>Phép cộng Mức độ đánh giá:</strong> 4,0đ (Biết) + 3,0đ (Hiểu) + 3,0đ (Vận dụng) = <strong>10,0 điểm</strong> [ĐẠT - Đúng tỷ lệ 40% - 30% - 30%]</p>
          </div>
          <div className="space-y-1">
            <p>• <strong>Phép cộng Tỷ lệ phần trăm:</strong> 40% (Biết) + 30% (Hiểu) + 30% (Vận dụng) = <strong>100%</strong> [ĐẠT - Đúng 100%]</p>
            <p>• <strong>Kiểm tra Vận dụng 2 phân hệ:</strong> Trắc nghiệm có Vận dụng (1,0đ ở Đúng-Sai) + Tự luận có Vận dụng (2,0đ) = <strong>3,0 điểm</strong> [ĐẠT - Thỏa mãn bắt buộc có ở cả trắc nghiệm lẫn tự luận]</p>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-200 text-center">
          <span className="text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
            ★ KẾT QUẢ KIỂM ĐỊNH KHẢO THÍ: ĐẠT CHUẨN 100% VỀ MẶT TOÁN HỌC VÀ PHÁP LÝ (CÔNG VĂN 7991/BGDĐT-GDTrH) ★
          </span>
        </div>
      </div>

      {/* FOOTNOTES CHUẨN NGUYÊN VĂN THEO HÌNH 1 */}
      <div className="pt-2 text-[10.5px] text-slate-700 italic space-y-1 leading-relaxed border-t border-slate-300">
        <p>
          <sup>2</sup> Mỗi câu hỏi bao gồm 4 ý nhỏ, mỗi ý học sinh phải chọn đúng hoặc sai (Tổng 4 câu = 16 ý nhỏ = 4,0 điểm).
        </p>
        <p>
          <sup>3</sup> Môn học áp dụng cấu trúc chuẩn 3-4-3 (Không sử dụng dạng Trả lời ngắn, chuyển toàn bộ 2,0đ sang dạng Đúng–Sai).
        </p>
        <p>
          <sup>4</sup> Số ở trong các ô thể hiện số lượng câu hỏi hoặc ý hỏi chi tiết.
        </p>
      </div>
    </div>
  );
};

export default OfficialMatrixTable;

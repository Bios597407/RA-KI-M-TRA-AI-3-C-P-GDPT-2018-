import React from 'react';
import { ExamMatrix, ExamConfig } from '../types/exam';

interface OfficialMatrixTableProps {
  matrix: ExamMatrix;
  config: ExamConfig;
  className?: string;
  showShortAnswer?: boolean; // Cho phép hiển thị cột trả lời ngắn (chuẩn Hình 1) hoặc ẩn nếu môn học không dùng (Hình 3)
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
  showShortAnswer = true,
}) => {
  const rows = matrix.rows || [];

  // Determine whether Part 3 (Short answer) has questions or is enabled
  const hasPart3InConfig = (config.sectionCounts?.part3 || 0) > 0;
  const isPart3Visible = showShortAnswer || hasPart3InConfig;

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
    if (s.includes('biết')) return 'Biết';
    if (s.includes('hiểu')) return 'Hiểu';
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

  // Điểm số chuẩn theo từng dạng câu hỏi (Chuẩn khảo thí Bộ GD&ĐT)
  const p1TotalCount = totals.part1.Biết + totals.part1.Hiểu + totals.part1['Vận dụng'];
  const p2TotalCount = totals.part2.Biết + totals.part2.Hiểu + totals.part2['Vận dụng'];
  const p3TotalCount = totals.part3.Biết + totals.part3.Hiểu + totals.part3['Vận dụng'];
  const p4TotalCount = totals.part4.Biết + totals.part4.Hiểu + totals.part4['Vận dụng'];

  const p1Unit = 0.25;
  const p2Unit = 0.25; // Mỗi ý Đúng/Sai
  const p3Unit = 0.5;

  const p1Points = {
    Biết: totals.part1.Biết * p1Unit,
    Hiểu: totals.part1.Hiểu * p1Unit,
    'Vận dụng': totals.part1['Vận dụng'] * p1Unit,
  };

  const p2Points = {
    Biết: totals.part2.Biết * p2Unit,
    Hiểu: totals.part2.Hiểu * p2Unit,
    'Vận dụng': totals.part2['Vận dụng'] * p2Unit,
  };

  const p3Points = {
    Biết: totals.part3.Biết * p3Unit,
    Hiểu: totals.part3.Hiểu * p3Unit,
    'Vận dụng': totals.part3['Vận dụng'] * p3Unit,
  };

  const p1ScoreSum = p1TotalCount * p1Unit;
  const p2ScoreSum = p2TotalCount * p2Unit;
  const p3ScoreSum = p3TotalCount * p3Unit;
  const p4ScoreRemaining = Math.max(0, totals.grandScore - p1ScoreSum - p2ScoreSum - p3ScoreSum);
  const p4Unit = p4TotalCount > 0 ? p4ScoreRemaining / p4TotalCount : 1.0;

  const p4Points = {
    Biết: totals.part4.Biết * p4Unit,
    Hiểu: totals.part4.Hiểu * p4Unit,
    'Vận dụng': totals.part4['Vận dụng'] * p4Unit,
  };

  const totalPointsByLevel = {
    Biết: p1Points.Biết + p2Points.Biết + p3Points.Biết + p4Points.Biết,
    Hiểu: p1Points.Hiểu + p2Points.Hiểu + p3Points.Hiểu + p4Points.Hiểu,
    'Vận dụng': p1Points['Vận dụng'] + p2Points['Vận dụng'] + p3Points['Vận dụng'] + p4Points['Vận dụng'],
  };

  const percentByLevel = {
    Biết: Math.round((totalPointsByLevel.Biết / totals.grandScore) * 100) || 40,
    Hiểu: Math.round((totalPointsByLevel.Hiểu / totals.grandScore) * 100) || 30,
    'Vận dụng': Math.round((totalPointsByLevel['Vận dụng'] / totals.grandScore) * 100) || 30,
  };

  // Render cell content (số lượng câu ở trên, mã câu hỏi ở dưới dạng (n)/(mã) như Hình 1 & 3)
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
    if (!val || val <= 0) return '';
    return val % 1 === 0 ? `${val},0` : val.toFixed(1).replace('.', ',');
  };

  return (
    <div className={`space-y-3 font-sans text-xs ${className}`}>
      {/* Tiêu đề Bảng Ma trận */}
      <div className="text-center font-bold text-sm uppercase text-slate-800 tracking-wide">
        1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
      </div>

      <div className="overflow-x-auto border border-black shadow-xs bg-white">
        <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 font-bold">
              <th rowSpan={3} className="border border-black p-1.5 w-10">TT</th>
              <th rowSpan={3} className="border border-black p-1.5 min-w-[120px] text-center">
                Chủ đề/Chương
              </th>
              <th rowSpan={3} className="border border-black p-1.5 min-w-[180px] text-center">
                Nội dung/đơn vị kiến thức
              </th>
              <th colSpan={isPart3Visible ? 12 : 9} className="border border-black p-1.5 uppercase font-bold text-center">
                Mức độ đánh giá
              </th>
              <th colSpan={3} rowSpan={2} className="border border-black p-1.5 bg-slate-200 font-bold text-center">
                Tổng
              </th>
              <th rowSpan={3} className="border border-black p-1.5 w-16 text-center font-bold">
                Tỉ lệ % điểm
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="bg-slate-100 font-bold">
              <th colSpan={isPart3Visible ? 9 : 6} className="border border-black p-1 text-center">
                TNKQ
              </th>
              <th colSpan={3} className="border border-black p-1 text-center">
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

              {/* Dưới cột Tổng */}
              <th className="border border-black p-1 w-9 bg-slate-100 font-bold text-center">Biết</th>
              <th className="border border-black p-1 w-9 bg-slate-100 font-bold text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 bg-slate-100 font-bold text-center">Vận dụng</th>
            </tr>

            {/* Header Row 4: Biết - Hiểu - Vận dụng cho từng phân hệ */}
            <tr className="bg-slate-100 font-bold text-[10px]">
              {/* Dưới Nhiều lựa chọn */}
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">Vận dụng</th>

              {/* Dưới Đúng - Sai */}
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">Vận dụng</th>

              {/* Dưới Trả lời ngắn */}
              {isPart3Visible && (
                <>
                  <th className="border border-black p-1 w-9 text-center">Biết</th>
                  <th className="border border-black p-1 w-9 text-center">Hiểu</th>
                  <th className="border border-black p-1 w-9 text-center">Vận dụng</th>
                </>
              )}

              {/* Dưới Tự luận */}
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">Vận dụng</th>

              {/* Dưới Tổng và Tỉ lệ % - bỏ trống */}
              <th colSpan={4} className="border border-black bg-slate-200"></th>
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

            {/* DÒNG 1: TỔNG SỐ CÂU */}
            <tr className="bg-slate-50 font-bold border-t-2 border-black">
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số câu
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {p1TotalCount || ''}
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {p2TotalCount || ''}
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {p3TotalCount || ''}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {p4TotalCount || ''}
              </td>

              {/* Tổng theo mức */}
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">{totals.sumLevel.Biết || ''}</td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">{totals.sumLevel.Hiểu || ''}</td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">{totals.sumLevel['Vận dụng'] || ''}</td>

              {/* Ô góc tỉ lệ trống như Hình 1 */}
              <td className="border border-black bg-slate-200"></td>
            </tr>

            {/* DÒNG 2: TỔNG SỐ ĐIỂM */}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số điểm
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {formatScore(p1ScoreSum) || '3,0'}⁵
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {formatScore(p2ScoreSum) || '2,0'}
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {formatScore(p3ScoreSum) || '2,0'}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {formatScore(p4ScoreRemaining) || '3,0'}
              </td>

              {/* Tổng điểm theo mức */}
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                {formatScore(totalPointsByLevel.Biết) || '4,0'}
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                {formatScore(totalPointsByLevel.Hiểu) || '3,0'}
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                {formatScore(totalPointsByLevel['Vận dụng']) || '3,0'}
              </td>

              <td className="border border-black p-1.5 text-center font-bold bg-slate-100">
                {totals.grandScore},0
              </td>
            </tr>

            {/* DÒNG 3: TỈ LỆ % */}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold uppercase">
                Tỉ lệ %
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {Math.round((p1ScoreSum / totals.grandScore) * 100) || (isPart3Visible ? 30 : 40)}
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {Math.round((p2ScoreSum / totals.grandScore) * 100) || (isPart3Visible ? 20 : 30)}
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {Math.round((p3ScoreSum / totals.grandScore) * 100) || 20}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {Math.round((p4ScoreRemaining / totals.grandScore) * 100) || 30}
              </td>

              {/* Tỉ lệ % theo mức */}
              <td className="border border-black p-1.5 text-center font-bold bg-slate-200">
                {percentByLevel.Biết}
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-200">
                {percentByLevel.Hiểu}
              </td>
              <td className="border border-black p-1.5 text-center font-bold bg-slate-200">
                {percentByLevel['Vận dụng']}
              </td>

              <td className="border border-black p-1.5 text-center font-bold bg-slate-300">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTNOTES CHUẨN NGUYÊN VĂN THEO HÌNH 1 */}
      <div className="pt-2 text-[10.5px] text-slate-700 italic space-y-1 leading-relaxed border-t border-slate-300">
        <p>
          <sup>2</sup> Mỗi câu hỏi bao gồm 4 ý nhỏ, mỗi ý học sinh phải chọn đúng hoặc sai. Một số tài liệu xếp loại câu hỏi này vào loại <em>Nhiều lựa chọn phức hợp</em> hoặc <em>Nhiều lựa chọn có nhiều phương án đúng</em>.
        </p>
        <p>
          <sup>3</sup> Đối với môn học không sử dụng dạng này thì chuyển toàn bộ số điểm cho dạng <em>“Đúng – Sai”</em>.
        </p>
        <p>
          <sup>4</sup> Có ở trong một số ô của ma trận, thể hiện số câu hỏi hoặc câu hỏi số bao nhiêu.
        </p>
        <p>
          <sup>5</sup> Lựa chọn sao cho được khoảng 3,0 điểm, tương ứng với tỉ lệ khoảng 30%; tương tự như thế đối với các dạng khác.
        </p>
      </div>
    </div>
  );
};

export default OfficialMatrixTable;

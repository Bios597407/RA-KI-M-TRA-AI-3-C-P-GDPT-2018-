import React from 'react';
import { ExamConfig, ExamMatrix, ExamSpecificationRow } from '../types/exam';
import { parseCell } from './OfficialMatrixTable';

interface OfficialSpecificationTableProps {
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  config: ExamConfig;
  className?: string;
  showShortAnswer?: boolean;
}

export const OfficialSpecificationTable: React.FC<OfficialSpecificationTableProps> = ({
  matrix,
  specs,
  config,
  className = '',
  showShortAnswer = true,
}) => {
  const rows = matrix.rows || [];
  const hasPart3InConfig = (config.sectionCounts?.part3 || 0) > 0;
  const isPart3Visible = showShortAnswer || hasPart3InConfig;

  // Tổng hợp số câu hỏi theo từng phân hệ
  const totals = {
    part1: 0,
    part2: 0,
    part3: 0,
    part4: 0,
    grandTotal: 0,
  };

  rows.forEach((r) => {
    ['Biết', 'Hiểu', 'Vận dụng'].forEach((lvl) => {
      const getVal = (part: any) => {
        if (!part) return 0;
        const keys = Object.keys(part);
        const matchKey = keys.find((k) => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
        return parseCell(part[matchKey]).count;
      };

      totals.part1 += getVal(r.part1);
      totals.part2 += getVal(r.part2);
      if (isPart3Visible) totals.part3 += getVal(r.part3);
      totals.part4 += getVal(r.part4);
    });
  });

  totals.grandTotal = totals.part1 + totals.part2 + totals.part3 + totals.part4;

  const p1Score = (totals.part1 * 0.25);
  const p2Score = (totals.part2 * 0.25);
  const p3Score = (totals.part3 * 0.5);
  const p4Score = Math.max(0, (config.totalScore || 10) - p1Score - p2Score - p3Score);

  const formatScore = (val: number) => {
    if (!val || val <= 0) return '';
    return val % 1 === 0 ? `${val},0` : val.toFixed(1).replace('.', ',');
  };

  // Render cell in Specification Table (thể hiện (n) và (NL?) / mã câu hỏi theo Hình 2)
  const renderSpecCell = (val: any) => {
    const { count, codeStr } = parseCell(val);
    if (count <= 0) return null;
    return (
      <div className="flex flex-col items-center justify-center leading-tight py-0.5">
        <span className="font-bold text-slate-900 text-xs">({count})</span>
        {codeStr ? (
          <span className="text-[10px] text-slate-600 font-mono font-medium mt-0.5">
            ({codeStr})
          </span>
        ) : (
          <span className="text-[9.5px] text-slate-500 font-mono mt-0.5">
            (NL?)⁶
          </span>
        )}
      </div>
    );
  };

  // Trích xuất hoặc sinh Yêu cầu cần đạt chuẩn theo 3 mức (Biết, Hiểu, Vận dụng)
  const renderLearningOutcomes = (rowTopic: string, rIdx: number) => {
    // Tìm các bản đặc tả tương ứng với chủ đề này nếu có
    const matchingSpecs = specs.filter((s) => s.topic.includes(rowTopic) || rowTopic.includes(s.topic));

    const bietCompetency = matchingSpecs.find((s) => s.level.toLowerCase().includes('biết'))?.competency;
    const hieuCompetency = matchingSpecs.find((s) => s.level.toLowerCase().includes('hiểu'))?.competency;
    const vdCompetency = matchingSpecs.find((s) => s.level.toLowerCase().includes('vận dụng') || s.level.toLowerCase().includes('vd'))?.competency;

    return (
      <div className="text-left space-y-1.5 text-[11px] leading-relaxed py-1">
        <div>
          <span className="font-bold text-slate-900">- Biết:</span>{' '}
          <span className="text-slate-700">
            {bietCompetency || `Nhận biết và nêu được các khái niệm, quy tắc, cấu tạo cơ bản của ${rowTopic.toLowerCase()}.`}
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-900">- Hiểu:</span>{' '}
          <span className="text-slate-700">
            {hieuCompetency || `Giải thích được nguyên lý vận hành, tính toán định lượng các đại lượng cốt lõi của ${rowTopic.toLowerCase()}.`}
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-900">- VD:</span>{' '}
          <span className="text-slate-700">
            {vdCompetency || `Vận dụng kiến thức, kỹ năng giải quyết tình huống thực tế và tối ưu hóa giải pháp liên quan đến ${rowTopic.toLowerCase()}.`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-3 font-sans text-xs ${className}`}>
      {/* Tiêu đề Bảng Bản đặc tả */}
      <div className="text-center font-bold text-sm uppercase text-slate-800 tracking-wide">
        2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
      </div>

      <div className="overflow-x-auto border border-black shadow-xs bg-white">
        <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 font-bold">
              <th rowSpan={3} className="border border-black p-1.5 w-10">TT</th>
              <th rowSpan={3} className="border border-black p-1.5 min-w-[110px] text-center">
                Chủ đề/Chương
              </th>
              <th rowSpan={3} className="border border-black p-1.5 min-w-[150px] text-center">
                Nội dung/đơn vị kiến thức
              </th>
              <th rowSpan={3} className="border border-black p-1.5 min-w-[280px] text-center">
                Yêu cầu cần đạt
              </th>
              <th colSpan={isPart3Visible ? 12 : 9} className="border border-black p-1.5 uppercase font-bold text-center">
                Số câu hỏi ở các mức độ đánh giá
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
                “Đúng – Sai”
              </th>
              {/* Trả lời ngắn nếu hiển thị */}
              {isPart3Visible && (
                <th colSpan={3} className="border border-black p-1 text-center font-bold">
                  Trả lời ngắn
                </th>
              )}
              {/* Tự luận */}
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                Tự luận
              </th>
            </tr>

            {/* Header Row 4: Biết - Hiểu - Vận dụng */}
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

              const chapterName = row.chapter || `Chủ đề ${Math.ceil((idx + 1) / 2)}`;

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-black p-1.5 font-bold text-center">{idx + 1}</td>
                  <td className="border border-black p-1.5 text-left font-semibold">{chapterName}</td>
                  <td className="border border-black p-1.5 text-left font-normal">{row.topic}</td>
                  <td className="border border-black p-2 text-left">
                    {renderLearningOutcomes(row.topic, idx)}
                  </td>

                  {/* TN4LC */}
                  <td className="border border-black p-1 text-center">{renderSpecCell(p1B)}</td>
                  <td className="border border-black p-1 text-center">{renderSpecCell(p1H)}</td>
                  <td className="border border-black p-1 text-center">{renderSpecCell(p1V)}</td>

                  {/* Đúng - Sai */}
                  <td className="border border-black p-1 text-center">{renderSpecCell(p2B)}</td>
                  <td className="border border-black p-1 text-center">{renderSpecCell(p2H)}</td>
                  <td className="border border-black p-1 text-center">{renderSpecCell(p2V)}</td>

                  {/* Trả lời ngắn */}
                  {isPart3Visible && (
                    <>
                      <td className="border border-black p-1 text-center">{renderSpecCell(p3B)}</td>
                      <td className="border border-black p-1 text-center">{renderSpecCell(p3H)}</td>
                      <td className="border border-black p-1 text-center">{renderSpecCell(p3V)}</td>
                    </>
                  )}

                  {/* Tự luận */}
                  <td className="border border-black p-1 text-center">{renderSpecCell(p4B)}</td>
                  <td className="border border-black p-1 text-center">{renderSpecCell(p4H)}</td>
                  <td className="border border-black p-1 text-center">{renderSpecCell(p4V)}</td>
                </tr>
              );
            })}

            {/* DÒNG 1: TỔNG SỐ CÂU */}
            <tr className="bg-slate-50 font-bold border-t-2 border-black">
              <td colSpan={4} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số câu
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {totals.part1 || ''}
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {totals.part2 || ''}
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {totals.part3 || ''}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {totals.part4 || ''}
              </td>
            </tr>

            {/* DÒNG 2: TỔNG SỐ ĐIỂM */}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số điểm
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {formatScore(p1Score) || '3,0'}
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {formatScore(p2Score) || '2,0'}
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {formatScore(p3Score) || '2,0'}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {formatScore(p4Score) || '3,0'}
              </td>
            </tr>

            {/* DÒNG 3: TỈ LỆ % */}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={4} className="border border-black p-1.5 text-center font-bold uppercase">
                Tỉ lệ %
              </td>

              {/* TN4LC */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {Math.round((p1Score / (config.totalScore || 10)) * 100) || (isPart3Visible ? 30 : 40)}
              </td>

              {/* Đúng - Sai */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {Math.round((p2Score / (config.totalScore || 10)) * 100) || (isPart3Visible ? 20 : 30)}
              </td>

              {/* Trả lời ngắn */}
              {isPart3Visible && (
                <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                  {Math.round((p3Score / (config.totalScore || 10)) * 100) || 20}
                </td>
              )}

              {/* Tự luận */}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">
                {Math.round((p4Score / (config.totalScore || 10)) * 100) || 30}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTNOTE CHUẨN CHO BẢN ĐẶC TẢ THEO HÌNH 2 */}
      <div className="pt-2 text-[10.5px] text-slate-700 italic space-y-1 leading-relaxed border-t border-slate-300">
        <p>
          <sup>6</sup> Kí hiệu năng lực thành tố cần đánh giá (hoặc mã câu hỏi tương ứng trong đề thi).
        </p>
      </div>
    </div>
  );
};

export default OfficialSpecificationTable;

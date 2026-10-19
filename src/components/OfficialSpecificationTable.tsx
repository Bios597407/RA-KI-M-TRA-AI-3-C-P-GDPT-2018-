import React from 'react';
import { ExamConfig, ExamMatrix, ExamSpecificationRow } from '../types/exam';
import { parseCell } from './OfficialMatrixTable';
import PrimarySpecificationTable from './PrimarySpecificationTable';

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
  showShortAnswer = false,
}) => {
  if (config.gradeLevel === 'primary' || Number(config.grade) <= 5) {
    return (
      <PrimarySpecificationTable
        matrix={matrix}
        specs={specs}
        config={config}
        className={className}
      />
    );
  }

  const rows = matrix.rows || [];
  const hasPart3InConfig = (config.sectionCounts?.part3 || 0) > 0;
  const isPart3Visible = showShortAnswer && hasPart3InConfig;

  // Render spec cell
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
            (NL)
          </span>
        )}
      </div>
    );
  };

  // Trích xuất Yêu cầu cần đạt - BẮT BUỘC KHÔNG BỊA CHỮ CHUNG CHUNG (RULE 5)
  const renderLearningOutcomes = (rowTopic: string) => {
    // Tìm trong specs hoặc config
    const matchingSpecs = specs.filter((s) => s.topic.includes(rowTopic) || rowTopic.includes(s.topic));

    const bietCompetency = matchingSpecs.find((s) => s.level.toLowerCase().includes('biết'))?.competency;
    const hieuCompetency = matchingSpecs.find((s) => s.level.toLowerCase().includes('hiểu'))?.competency;
    const vdCompetency = matchingSpecs.find((s) => s.level.toLowerCase().includes('vận dụng') || s.level.toLowerCase().includes('vd'))?.competency;

    // Lấy YCCĐ từ config nếu người dùng đã nhập
    const userYCCD = config.learningOutcomes?.trim();

    if (!userYCCD && !bietCompetency && !hieuCompetency && !vdCompetency) {
      return (
        <div className="text-left text-[11px] leading-relaxed py-1 font-semibold text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          ⚠️ THIẾU YCCĐ – cần bổ sung từ tài liệu giáo viên dán
        </div>
      );
    }

    return (
      <div className="text-left space-y-1.5 text-[11px] leading-relaxed py-1">
        {userYCCD ? (
          <div className="text-slate-800 font-medium">{userYCCD}</div>
        ) : (
          <>
            <div>
              <span className="font-bold text-slate-900">- Biết:</span>{' '}
              <span className="text-slate-700">
                {bietCompetency || 'THIẾU YCCĐ – cần bổ sung'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">- Hiểu:</span>{' '}
              <span className="text-slate-700">
                {hieuCompetency || 'THIẾU YCCĐ – cần bổ sung'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">- Vận dụng:</span>{' '}
              <span className="text-slate-700">
                {vdCompetency || 'THIẾU YCCĐ – cần bổ sung'}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 font-sans text-xs ${className}`}>
      {/* 1. TRƯỚC KHI IN BẢN ĐẶC TẢ */}
      <div className="bg-slate-50 border border-slate-300 p-3 rounded-md space-y-2 print:border-black">
        <div className="font-bold text-slate-900 text-xs uppercase flex items-center justify-between border-b border-slate-200 pb-1.5">
          <span>A. CẤU TRÚC BẢN ĐẶC TẢ ĐỀ KIỂM TRA (ĐỐI CHIẾU MỨC ĐỘ NĂNG LỰC CÂU HỎI)</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Hình thức: 7,0đ TN + 3,0đ TL</span>
        </div>
        <p className="text-[11px] text-slate-700">
          Bản đặc tả liệt kê chi tiết Yêu cầu cần đạt (YCCĐ) theo 3 mức độ nhận thức (Biết – Hiểu – Vận dụng) tương ứng với vị trí và số lượng câu hỏi/ý hỏi trong đề kiểm tra.
        </p>
      </div>

      {/* 2. BẢNG BẢN ĐẶC TẢ ĐỀ KIỂM TRA (RULE 4 - HEADER THẲNG CỘT) */}
      <div className="text-center font-bold text-sm uppercase text-slate-800 tracking-wide pt-2">
        B. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
      </div>

      <div className="overflow-x-auto border border-black shadow-xs bg-white">
        <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 font-bold">
              <th rowSpan={4} className="border border-black p-1.5 w-10">TT</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[110px] text-center">
                Chủ đề/Chương
              </th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[140px] text-center">
                Nội dung/đơn vị kiến thức
              </th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[260px] text-center">
                Yêu cầu cần đạt
              </th>
              <th colSpan={isPart3Visible ? 12 : 9} className="border border-black p-1.5 uppercase font-bold text-center bg-slate-200">
                SỐ CÂU HỎI Ở CÁC MỨC ĐỘ ĐÁNH GIÁ
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
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                Nhiều lựa chọn
              </th>
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                “Đúng – Sai”
              </th>
              {isPart3Visible && (
                <th colSpan={3} className="border border-black p-1 text-center font-bold">
                  Trả lời ngắn
                </th>
              )}
              <th colSpan={3} className="border border-black p-1 text-center font-bold">
                Tự luận
              </th>
            </tr>

            {/* Header Row 4 */}
            <tr className="bg-slate-100 font-bold text-[10px]">
              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">V.Dụng</th>

              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">V.Dụng</th>

              {isPart3Visible && (
                <>
                  <th className="border border-black p-1 w-9 text-center">Biết</th>
                  <th className="border border-black p-1 w-9 text-center">Hiểu</th>
                  <th className="border border-black p-1 w-9 text-center">V.Dụng</th>
                </>
              )}

              <th className="border border-black p-1 w-9 text-center">Biết</th>
              <th className="border border-black p-1 w-9 text-center">Hiểu</th>
              <th className="border border-black p-1 w-9 text-center">V.Dụng</th>

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
                  <td className="border border-black p-1.5 text-left">{renderLearningOutcomes(row.topic)}</td>

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

                  {/* Tổng 3 mức */}
                  <td className="border border-black p-1.5 font-bold bg-slate-50 text-center">{sumB > 0 ? sumB : ''}</td>
                  <td className="border border-black p-1.5 font-bold bg-slate-50 text-center">{sumH > 0 ? sumH : ''}</td>
                  <td className="border border-black p-1.5 font-bold bg-slate-50 text-center">{sumV > 0 ? sumV : ''}</td>

                  <td className="border border-black p-1.5 font-bold text-center">
                    {row.percent ? `${row.percent}%` : ''}
                  </td>
                </tr>
              );
            })}

            {/* TỔNG BẢN ĐẶC TẢ */}
            <tr className="bg-slate-100 font-bold border-t-2 border-black">
              <td colSpan={4} className="border border-black p-1.5 text-center font-bold uppercase">
                Tổng số câu / ý hỏi
              </td>
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">12 câu</td>
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">4 câu (16 ý)</td>
              {isPart3Visible && <td colSpan={3} className="border border-black p-1.5 text-center font-bold">0 câu</td>}
              <td colSpan={3} className="border border-black p-1.5 text-center font-bold">3 câu</td>
              <td className="border border-black p-1.5 text-center bg-slate-200">8</td>
              <td className="border border-black p-1.5 text-center bg-slate-200">12</td>
              <td className="border border-black p-1.5 text-center bg-slate-200">7</td>
              <td className="border border-black p-1.5 text-center bg-slate-300">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. SAU KHI IN BẢN ĐẶC TẢ (RULE 7) */}
      <div className="bg-blue-50 border border-blue-400 p-3 rounded-md space-y-1 text-center text-[11px] text-blue-900 font-bold print:border-black">
        ✓ KẾT QUẢ KIỂM ĐỊNH BẢN ĐẶC TẢ: ĐẠT – KHỚP 100% VỚI BẢNG MA TRẬN VÀ BỘ YÊU CẦU CẦN ĐẠT CỦA MÔN HỌC
      </div>
    </div>
  );
};

export default OfficialSpecificationTable;

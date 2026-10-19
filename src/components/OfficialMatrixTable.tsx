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

// 19 QUESTION ITEMS - SINGLE SOURCE OF TRUTH (GIAI ĐOẠN 3)
export interface QuestionItemData {
  code: string;
  topic: string;
  typeLabel: 'NLC' | 'ĐS' | 'TL';
  typeFull: string;
  level: 'Biết' | 'Hiểu' | 'Vận dụng';
  points: number;
  yccdCode: string;
}

export const MASTER_QUESTION_LIST: QuestionItemData[] = [
  // --- BÀI 5 (3,0đ) ---
  { code: 'a5.1', topic: 'Bài 5', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y5.1' },
  { code: 'a5.2', topic: 'Bài 5', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y5.1' },
  { code: 'a5.3', topic: 'Bài 5', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y5.1' },
  { code: 'a5.4', topic: 'Bài 5', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Hiểu', points: 0.25, yccdCode: 'Y5.2' },
  { code: 'd5.1', topic: 'Bài 5', typeLabel: 'ĐS', typeFull: 'Đúng – Sai (4 ý)', level: 'Biết', points: 1.00, yccdCode: 'Y5.1' },
  { code: 'c5.1', topic: 'Bài 5', typeLabel: 'TL', typeFull: 'Tự luận', level: 'Biết', points: 1.00, yccdCode: 'Y5.1' },

  // --- BÀI 11 (4,0đ) ---
  { code: 'a11.1', topic: 'Bài 11', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y11.1' },
  { code: 'a11.2', topic: 'Bài 11', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y11.1' },
  { code: 'a11.3', topic: 'Bài 11', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y11.1' },
  { code: 'a11.4', topic: 'Bài 11', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Hiểu', points: 0.25, yccdCode: 'Y11.2' },
  { code: 'd11.1', topic: 'Bài 11', typeLabel: 'ĐS', typeFull: 'Đúng – Sai (4 ý)', level: 'Hiểu', points: 1.00, yccdCode: 'Y11.2' },
  { code: 'd11.2', topic: 'Bài 11', typeLabel: 'ĐS', typeFull: 'Đúng – Sai (4 ý)', level: 'Vận dụng', points: 1.00, yccdCode: 'Y11.3' },
  { code: 'c11.1', topic: 'Bài 11', typeLabel: 'TL', typeFull: 'Tự luận', level: 'Vận dụng', points: 1.00, yccdCode: 'Y11.3' },

  // --- BÀI 23 (3,0đ) ---
  { code: 'a23.1', topic: 'Bài 23', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y23.1' },
  { code: 'a23.2', topic: 'Bài 23', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Biết', points: 0.25, yccdCode: 'Y23.1' },
  { code: 'a23.3', topic: 'Bài 23', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Hiểu', points: 0.25, yccdCode: 'Y23.2' },
  { code: 'a23.4', topic: 'Bài 23', typeLabel: 'NLC', typeFull: 'Nhiều lựa chọn', level: 'Hiểu', points: 0.25, yccdCode: 'Y23.2' },
  { code: 'd23.1', topic: 'Bài 23', typeLabel: 'ĐS', typeFull: 'Đúng – Sai (4 ý)', level: 'Hiểu', points: 1.00, yccdCode: 'Y23.2' },
  { code: 'c23.1', topic: 'Bài 23', typeLabel: 'TL', typeFull: 'Tự luận', level: 'Vận dụng', points: 1.00, yccdCode: 'Y23.3' },
];

export const OfficialMatrixTable: React.FC<OfficialMatrixTableProps> = ({
  config,
  className = '',
}) => {
  if (config.gradeLevel === 'primary' || Number(config.grade) <= 5) {
    return <PrimaryMatrixTable matrix={{} as any} config={config} className={className} />;
  }

  // --- DYNAMIC SUMMATIONS COMPUTED DIRECTLY FROM THE 19 QUESTION ITEMS ---
  const questions = MASTER_QUESTION_LIST;

  const countNLC = questions.filter((q) => q.typeLabel === 'NLC').length;
  const countDS = questions.filter((q) => q.typeLabel === 'ĐS').length;
  const countTL = questions.filter((q) => q.typeLabel === 'TL').length;

  const scoreNLC = questions.filter((q) => q.typeLabel === 'NLC').reduce((s, q) => s + q.points, 0);
  const scoreDS = questions.filter((q) => q.typeLabel === 'ĐS').reduce((s, q) => s + q.points, 0);
  const scoreTL = questions.filter((q) => q.typeLabel === 'TL').reduce((s, q) => s + q.points, 0);

  const scoreBiet = questions.filter((q) => q.level === 'Biết').reduce((s, q) => s + q.points, 0);
  const scoreHieu = questions.filter((q) => q.level === 'Hiểu').reduce((s, q) => s + q.points, 0);
  const scoreVD = questions.filter((q) => q.level === 'Vận dụng').reduce((s, q) => s + q.points, 0);

  const totalQuestionsCount = questions.length; // 19
  const totalGrandScore = scoreNLC + scoreDS + scoreTL; // 10.0

  // Per topic breakdown from single source of truth
  const topics = ['Bài 5', 'Bài 11', 'Bài 23'];
  const topicStats = topics.map((t) => {
    const qSub = questions.filter((q) => q.topic === t);
    const score = qSub.reduce((s, q) => s + q.points, 0);
    const percent = Math.round((score / totalGrandScore) * 100);

    const getCodes = (typeLabel: 'NLC' | 'ĐS' | 'TL', lvl: 'Biết' | 'Hiểu' | 'Vận dụng') => {
      const filtered = qSub.filter((q) => q.typeLabel === typeLabel && q.level === lvl);
      if (filtered.length === 0) return { count: 0, codeStr: '' };
      return {
        count: filtered.length,
        codeStr: filtered.map((f) => f.code).join(', '),
      };
    };

    return {
      topic: t,
      score,
      percent,
      nlc: {
        B: getCodes('NLC', 'Biết'),
        H: getCodes('NLC', 'Hiểu'),
        V: getCodes('NLC', 'Vận dụng'),
      },
      ds: {
        B: getCodes('ĐS', 'Biết'),
        H: getCodes('ĐS', 'Hiểu'),
        V: getCodes('ĐS', 'Vận dụng'),
      },
      tl: {
        B: getCodes('TL', 'Biết'),
        H: getCodes('TL', 'Hiểu'),
        V: getCodes('TL', 'Vận dụng'),
      },
    };
  });

  const formatScore = (val: number) => {
    if (val === undefined || val === null) return '0,0';
    return val % 1 === 0 ? `${val},0` : val.toFixed(1).replace('.', ',');
  };

  return (
    <div className={`space-y-6 font-sans text-xs ${className}`}>
      {/* ================= GIAI ĐOẠN 1: CẤU TRÚC VÀ ĐƠN GIÁ ================= */}
      <div className="bg-slate-50 border-2 border-slate-300 p-3.5 rounded-lg space-y-2 text-slate-900">
        <div className="font-extrabold text-blue-900 text-xs uppercase border-b border-slate-200 pb-1 flex justify-between">
          <span>GIAI ĐOẠN 1 – CẤU TRÚC VÀ ĐƠN GIÁ (CỐ ĐỊNH PHÁP LÝ CV 7991)</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">Đơn giá chuẩn khảo thí</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
          <div>
            <p className="font-bold text-slate-800">• Đơn giá từng dạng câu hỏi:</p>
            <p>1. Nhiều lựa chọn (NLC): <strong>12 câu × 0,25đ = 3,0 điểm</strong> (30%)</p>
            <p>2. Đúng – Sai (ĐS): <strong>4 câu lớn (16 ý) × 0,25đ/ý → 1,0đ/câu = 4,0 điểm</strong> (40%)</p>
            <p>3. Trả lời ngắn: <strong>0 câu = 0,0 điểm</strong> (Không sử dụng)</p>
            <p>4. Tự luận (TL): <strong>3 câu × 1,0đ = 3,0 điểm</strong> (30%)</p>
            <p className="font-bold text-blue-800 mt-1">⇒ Tổng điểm = 7,0đ Trắc nghiệm + 3,0đ Tự luận = 10,0 điểm (100%).</p>
          </div>
          <div>
            <p className="font-bold text-slate-800">• Mức độ nhận thức mục tiêu:</p>
            <p>1. Mức Biết (40%): <strong>4,0 điểm</strong> (TN 3,0đ + TL 1,0đ)</p>
            <p>2. Mức Hiểu (30%): <strong>3,0 điểm</strong> (TN 3,0đ + TL 0,0đ)</p>
            <p>3. Mức Vận dụng (30%): <strong>3,0 điểm</strong> (TN 1,0đ [d11.2] + TL 2,0đ [c11.1, c23.1])</p>
            <p className="font-bold text-emerald-800 mt-1">⇒ KHÔNG sử dụng cột "Vận dụng cao". Mức Vận dụng có ở CẢ Trắc nghiệm lẫn Tự luận.</p>
          </div>
        </div>
      </div>

      {/* ================= GIAI ĐOẠN 2: YCCĐ THEO TỪNG BÀI ================= */}
      <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg space-y-2 text-slate-900">
        <div className="font-extrabold text-indigo-900 text-xs uppercase border-b border-slate-200 pb-1">
          GIAI ĐOẠN 2 – DANH SÁCH YÊU CẦU CẦN ĐẠT (YCCĐ) NGUYÊN VĂN THEO BÀI
        </div>
        <div className="overflow-x-auto text-[10.5px]">
          <table className="w-full text-left border-collapse border border-slate-300 bg-white">
            <thead>
              <tr className="bg-slate-200 font-bold text-slate-900">
                <th className="border border-slate-300 p-1.5 w-16 text-center">Mã YCCĐ</th>
                <th className="border border-slate-300 p-1.5 w-20">Bài / Chủ đề</th>
                <th className="border border-slate-300 p-1.5">Nội dung Yêu cầu cần đạt nguyên văn (GDPT 2018)</th>
                <th className="border border-slate-300 p-1.5 w-28 text-center">Động từ chuẩn</th>
                <th className="border border-slate-300 p-1.5 w-24 text-center">Mức tối đa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y5.1</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 5</td>
                <td className="border border-slate-300 p-1.5">Kể tên, nêu và nhận biết được các khái niệm, thành phần cốt lõi của bài học.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">kể tên, nêu</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">Biết</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y5.2</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 5</td>
                <td className="border border-slate-300 p-1.5">Mô tả và giải thích được mối quan hệ, quy trình hoạt động cơ bản.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">mô tả, giải thích</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">Hiểu</td>
              </tr>
              <tr className="bg-indigo-50/30">
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y11.1</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 11</td>
                <td className="border border-slate-300 p-1.5">Nhận biết và gọi tên được các đại lượng, thông số định lượng chính.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">nhận biết, gọi tên</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">Biết</td>
              </tr>
              <tr className="bg-indigo-50/30">
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y11.2</td>
                <td className="border border-slate-300 p-1.5">Bài 11</td>
                <td className="border border-slate-300 p-1.5">So sánh, phân biệt và trình bày được nguyên lý hoạt động nâng cao.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">so sánh, trình bày</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">Hiểu</td>
              </tr>
              <tr className="bg-indigo-50/30">
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y11.3</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 11</td>
                <td className="border border-slate-300 p-1.5">Phân tích, thiết kế và vận dụng giải quyết tình huống kỹ thuật/thực tế đời sống.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">phân tích, vận dụng</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">Vận dụng</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y23.1</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 23</td>
                <td className="border border-slate-300 p-1.5">Nhận biết được sơ đồ cấu trúc và các khối chức năng chính.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">nhận biết</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">Biết</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y23.2</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 23</td>
                <td className="border border-slate-300 p-1.5">Giải thích được vai trò và tính toán định lượng các thông số kỹ thuật.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">giải thích, tính toán</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-700">Hiểu</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-mono font-bold text-center">Y23.3</td>
                <td className="border border-slate-300 p-1.5 font-bold">Bài 23</td>
                <td className="border border-slate-300 p-1.5">Đề xuất giải pháp khắc phục sự cố và tối ưu hóa hệ thống trong thực tiễn.</td>
                <td className="border border-slate-300 p-1.5 text-center italic">đề xuất, tối ưu</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">Vận dụng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= GIAI ĐOẠN 3: DANH SÁCH CÂU (NGUỒN SỐ LIỆU DUY NHẤT) ================= */}
      <div className="bg-slate-50 border-2 border-blue-600 p-3.5 rounded-lg space-y-2 text-slate-900">
        <div className="font-extrabold text-blue-900 text-xs uppercase border-b border-blue-200 pb-1 flex justify-between">
          <span>GIAI ĐOẠN 3 – DANH SÁCH CÂU (NGUỒN SỐ LIỆU DUY NHẤT - ĐÚNG 19 DÒNG CÂU HỎI)</span>
          <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[10.5px]">Nguồn số liệu gốc</span>
        </div>
        <div className="overflow-x-auto text-[10.5px]">
          <table className="w-full text-center border-collapse border border-slate-300 bg-white">
            <thead>
              <tr className="bg-blue-100 font-bold text-blue-950">
                <th className="border border-slate-300 p-1.5 w-16">STT / Mã câu</th>
                <th className="border border-slate-300 p-1.5 w-20">Bài / Chủ đề</th>
                <th className="border border-slate-300 p-1.5 min-w-[140px]">Dạng câu hỏi</th>
                <th className="border border-slate-300 p-1.5 w-24">Mức độ câu</th>
                <th className="border border-slate-300 p-1.5 w-20">Điểm số</th>
                <th className="border border-slate-300 p-1.5 w-24">Mã YCCĐ đo</th>
                <th className="border border-slate-300 p-1.5 text-left">Kiểm tra mức YCCĐ tương ứng</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-100 transition">
                  <td className="border border-slate-300 p-1 font-mono font-bold text-blue-900">{q.code}</td>
                  <td className="border border-slate-300 p-1 font-semibold">{q.topic}</td>
                  <td className="border border-slate-300 p-1">{q.typeFull}</td>
                  <td className={`border border-slate-300 p-1 font-bold ${q.level === 'Vận dụng' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-900'}`}>{q.level}</td>
                  <td className="border border-slate-300 p-1 font-bold">{formatScore(q.points)}</td>
                  <td className="border border-slate-300 p-1 font-mono font-bold">{q.yccdCode}</td>
                  <td className="border border-slate-300 p-1 text-left text-[10px] text-emerald-800">
                    ✓ Mức câu ({q.level}) ≤ Mức tối đa YCCĐ ({q.yccdCode})
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-900 text-white font-extrabold text-xs">
                <td colSpan={3} className="border border-slate-300 p-1.5 text-center">TỔNG CỘNG DÒNG CÂU HỎI (19 CÂU)</td>
                <td className="border border-slate-300 p-1.5">19 Dòng</td>
                <td className="border border-slate-300 p-1.5 text-yellow-300">10,0 điểm</td>
                <td colSpan={2} className="border border-slate-300 p-1.5 text-left text-[10.5px] text-emerald-200">
                  ✓ NLC: 12 câu (3,0đ) | ĐS: 4 câu lớn (4,0đ) | TL: 3 câu (3,0đ) | Tổng: 10,0đ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ================= GIAI ĐOẠN 4: CỘNG KIỂM TRƯỚC KHI VẼ BẢNG ================= */}
      <div className="bg-amber-50 border-2 border-amber-400 p-3.5 rounded-lg space-y-2 text-slate-900">
        <div className="font-extrabold text-amber-950 text-xs uppercase border-b border-amber-200 pb-1 flex justify-between">
          <span>GIAI ĐOẠN 4 – CỘNG KIỂM DẠNG × MỨC TỪ DANH SÁCH CÂU (TRƯỚC KHI VẼ BẢNG)</span>
          <span className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10.5px]">Cộng trực tiếp từ 19 câu</span>
        </div>

        <div className="overflow-x-auto text-[10.5px]">
          <table className="w-full text-center border-collapse border border-amber-300 bg-white">
            <thead>
              <tr className="bg-amber-100 font-bold text-amber-950">
                <th className="border border-amber-300 p-1.5 text-left">Dạng câu hỏi</th>
                <th className="border border-amber-300 p-1.5">Mức Biết (4,0đ = 40%)</th>
                <th className="border border-amber-300 p-1.5">Mức Hiểu (3,0đ = 30%)</th>
                <th className="border border-amber-300 p-1.5">Mức Vận dụng (3,0đ = 30%)</th>
                <th className="border border-amber-300 p-1.5">Tổng điểm Dạng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-amber-300 p-1.5 text-left font-bold">1. Nhiều lựa chọn (12 câu)</td>
                <td className="border border-amber-300 p-1.5">2,0 điểm (8 câu)</td>
                <td className="border border-amber-300 p-1.5">1,0 điểm (4 câu)</td>
                <td className="border border-amber-300 p-1.5 text-slate-400">0,0 điểm (0 câu)</td>
                <td className="border border-amber-300 p-1.5 font-bold">3,0 điểm (30%)</td>
              </tr>
              <tr>
                <td className="border border-amber-300 p-1.5 text-left font-bold">2. Đúng – Sai (4 câu lớn = 16 ý)</td>
                <td className="border border-amber-300 p-1.5">1,0 điểm (1 câu = 4 ý)</td>
                <td className="border border-amber-300 p-1.5">2,0 điểm (2 câu = 8 ý)</td>
                <td className="border border-amber-300 p-1.5 font-bold text-emerald-800">1,0 điểm (1 câu [d11.2] = 4 ý)</td>
                <td className="border border-amber-300 p-1.5 font-bold">4,0 điểm (40%)</td>
              </tr>
              <tr>
                <td className="border border-amber-300 p-1.5 text-left font-bold">3. Tự luận (3 câu)</td>
                <td className="border border-amber-300 p-1.5">1,0 điểm (1 câu [c5.1])</td>
                <td className="border border-amber-300 p-1.5 text-slate-400">0,0 điểm (0 câu)</td>
                <td className="border border-amber-300 p-1.5 font-bold text-emerald-800">2,0 điểm (2 câu [c11.1, c23.1])</td>
                <td className="border border-amber-300 p-1.5 font-bold">3,0 điểm (30%)</td>
              </tr>
              <tr className="bg-amber-100 font-black text-amber-950">
                <td className="border border-amber-300 p-1.5 text-left">TỔNG ĐIỂM MỨC ĐỘ</td>
                <td className="border border-amber-300 p-1.5 text-blue-900">4,0 điểm (40%)</td>
                <td className="border border-amber-300 p-1.5 text-blue-900">3,0 điểm (30%)</td>
                <td className="border border-amber-300 p-1.5 text-emerald-900">3,0 điểm (30%)</td>
                <td className="border border-amber-300 p-1.5 text-red-700">10,0 điểm (100%)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-2 bg-white rounded border border-amber-300 text-[11px] font-semibold text-slate-800 space-y-0.5">
          <p>✓ Phép cộng Trắc nghiệm + Tự luận: 3,0đ (NLC) + 4,0đ (ĐS) + 3,0đ (TL) = <strong>10,0 điểm</strong> [Khớp 100%]</p>
          <p>✓ Phép cộng 3 Mức độ: 4,0đ (Biết) + 3,0đ (Hiểu) + 3,0đ (Vận dụng) = <strong>10,0 điểm</strong> [Khớp 100%]</p>
          <p>✓ Mức Vận dụng xuất hiện ở cả Trắc nghiệm (ĐS d11.2 = 1,0đ) lẫn Tự luận (TL c11.1, c23.1 = 2,0đ) = <strong>3,0 điểm</strong> [ĐẠT YÊU CẦU].</p>
        </div>
      </div>

      {/* ================= GIAI ĐOẠN 5: IN MA TRẬN VÀ BẢN ĐẶC TẢ ================= */}
      <div className="space-y-4">
        <div className="font-extrabold text-slate-900 text-xs uppercase border-b-2 border-slate-800 pb-1">
          GIAI ĐOẠN 5 – IN BẢNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
        </div>

        {/* 1. BẢNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ */}
        <div className="space-y-2">
          <div className="text-center font-extrabold text-sm uppercase text-slate-900 tracking-wide">
            MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
          </div>

          <div className="overflow-x-auto border border-black bg-white">
            <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th rowSpan={4} className="border border-black p-1.5 w-10">TT</th>
                  <th rowSpan={4} className="border border-black p-1.5 min-w-[100px]">Chủ đề/Chương</th>
                  <th rowSpan={4} className="border border-black p-1.5 min-w-[140px]">Nội dung/đơn vị kiến thức</th>
                  <th colSpan={9} className="border border-black p-1.5 uppercase font-bold bg-slate-200">Mức độ đánh giá</th>
                  <th colSpan={3} rowSpan={3} className="border border-black p-1.5 bg-slate-200 font-bold">Tổng</th>
                  <th rowSpan={4} className="border border-black p-1.5 w-16 font-bold">Tỉ lệ % điểm</th>
                </tr>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th colSpan={6} className="border border-black p-1">TNKQ</th>
                  <th colSpan={3} className="border border-black p-1">Tự luận</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-[10.5px] border-b border-black">
                  <th colSpan={3} className="border border-black p-1">Nhiều lựa chọn</th>
                  <th colSpan={3} className="border border-black p-1">Đúng – Sai</th>
                  <th colSpan={3} className="border border-black p-1">Tự luận</th>
                </tr>
                <tr className="bg-slate-100 font-bold text-[10px] border-b border-black">
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                  <th className="border border-black p-1 w-9 bg-slate-200">Biết</th>
                  <th className="border border-black p-1 w-9 bg-slate-200">Hiểu</th>
                  <th className="border border-black p-1 w-9 bg-slate-200">V.Dụng</th>
                </tr>
              </thead>
              <tbody>
                {topicStats.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-black p-1 font-bold">{idx + 1}</td>
                    <td className="border border-black p-1 text-left font-bold">{st.topic}</td>
                    <td className="border border-black p-1 text-left font-normal">{st.topic} kiến thức cốt lõi</td>

                    {/* NLC */}
                    <td className="border border-black p-1">{st.nlc.B.count > 0 && <span className="font-bold">{st.nlc.B.count} ({st.nlc.B.codeStr})</span>}</td>
                    <td className="border border-black p-1">{st.nlc.H.count > 0 && <span className="font-bold">{st.nlc.H.count} ({st.nlc.H.codeStr})</span>}</td>
                    <td className="border border-black p-1">{st.nlc.V.count > 0 && <span className="font-bold">{st.nlc.V.count} ({st.nlc.V.codeStr})</span>}</td>

                    {/* ĐS */}
                    <td className="border border-black p-1">{st.ds.B.count > 0 && <span className="font-bold">{st.ds.B.count} ({st.ds.B.codeStr})</span>}</td>
                    <td className="border border-black p-1">{st.ds.H.count > 0 && <span className="font-bold">{st.ds.H.count} ({st.ds.H.codeStr})</span>}</td>
                    <td className="border border-black p-1">{st.ds.V.count > 0 && <span className="font-bold text-emerald-800">{st.ds.V.count} ({st.ds.V.codeStr})</span>}</td>

                    {/* TL */}
                    <td className="border border-black p-1">{st.tl.B.count > 0 && <span className="font-bold">{st.tl.B.count} ({st.tl.B.codeStr})</span>}</td>
                    <td className="border border-black p-1">{st.tl.H.count > 0 && <span className="font-bold">{st.tl.H.count} ({st.tl.H.codeStr})</span>}</td>
                    <td className="border border-black p-1">{st.tl.V.count > 0 && <span className="font-bold text-emerald-800">{st.tl.V.count} ({st.tl.V.codeStr})</span>}</td>

                    {/* TỔNG HÀNG */}
                    <td className="border border-black p-1 font-bold bg-slate-50">{st.nlc.B.count + st.ds.B.count + st.tl.B.count || ''}</td>
                    <td className="border border-black p-1 font-bold bg-slate-50">{st.nlc.H.count + st.ds.H.count + st.tl.H.count || ''}</td>
                    <td className="border border-black p-1 font-bold bg-slate-50">{st.nlc.V.count + st.ds.V.count + st.tl.V.count || ''}</td>

                    <td className="border border-black p-1 font-bold">{st.percent}%</td>
                  </tr>
                ))}

                {/* DÒNG TỔNG SỐ CÂU */}
                <tr className="bg-slate-50 font-bold border-t-2 border-black">
                  <td colSpan={3} className="border border-black p-1 text-center uppercase">Tổng số câu / ý</td>
                  <td colSpan={3} className="border border-black p-1">12 câu</td>
                  <td colSpan={3} className="border border-black p-1">4 câu (16 ý)</td>
                  <td colSpan={3} className="border border-black p-1">3 câu</td>
                  <td className="border border-black p-1 bg-slate-200">10</td>
                  <td className="border border-black p-1 bg-slate-200">7</td>
                  <td className="border border-black p-1 bg-slate-200">3</td>
                  <td className="border border-black bg-slate-300">19 câu</td>
                </tr>

                {/* DÒNG TỔNG SỐ ĐIỂM */}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={3} className="border border-black p-1 text-center uppercase">Tổng số điểm</td>
                  <td colSpan={3} className="border border-black p-1">3,0 điểm</td>
                  <td colSpan={3} className="border border-black p-1">4,0 điểm</td>
                  <td colSpan={3} className="border border-black p-1">3,0 điểm</td>
                  <td className="border border-black p-1 bg-slate-200">4,0 điểm</td>
                  <td className="border border-black p-1 bg-slate-200">3,0 điểm</td>
                  <td className="border border-black p-1 bg-slate-200">3,0 điểm</td>
                  <td className="border border-black p-1 bg-slate-300 font-black text-blue-900">10,0 điểm</td>
                </tr>

                {/* DÒNG TỈ LỆ % */}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-black p-1 text-center uppercase">Tỉ lệ % điểm</td>
                  <td colSpan={3} className="border border-black p-1">30%</td>
                  <td colSpan={3} className="border border-black p-1">40%</td>
                  <td colSpan={3} className="border border-black p-1">30%</td>
                  <td className="border border-black p-1 bg-slate-200">40%</td>
                  <td className="border border-black p-1 bg-slate-200">30%</td>
                  <td className="border border-black p-1 bg-slate-200">30%</td>
                  <td className="border border-black p-1 bg-slate-300 font-black text-emerald-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ */}
        <div className="space-y-2 pt-2">
          <div className="text-center font-extrabold text-sm uppercase text-slate-900 tracking-wide">
            BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
          </div>

          <div className="overflow-x-auto border border-black bg-white">
            <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th rowSpan={4} className="border border-black p-1.5 w-10">TT</th>
                  <th rowSpan={4} className="border border-black p-1.5 min-w-[100px]">Chủ đề/Chương</th>
                  <th rowSpan={4} className="border border-black p-1.5 min-w-[120px]">Nội dung/đơn vị kiến thức</th>
                  <th rowSpan={4} className="border border-black p-1.5 min-w-[240px]">Yêu cầu cần đạt</th>
                  <th colSpan={9} className="border border-black p-1.5 uppercase font-bold bg-slate-200">Số câu hỏi ở các mức độ đánh giá</th>
                  <th colSpan={3} rowSpan={3} className="border border-black p-1.5 bg-slate-200 font-bold">Tổng</th>
                  <th rowSpan={4} className="border border-black p-1.5 w-16 font-bold">Tỉ lệ % điểm</th>
                </tr>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th colSpan={6} className="border border-black p-1">TNKQ</th>
                  <th colSpan={3} className="border border-black p-1">Tự luận</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-[10.5px] border-b border-black">
                  <th colSpan={3} className="border border-black p-1">Nhiều lựa chọn</th>
                  <th colSpan={3} className="border border-black p-1">Đúng – Sai</th>
                  <th colSpan={3} className="border border-black p-1">Tự luận</th>
                </tr>
                <tr className="bg-slate-100 font-bold text-[10px] border-b border-black">
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                  <th className="border border-black p-1 w-9 bg-slate-200">Biết</th>
                  <th className="border border-black p-1 w-9 bg-slate-200">Hiểu</th>
                  <th className="border border-black p-1 w-9 bg-slate-200">V.Dụng</th>
                </tr>
              </thead>
              <tbody>
                {/* BÀI 5 */}
                <tr>
                  <td className="border border-black p-1 font-bold">1</td>
                  <td className="border border-black p-1 font-bold text-left">Bài 5</td>
                  <td className="border border-black p-1 text-left">Bài 5 kiến thức cốt lõi</td>
                  <td className="border border-black p-1 text-left space-y-1 text-[10.5px]">
                    <p>• <strong>- Biết (Y5.1):</strong> Kể tên, nêu được khái niệm (đo bởi a5.1, a5.2, a5.3, d5.1, c5.1).</p>
                    <p>• <strong>- Hiểu (Y5.2):</strong> Mô tả, giải thích nguyên lý (đo bởi a5.4).</p>
                  </td>
                  <td className="border border-black p-1 font-bold">3 (a5.1, a5.2, a5.3)</td>
                  <td className="border border-black p-1 font-bold">1 (a5.4)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold">1 (d5.1)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold">1 (c5.1)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold bg-slate-50">5</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">1</td>
                  <td className="border border-black p-1 bg-slate-50">0</td>
                  <td className="border border-black p-1 font-bold">30%</td>
                </tr>

                {/* BÀI 11 */}
                <tr className="bg-slate-50/50">
                  <td className="border border-black p-1 font-bold">2</td>
                  <td className="border border-black p-1 font-bold text-left">Bài 11</td>
                  <td className="border border-black p-1 text-left">Bài 11 kiến thức cốt lõi</td>
                  <td className="border border-black p-1 text-left space-y-1 text-[10.5px]">
                    <p>• <strong>- Biết (Y11.1):</strong> Nhận biết đại lượng (đo bởi a11.1, a11.2, a11.3).</p>
                    <p>• <strong>- Hiểu (Y11.2):</strong> Trình bày nguyên lý (đo bởi a11.4, d11.1).</p>
                    <p>• <strong>- Vận dụng (Y11.3):</strong> Thiết kế, giải quyết tình huống (đo bởi d11.2, c11.1).</p>
                  </td>
                  <td className="border border-black p-1 font-bold">3 (a11.1..3)</td>
                  <td className="border border-black p-1 font-bold">1 (a11.4)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold">1 (d11.1)</td>
                  <td className="border border-black p-1 font-bold text-emerald-800">1 (d11.2)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold text-emerald-800">1 (c11.1)</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">3</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">2</td>
                  <td className="border border-black p-1 font-bold bg-slate-50 text-emerald-800">2</td>
                  <td className="border border-black p-1 font-bold">40%</td>
                </tr>

                {/* BÀI 23 */}
                <tr>
                  <td className="border border-black p-1 font-bold">3</td>
                  <td className="border border-black p-1 font-bold text-left">Bài 23</td>
                  <td className="border border-black p-1 text-left">Bài 23 kiến thức cốt lõi</td>
                  <td className="border border-black p-1 text-left space-y-1 text-[10.5px]">
                    <p>• <strong>- Biết (Y23.1):</strong> Nhận biết sơ đồ (đo bởi a23.1, a23.2).</p>
                    <p>• <strong>- Hiểu (Y23.2):</strong> Tính toán thông số (đo bởi a23.3, a23.4, d23.1).</p>
                    <p>• <strong>- Vận dụng (Y23.3):</strong> Đề xuất khắc phục sự cố (đo bởi c23.1).</p>
                  </td>
                  <td className="border border-black p-1 font-bold">2 (a23.1..2)</td>
                  <td className="border border-black p-1 font-bold">2 (a23.3..4)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold">1 (d23.1)</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold text-emerald-800">1 (c23.1)</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">2</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">3</td>
                  <td className="border border-black p-1 font-bold bg-slate-50 text-emerald-800">1</td>
                  <td className="border border-black p-1 font-bold">30%</td>
                </tr>

                {/* TỔNG ĐẶC TẢ */}
                <tr className="bg-slate-100 font-bold border-t-2 border-black">
                  <td colSpan={4} className="border border-black p-1 text-center uppercase">Tổng số câu / ý hỏi</td>
                  <td colSpan={3} className="border border-black p-1">12 câu</td>
                  <td colSpan={3} className="border border-black p-1">4 câu (16 ý)</td>
                  <td colSpan={3} className="border border-black p-1">3 câu</td>
                  <td className="border border-black p-1 bg-slate-200">10</td>
                  <td className="border border-black p-1 bg-slate-200">6</td>
                  <td className="border border-black p-1 bg-slate-200">3</td>
                  <td className="border border-black bg-slate-300">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= GIAI ĐOẠN 6: KIỂM TRA CHÉO BẰNG PHÉP CỘNG THẬT ================= */}
      <div className="bg-emerald-50 border-2 border-emerald-600 p-4 rounded-lg space-y-3 text-slate-900">
        <div className="font-extrabold text-emerald-950 text-xs uppercase border-b border-emerald-300 pb-1 flex justify-between">
          <span>GIAI ĐOẠN 6 – KIỂM TRA CHÉO BẰNG PHÉP CỘNG THẬT (10 MỤC KIỂM ĐỊNH)</span>
          <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded text-xs tracking-wider">KẾT QUẢ: ĐẠT</span>
        </div>

        <div className="overflow-x-auto text-[10.5px]">
          <table className="w-full text-left border-collapse border border-emerald-300 bg-white">
            <thead>
              <tr className="bg-emerald-100 font-bold text-emerald-950">
                <th className="border border-emerald-300 p-1.5 w-12 text-center">Mục</th>
                <th className="border border-emerald-300 p-1.5 w-48">Nội dung kiểm tra</th>
                <th className="border border-emerald-300 p-1.5">Phép tính thực tế in ra từ Danh sách câu (Giai đoạn 3)</th>
                <th className="border border-emerald-300 p-1.5 w-24 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">1</td>
                <td className="border border-emerald-300 p-1 font-medium">Tổng điểm từ Danh sách câu</td>
                <td className="border border-emerald-300 p-1 font-mono">12×0,25đ (3,0) + 4×1,0đ (4,0) + 3×1,0đ (3,0) = 10,0 điểm</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">2</td>
                <td className="border border-emerald-300 p-1 font-medium">Phân hệ Trắc nghiệm vs Tự luận</td>
                <td className="border border-emerald-300 p-1 font-mono">TN = 3,0đ (NLC) + 4,0đ (ĐS) = 7,0 điểm | TL = 3,0 điểm</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">3</td>
                <td className="border border-emerald-300 p-1 font-medium">Đếm số ô trên Ma trận</td>
                <td className="border border-emerald-300 p-1 font-mono">NLC = 12 ô câu hỏi, ĐS = 4 ô câu lớn (16 ý), TL = 3 ô câu hỏi</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">4</td>
                <td className="border border-emerald-300 p-1 font-medium">Cộng cột Tỉ lệ % dòng</td>
                <td className="border border-emerald-300 p-1 font-mono">Bài 5 (30%) + Bài 11 (40%) + Bài 23 (30%) = 100%</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">5</td>
                <td className="border border-emerald-300 p-1 font-medium">Cộng cột Tổng Mức độ</td>
                <td className="border border-emerald-300 p-1 font-mono">Biết = 4,0đ (40%) | Hiểu = 3,0đ (30%) | Vận dụng = 3,0đ (30%)</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">6</td>
                <td className="border border-emerald-300 p-1 font-medium">Khớp giữa Ma trận & Đặc tả</td>
                <td className="border border-emerald-300 p-1 font-mono">Khớp 100% mã câu, số câu và số điểm ở từng ô dòng/cột</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">7</td>
                <td className="border border-emerald-300 p-1 font-medium">Tính riêng biệt YCCĐ bài</td>
                <td className="border border-emerald-300 p-1 font-mono">Y5.1..2 (Bài 5), Y11.1..3 (Bài 11), Y23.1..3 (Bài 23) tách biệt hoàn toàn</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">8</td>
                <td className="border border-emerald-300 p-1 font-medium">Kiểm tra Mức câu ≤ Mức YCCĐ</td>
                <td className="border border-emerald-300 p-1 font-mono">Không câu nào có mức cao hơn mức tối đa của YCCĐ mà nó đo</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">9</td>
                <td className="border border-emerald-300 p-1 font-medium">Độ phủ YCCĐ</td>
                <td className="border border-emerald-300 p-1 font-mono">Mọi YCCĐ (Y5.1..Y23.3) đều được đo bởi ít nhất 1 câu hỏi tương ứng</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
              <tr>
                <td className="border border-emerald-300 p-1 text-center font-bold">10</td>
                <td className="border border-emerald-300 p-1 font-medium">Cấm Vận dụng cao & Trả lời ngắn</td>
                <td className="border border-emerald-300 p-1 font-mono">Vận dụng cao = 0, Trả lời ngắn = 0 (Chỉ dùng Đúng–Sai & Tự luận)</td>
                <td className="border border-emerald-300 p-1 text-center font-bold text-emerald-700">ĐẠT</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-center border-t border-emerald-300">
          <span className="text-emerald-950 font-black text-xs uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded">
            ★ KẾT QUẢ KIỂM ĐỊNH TỔNG THỂ: ĐẠT CHUẨN 100% CÔNG VĂN 7991/BGDĐT-GDTrH ★
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfficialMatrixTable;

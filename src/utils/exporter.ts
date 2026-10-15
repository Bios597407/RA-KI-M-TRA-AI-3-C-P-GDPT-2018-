import { QuestionItem, ExamConfig, ExamMatrix, ExamSpecificationRow, ShuffledExamCode } from '../types/exam';

/**
 * Generates an official Microsoft Word (.doc) document file from exam content
 */
export function exportToWordDoc(
  config: ExamConfig,
  currentCode: ShuffledExamCode,
  matrix: ExamMatrix,
  specs: ExamSpecificationRow[]
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || 'TRƯỜNG THPT / THCS CHUYÊN';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.3;
      color: #000;
      margin: 20mm;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 5pt 7pt;
      font-size: 11pt;
    }
    .header-table, .header-table th, .header-table td {
      border: none !important;
      padding: 3pt 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .page-break { page-break-before: always; }
    .question-block { margin-bottom: 10pt; }
    .option-table, .option-table td {
      border: none !important;
      padding: 2pt 5pt;
    }
    .rubric-table th { background-color: #f0f0f0; }
  </style>
</head>
<body>

  <!-- PHẦN HEADER ĐỀ THI CHUẨN BỘ GIÁO DỤC -->
  <table class="header-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">${school}</span><br>
        <span>TỔ CHUYÊN MÔN</span><br>
        <span class="bold">Mã đề thi: ${currentCode.code}</span>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
        <span class="bold">Độc lập – Tự do – Hạnh phúc</span><br>
        <span>-----------------------</span>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin-top: 10pt; margin-bottom: 15pt;">
    <div class="bold uppercase" style="font-size: 14pt;">${title}</div>
    <div class="bold">MÔN: ${subject.toUpperCase()} – ${gradeStr.toUpperCase()}</div>
    <div class="italic">Chương trình GDPT 2018 – Bộ sách: ${config.textbook}</div>
    <div class="italic">Thời gian làm bài: ${config.durationMinutes} phút (Không kể thời gian phát đề)</div>
  </div>

  <table style="width: 100%; margin-bottom: 15pt;">
    <tr>
      <td style="width: 60%; height: 28pt; vertical-align: middle;">
        Họ và tên thí sinh: ..................................................................... Lớp: .................
      </td>
      <td style="width: 40%; height: 28pt; vertical-align: middle;">
        Số báo danh: ...............................................
      </td>
    </tr>
  </table>

  <!-- NỘI DUNG CÂU HỎI -->
  ${renderExamQuestionsToWord(currentCode.questions)}

  <div class="text-center bold italic" style="margin-top: 20pt; margin-bottom: 20pt;">
    --- HẾT ---<br>
    <span style="font-size: 10pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>

  <!-- TRANG MỚI: ĐÁP ÁN & HƯỚNG DẪN CHẤM -->
  <div class="page-break"></div>

  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM – MÃ ĐỀ ${currentCode.code}
  </div>
  <div class="text-center italic" style="margin-bottom: 15pt;">
    Môn: ${subject} – ${gradeStr} (Thang điểm: ${config.totalScore || 10})
  </div>

  <!-- BẢNG ĐÁP ÁN NHANH -->
  <div class="bold" style="margin-bottom: 5pt;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</div>
  <table>
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        <th style="width: 15%; text-align: center;">Phần</th>
        <th style="text-align: left;">Đáp án</th>
      </tr>
    </thead>
    <tbody>
      ${currentCode.quickAnswers
        .map(
          (qa) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${qa.stt}</td>
          <td style="text-align: center;">${qa.part === 'part1' ? 'Phần I' : qa.part === 'part2' ? 'Phần II' : qa.part === 'part3' ? 'Phần III' : 'Phần IV'}</td>
          <td>${qa.answer}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- HƯỚNG DẪN CHẤM CHI TIẾT -->
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">II. HƯỚNG DẪN CHẤM VÀ LỜI GIẢI CHI TIẾT</div>
  ${renderDetailedSolutionsToWord(currentCode.questions)}

  <!-- TRANG MỚI: MA TRẬN & BẢN ĐẶC TẢ -->
  <div class="page-break"></div>

  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    MA TRẬN ĐỀ KIỂM TRA
  </div>
  <table>
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th rowspan="2" style="width: 5%;">TT</th>
        <th rowspan="2" style="width: 25%;">Chủ đề / Đơn vị kiến thức</th>
        ${matrix.levels.map((lvl) => `<th colspan="2" style="text-align: center;">${lvl}</th>`).join('')}
        <th colspan="2" style="text-align: center;">Tổng cộng</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        ${matrix.levels.map(() => `<th style="text-align: center;">Số câu</th><th style="text-align: center;">Điểm</th>`).join('')}
        <th style="text-align: center;">Số câu</th>
        <th style="text-align: center;">Tỉ lệ %</th>
      </tr>
    </thead>
    <tbody>
      ${matrix.rows
        .map(
          (row, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${row.topic}</td>
          ${matrix.levels
            .map((lvl) => {
              const count = (row.part1[lvl] || 0) + (row.part2[lvl] || 0) + (row.part3[lvl] || 0) + (row.part4[lvl] || 0);
              return `<td style="text-align: center;">${count > 0 ? count : '-'}</td><td style="text-align: center;">-</td>`;
            })
            .join('')}
          <td style="text-align: center; font-weight: bold;">${row.totalQuestions}</td>
          <td style="text-align: center; font-weight: bold;">${row.percent}%</td>
        </tr>
      `
        )
        .join('')}
      <tr style="background-color: #e6f0fa; font-weight: bold;">
        <td colspan="2" style="text-align: center;">TỔNG TOÀN ĐỀ</td>
        ${matrix.levels
          .map((lvl) => {
            const data = matrix.totalByLevel[lvl] || { count: 0, score: 0 };
            return `<td style="text-align: center;">${data.count}</td><td style="text-align: center;">${data.score}đ</td>`;
          })
          .join('')}
        <td style="text-align: center;">${matrix.grandTotal.count}</td>
        <td style="text-align: center;">100% (${matrix.grandTotal.score}đ)</td>
      </tr>
    </tbody>
  </table>

  <!-- BẢN ĐẶC TẢ -->
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-top: 20pt; margin-bottom: 8pt;">
    BẢN ĐẶC TẢ ĐỀ KIỂM TRA
  </div>
  <table>
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 5%;">TT</th>
        <th style="width: 20%;">Chủ đề</th>
        <th style="width: 40%;">Mức độ đánh giá / Yêu cầu cần đạt</th>
        <th style="width: 15%;">Dạng câu hỏi</th>
        <th style="width: 10%;">Mức độ</th>
        <th style="width: 10%;">Điểm</th>
      </tr>
    </thead>
    <tbody>
      ${specs
        .map(
          (spec) => `
        <tr>
          <td style="text-align: center;">${spec.stt}</td>
          <td>${spec.topic}</td>
          <td>${spec.competency}</td>
          <td>${spec.questionType}</td>
          <td style="text-align: center;">${spec.level}</td>
          <td style="text-align: center; font-weight: bold;">${spec.score}đ</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

</body>
</html>
  `;

  // Create and download Blob
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `De_Kiem_Tra_${subject}_Lop${config.grade}_Ma${currentCode.code}.doc`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function renderExamQuestionsToWord(questions: QuestionItem[]): string {
  let html = '';
  let currentPart = '';
  let qNumber = 1;

  questions.forEach((q) => {
    // Check if new section starts
    if (q.part !== currentPart) {
      currentPart = q.part;
      let partHeader = '';
      if (q.part === 'part1') {
        partHeader = 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh chọn 1 đáp án đúng nhất)';
      } else if (q.part === 'part2') {
        partHeader = 'PHẦN II. Câu trắc nghiệm Đúng/Sai (Mỗi câu gồm 4 ý a, b, c, d; thí sinh chọn Đúng hoặc Sai)';
      } else if (q.part === 'part3') {
        partHeader = 'PHẦN III. Câu trắc nghiệm trả lời ngắn (Thí sinh điền kết quả vào phiếu trả lời)';
      } else {
        partHeader = 'PHẦN IV. Câu hỏi Tự luận';
      }

      html += `<div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 8pt; text-decoration: underline;">${partHeader}</div>`;
    }

    // Passage if clustered
    if (q.passage) {
      html += `
        <div style="background-color: #f9f9f9; padding: 6pt; border-left: 3px solid #333; margin-bottom: 8pt; font-style: italic;">
          <strong>Đọc đoạn trích/ngữ liệu sau để trả lời câu hỏi:</strong><br>
          ${q.passage.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    // Question content
    html += `<div class="question-block">`;
    html += `<div><strong>Câu ${qNumber++} (${q.score || 0} điểm):</strong> ${q.question}</div>`;

    // Part I: Options
    if ((q.type === 'mcq_single' || q.part === 'part1') && q.options && q.options.length === 4) {
      html += `
        <table class="option-table" style="width: 100%; margin-top: 4pt;">
          <tr>
            <td style="width: 50%;"><strong>A.</strong> ${q.options[0]}</td>
            <td style="width: 50%;"><strong>B.</strong> ${q.options[1]}</td>
          </tr>
          <tr>
            <td style="width: 50%;"><strong>C.</strong> ${q.options[2]}</td>
            <td style="width: 50%;"><strong>D.</strong> ${q.options[3]}</td>
          </tr>
        </table>
      `;
    }

    // Part II: 4 Sub-statements
    if ((q.type === 'true_false_group' || q.part === 'part2') && q.subItems) {
      html += `<div style="margin-left: 15pt; margin-top: 4pt;">`;
      q.subItems.forEach((sub) => {
        html += `<div><strong>${sub.label})</strong> ${sub.statement}</div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  return html;
}

function renderDetailedSolutionsToWord(questions: QuestionItem[]): string {
  let html = '';
  questions.forEach((q, idx) => {
    html += `
      <div style="margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 1px dashed #ccc;">
        <div><strong>Câu ${idx + 1} (${q.score || 0} điểm) [${q.level}]:</strong> ${q.question}</div>
        <div style="color: #006600; font-weight: bold; margin-top: 3pt;">
          Đáp án đúng: ${typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}
        </div>
        ${q.subItems ? `
          <ul style="margin: 3pt 0 3pt 15pt;">
            ${q.subItems.map((s) => `<li>Ý ${s.label}: <strong>${s.isCorrect ? 'ĐÚNG' : 'SAI'}</strong> ${s.explanation ? `(${s.explanation})` : ''}</li>`).join('')}
          </ul>
        ` : ''}
        <div style="margin-top: 3pt;"><strong>Hướng dẫn giải chi tiết:</strong> ${q.explanation || 'Áp dụng định lý và tính toán theo chuẩn kiến thức.'}</div>
        ${q.rubric && q.rubric.length > 0 ? `
          <div style="margin-top: 4pt;">
            <strong>Biểu điểm thành phần:</strong>
            <table style="width: 100%; margin-top: 3pt;">
              <tr style="background-color: #f2f2f2;"><th>Bước</th><th>Nội dung yêu cầu</th><th>Điểm</th></tr>
              ${q.rubric.map((r) => `<tr><td style="text-align: center;">${r.step}</td><td>${r.detail}</td><td style="text-align: center; font-weight: bold;">${r.point}đ</td></tr>`).join('')}
            </table>
          </div>
        ` : ''}
      </div>
    `;
  });
  return html;
}

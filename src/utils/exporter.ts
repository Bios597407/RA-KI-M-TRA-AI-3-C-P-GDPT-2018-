import {
  QuestionItem,
  ExamConfig,
  ExamMatrix,
  ExamSpecificationRow,
  ShuffledExamCode,
  StudyGuideData,
} from '../types/exam';

const WORD_HEADER_STYLE = `
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    body {
      font-family: 'Times New Roman', 'DejaVu Serif', serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000;
      margin: 0;
      padding: 0;
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
      padding: 5pt 6pt;
      font-size: 11pt;
    }
    .header-table, .header-table th, .header-table td {
      border: none !important;
      padding: 3pt 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .page-break { page-break-before: always; break-before: page; }
    .question-block { margin-bottom: 10pt; }
    .option-table, .option-table td {
      border: none !important;
      padding: 2pt 5pt;
    }
  </style>
`;

/**
 * Format LaTeX math formulas to readable Unicode text in Word documents
 */
export function formatLatexToWordUnicode(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\$(.*?)\$\$/gs, (_, math) => ` ${cleanMathString(math)} `)
    .replace(/\$(.*?)\$/g, (_, math) => ` ${cleanMathString(math)} `)
    .replace(/\n/g, '<br>');
}

function cleanMathString(math: string): string {
  return math
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[(.*?)\]\{([^}]+)\}/g, '$1√($2)')
    .replace(/\\lim_\{([^}]+)\}/g, 'lim ($1)')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\le|\\leq/g, '≤')
    .replace(/\\ge|\\geq/g, '≥')
    .replace(/\\ne|\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')
    .replace(/\\infty/g, '∞')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\supset/g, '⊃')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, '∑')
    .replace(/\\left\(|\\right\)/g, '')
    .replace(/\\left\[|\\right\]/g, '')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\circ/g, '°')
    .replace(/_([0-9a-zA-Z])/g, '_$1')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^([0-9])/g, '^$1')
    .replace(/\\/g, '');
}

/**
 * 1. Xuất ĐỀ THI RIÊNG BIỆT (.doc)
 */
export function exportExamOnlyWordDoc(config: ExamConfig, currentCode: ShuffledExamCode): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title} - ĐỀ THI</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  ${renderExamHeader(school, currentCode.code, title, subject, gradeStr, config)}
  ${renderExamQuestionsToWord(currentCode.questions)}
  <div class="text-center bold italic" style="margin-top: 25pt; margin-bottom: 15pt;">
    --- HẾT ---<br>
    <span style="font-size: 10pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `De_Thi_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

/**
 * 2. Xuất ĐÁP ÁN & HƯỚNG DẪN CHẤM RIÊNG BIỆT (.doc)
 */
export function exportAnswerKeyOnlyWordDoc(config: ExamConfig, currentCode: ShuffledExamCode): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title} - ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <div class="text-center bold uppercase" style="font-size: 14pt; margin-bottom: 4pt;">
    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT
  </div>
  <div class="text-center bold uppercase" style="font-size: 12pt; margin-bottom: 2pt;">
    ${title} – MÃ ĐỀ: ${currentCode.code}
  </div>
  <div class="text-center italic" style="margin-bottom: 15pt;">
    ${school} | Môn: ${subject} – ${gradeStr} (Thang điểm: ${config.totalScore || 10})
  </div>

  <div class="bold" style="margin-bottom: 5pt; font-size: 12pt;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</div>
  ${renderQuickAnswerTable(currentCode)}

  <div class="bold" style="margin-top: 18pt; margin-bottom: 5pt; font-size: 12pt;">II. LỜI GIẢI VÀ BIỂU ĐIỂM CHI TIẾT</div>
  ${renderDetailedSolutionsToWord(currentCode.questions)}
</body>
</html>
  `;

  downloadBlob(htmlContent, `Dap_An_HDCham_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

/**
 * 3. Xuất TRỌN BỘ HỒ SƠ ĐỀ KIỂM TRA (.doc)
 */
export function exportToWordDoc(
  config: ExamConfig,
  currentCode: ShuffledExamCode,
  matrix: ExamMatrix,
  specs: ExamSpecificationRow[],
  studyGuide?: StudyGuideData
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- MỤC 1: ĐỀ THI -->
  ${renderExamHeader(school, currentCode.code, title, subject, gradeStr, config)}
  ${renderExamQuestionsToWord(currentCode.questions)}
  <div class="text-center bold italic" style="margin-top: 20pt; margin-bottom: 20pt;">
    --- HẾT ---<br>
    <span style="font-size: 10pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>

  <!-- MỤC 2: ĐÁP ÁN & HƯỚNG DẪN CHẤM -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 4pt;">
    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM – MÃ ĐỀ ${currentCode.code}
  </div>
  <div class="text-center italic" style="margin-bottom: 12pt;">
    Môn: ${subject} – ${gradeStr} (Thang điểm: ${config.totalScore || 10})
  </div>
  <div class="bold" style="margin-bottom: 5pt;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</div>
  ${renderQuickAnswerTable(currentCode)}
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">II. HƯỚNG DẪN CHẤM CHI TIẾT</div>
  ${renderDetailedSolutionsToWord(currentCode.questions)}

  <!-- MỤC 3: MA TRẬN & BẢN ĐẶC TẢ -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    MA TRẬN ĐỀ KIỂM TRA
  </div>
  ${renderMatrixTable(matrix)}

  <div class="text-center bold uppercase" style="font-size: 13pt; margin-top: 20pt; margin-bottom: 8pt;">
    BẢN ĐẶC TẢ ĐỀ KIỂM TRA
  </div>
  ${renderSpecTable(specs)}

  ${studyGuide ? `
  <!-- MỤC 4: ĐỀ CƯƠNG ÔN TẬP BỔ TRỢ -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    ĐỀ CƯƠNG ÔN TẬP VÀ CẨM NANG TRỌNG TÂM
  </div>
  ${renderStudyGuideContent(studyGuide)}
  ` : ''}
</body>
</html>
  `;

  downloadBlob(htmlContent, `Tron_Bo_Ho_So_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

/**
 * 4. Xuất MA TRẬN & BẢN ĐẶC TẢ RIÊNG BIỆT (.doc)
 */
export function exportMatrixAndSpecsOnlyWordDoc(
  config: ExamConfig,
  matrix: ExamMatrix,
  specs: ExamSpecificationRow[]
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>MA TRẬN VÀ BẢN ĐẶC TẢ - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">${school}</span><br>
        <span class="bold">TỔ CHUYÊN MÔN</span><br>
        <span>----------------</span>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
        <span class="bold">Độc lập – Tự do – Hạnh phúc</span><br>
        <span>-----------------------</span>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin-top: 10pt; margin-bottom: 15pt;">
    <div class="bold uppercase" style="font-size: 13pt;">MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ</div>
    <div class="bold uppercase">${title}</div>
    <div class="bold">MÔN: ${subject.toUpperCase()} – ${gradeStr.toUpperCase()}</div>
    <div class="italic">Chương trình GDPT 2018 – Bộ sách: ${config.textbook}</div>
    <div class="italic">Thời gian làm bài: ${config.durationMinutes} phút | Thang điểm: ${config.totalScore || 10} điểm</div>
  </div>

  <div class="bold uppercase" style="font-size: 12pt; margin-bottom: 6pt; color: #003366;">
    A. KHUNG MA TRẬN ĐỀ KIỂM TRA
  </div>
  ${renderMatrixTable(matrix)}

  <div class="page-break"></div>
  <div class="bold uppercase" style="font-size: 12pt; margin-top: 10pt; margin-bottom: 6pt; color: #003366;">
    B. BẢN ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA
  </div>
  ${renderSpecTable(specs)}

  <div style="margin-top: 30pt;">
    <table class="header-table" style="width: 100%;">
      <tr>
        <td style="width: 33%; text-align: center; vertical-align: top;">
          <span class="bold">NGƯỜI LẬP MA TRẬN</span><br>
          <span class="italic">(Ký và ghi rõ họ tên)</span>
        </td>
        <td style="width: 33%; text-align: center; vertical-align: top;">
          <span class="bold">TỔ TRƯỞNG CHUYÊN MÔN</span><br>
          <span class="italic">(Ký và ghi rõ họ tên)</span>
        </td>
        <td style="width: 34%; text-align: center; vertical-align: top;">
          <span class="bold">DUYỆT CỦA BAN GIÁM HIỆU</span><br>
          <span class="italic">(Ký tên và đóng dấu)</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Ma_Tran_Ban_Dac_Ta_${subject.replace(/\s+/g, '_')}_Lop${config.grade}.doc`);
}

/**
 * 5. Xuất ĐỀ CƯƠNG ÔN TẬP RIÊNG BIỆT (.doc)
 */
export function exportStudyGuideWordDoc(config: ExamConfig, studyGuide: StudyGuideData): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>ĐỀ CƯƠNG ÔN TẬP - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">${school}</span><br>
        <span class="bold">TỔ CHUYÊN MÔN</span><br>
        <span>----------------</span>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
        <span class="bold">Độc lập – Tự do – Hạnh phúc</span><br>
        <span>-----------------------</span>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin-top: 10pt; margin-bottom: 15pt;">
    <div class="bold uppercase" style="font-size: 14pt;">ĐỀ CƯƠNG ÔN TẬP & CẨM NANG KIẾN THỨC CỐT LÕI</div>
    <div class="bold uppercase">${title}</div>
    <div class="bold">MÔN: ${subject.toUpperCase()} – ${gradeStr.toUpperCase()}</div>
    <div class="italic">Chương trình GDPT 2018 – Bộ sách: ${config.textbook}</div>
    <div class="italic">Tài liệu ôn thi phát cho học sinh học kỳ</div>
  </div>

  ${renderStudyGuideContent(studyGuide)}
</body>
</html>
  `;

  downloadBlob(htmlContent, `De_Cuong_On_Tap_${subject.replace(/\s+/g, '_')}_Lop${config.grade}.doc`);
}

/**
 * Robust Printing Engine that handles iframe sandboxes cleanly
 */
export function printDocument(htmlContent: string, documentTitle: string = 'In_Tai_Lieu'): void {
  // Try 1: Hidden iframe inside the current document
  try {
    const existingIframe = document.getElementById('ai-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'ai-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print blocked by browser sandbox, triggering fallback:', e);
          fallbackPrint(htmlContent, documentTitle);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe print failed, falling back:', err);
  }

  fallbackPrint(htmlContent, documentTitle);
}

function fallbackPrint(htmlContent: string, documentTitle: string) {
  // Try opening in a new tab with auto-print
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      return;
    }
  } catch (_) {}

  // If window.open is blocked, trigger download as HTML file
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ban_In_${documentTitle.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Universal HTML generator for print views
 */
export function wrapHtmlForPrint(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 15mm;
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
      padding: 5pt 6pt;
      font-size: 10.5pt;
    }
    .header-table, .header-table th, .header-table td {
      border: none !important;
      padding: 2pt 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .page-break { page-break-before: always; break-before: page; }
    .question-block { margin-bottom: 9pt; }
    .option-table, .option-table td {
      border: none !important;
      padding: 2pt 4pt;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #2563eb;
      color: white;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      margin: -15mm -15mm 15mm -15mm;
      z-index: 1000;
    }
    .no-print-bar button {
      background: white;
      color: #1e40af;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      margin-left: 8px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>Bản in A4: ${title}</strong> (Nhấn "In trang" hoặc dùng phím Ctrl + P)</div>
    <div>
      <button onclick="window.print()">🖨️ In trang</button>
      <button onclick="window.close()">Đóng</button>
    </div>
  </div>
  ${bodyHtml}
  <script>
    window.addEventListener('load', function() {
      // Auto trigger print after render
      setTimeout(function() {
        try { window.print(); } catch(e){}
      }, 500);
    });
  </script>
</body>
</html>
  `;
}

function downloadBlob(content: string, filename: string): void {
  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function renderExamHeader(school: string, code: string, title: string, subject: string, gradeStr: string, config: ExamConfig): string {
  const department = (config.departmentName || 'SỞ GIÁO DỤC & ĐÀO TẠO TPHCM').toUpperCase();
  const schoolName = (config.schoolName || 'TRƯỜNG THPT VÕ TRƯỜNG TOẢN').toUpperCase();
  const officialType = config.officialExamType || 'Đề chính thức';
  const pageCount = config.pageCountText || '2';
  const durationNote = config.durationNote || '(không kể thời gian phát đề)';
  const rawSubject = config.customSubject || config.subject || 'CÔNG NGHỆ ĐIỆN – ĐIỆN TỬ';
  const gradeSuffix = config.grade ? ` ${config.grade}` : '';
  const subjectDisplay = rawSubject.toUpperCase();
  const academicYear = config.academicYear || '2025 - 2026';
  const examTitle = (config.examTitle || 'ĐỀ KIỂM TRA CUỐI HỌC KÌ 1').toUpperCase();

  return `
  <table class="header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 6pt; font-family: 'Times New Roman', serif;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 11pt; line-height: 1.25;">${department}</div>
        <div class="bold uppercase" style="font-size: 11pt; line-height: 1.25;">${schoolName}</div>
        <div class="italic bold" style="font-size: 11pt; margin-top: 3pt;">${officialType}</div>
        <div class="italic" style="font-size: 10.5pt; margin-top: 2pt;">(Đề có _${pageCount}_ trang)</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 11.5pt; line-height: 1.25;">${examTitle} NĂM HỌC ${academicYear}</div>
        <div class="bold uppercase" style="font-size: 11.5pt; line-height: 1.25; margin-top: 3pt;">MÔN: ${subjectDisplay}${gradeSuffix}</div>
        <div class="italic" style="font-size: 11pt; margin-top: 3pt;">Thời gian làm bài: ${config.durationMinutes || 45} PHÚT</div>
        <div class="italic" style="font-size: 10.5pt;">${durationNote}</div>
      </td>
    </tr>
  </table>

  <div style="border-bottom: 1.5pt solid #000; padding-bottom: 4pt; margin-top: 8pt; margin-bottom: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
    <table class="header-table" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="text-align: left; vertical-align: bottom;">
          <strong>Họ và tên:</strong> ................................................................ <strong>LỚP:</strong> ........... <strong>MS:</strong> .................... <strong>Số báo danh:</strong> ..............
        </td>
        <td style="text-align: right; vertical-align: bottom; font-weight: bold; font-size: 12pt; white-space: nowrap; padding-left: 10pt;">
          Mã đề ${code}
        </td>
      </tr>
    </table>
  </div>
  `;
}

function renderQuickAnswerTable(currentCode: ShuffledExamCode): string {
  return `
  <table>
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        <th style="width: 20%; text-align: center;">Phần thi</th>
        <th style="text-align: left;">Đáp án chuẩn</th>
      </tr>
    </thead>
    <tbody>
      ${currentCode.quickAnswers
        .map(
          (qa) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${qa.stt}</td>
          <td style="text-align: center;">${qa.part === 'part1' ? 'Phần I' : qa.part === 'part2' ? 'Phần II' : qa.part === 'part3' ? 'Phần III' : 'Phần IV'}</td>
          <td style="font-weight: bold; color: #006600;">${qa.answer}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `;
}

function renderMatrixTable(matrix: ExamMatrix): string {
  return `
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
              return `<td style="text-align: center;">${count > 0 ? count : '-'}</td><td style="text-align: center;">${count > 0 ? (count * 0.25).toFixed(2) : '-'}</td>`;
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
  `;
}

function renderSpecTable(specs: ExamSpecificationRow[]): string {
  return `
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
  `;
}

function renderStudyGuideContent(studyGuide: StudyGuideData): string {
  return `
    <div class="bold" style="font-size: 12pt; margin-top: 10pt; margin-bottom: 6pt; color: #003366;">
      1. Bảng Khái Niệm & Từ Khóa Cốt Lõi
    </div>
    <table>
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="width: 30%;">Thuật ngữ / Khái niệm</th>
          <th>Định nghĩa & Bản chất</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.coreConcepts
          .map(
            (c) => `
          <tr>
            <td style="font-weight: bold; color: #003366;">${c.term}</td>
            <td>${formatLatexToWordUnicode(c.definition)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    ${studyGuide.keyFormulas && studyGuide.keyFormulas.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #003366;">
      2. Bảng Công Thức Vàng & Quy Tắc Giải Nhanh
    </div>
    <table>
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="width: 25%;">Tên công thức / Quy tắc</th>
          <th style="width: 35%;">Biểu thức / Phương trình</th>
          <th>Ghi chú & Mẹo vận dụng</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.keyFormulas
          .map(
            (f) => `
          <tr>
            <td style="font-weight: bold;">${f.name}</td>
            <td style="font-weight: bold; color: #990000; text-align: center;">${formatLatexToWordUnicode(f.formula)}</td>
            <td>${f.note}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    ` : ''}

    ${studyGuide.trapList && studyGuide.trapList.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #b45309;">
      3. CẨM NANG BẪY SAI KINHDIỂN & BÍ QUYẾT PHÒNG TRÁNH (Quan trọng phát cho học sinh)
    </div>
    <table>
      <thead>
        <tr style="background-color: #fff7ed;">
          <th style="width: 25%; color: #9a3412;">Dạng Bẫy Tư Duy</th>
          <th style="width: 45%; color: #9a3412;">Mô tả bẫy hay mắc & Minh họa câu hỏi</th>
          <th style="color: #9a3412;">Bí quyết phòng tránh & Kiểm tra nhanh</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.trapList
          .map(
            (trap) => `
          <tr>
            <td style="font-weight: bold; color: #c2410c;">${trap.trapType}</td>
            <td>
              <div>${formatLatexToWordUnicode(trap.description)}</div>
              ${trap.exampleQuestion ? `<div style="font-style: italic; color: #555; margin-top: 3pt; font-size: 9.5pt;">VD: "${formatLatexToWordUnicode(trap.exampleQuestion)}"</div>` : ''}
            </td>
            <td style="font-weight: bold; color: #15803d;">${formatLatexToWordUnicode(trap.avoidanceTip)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #b45309;">
      4. Các Lỗi Sai Thường Gặp Khác Khi Làm Bài
    </div>
    <ul style="margin-top: 4pt; margin-bottom: 12pt; line-height: 1.5;">
      ${studyGuide.commonMistakes.map((m) => `<li>${formatLatexToWordUnicode(m)}</li>`).join('')}
    </ul>

    ${studyGuide.timeStrategy && studyGuide.timeStrategy.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #047857;">
      5. Phân Bổ Thời Gian & Chiến Thuật Làm Bài Theo Dạng Đề GDPT 2018
    </div>
    <table>
      <thead>
        <tr style="background-color: #ecfdf5;">
          <th style="width: 35%; color: #065f46;">Phần thi / Cấu trúc</th>
          <th style="width: 25%; color: #065f46;">Thời gian đề xuất</th>
          <th style="color: #065f46;">Chiến thuật làm bài tối ưu điểm</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.timeStrategy
          .map(
            (ts) => `
          <tr>
            <td style="font-weight: bold;">${ts.partTitle}</td>
            <td style="font-weight: bold; color: #047857; text-align: center;">${ts.timeAlloc}</td>
            <td>${ts.strategy}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    ` : ''}

    ${studyGuide.readinessChecklist && studyGuide.readinessChecklist.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #1e3a8a;">
      6. Checklist Tự Kiểm Tra Kiến Thức Trước Khi Bước Vào Phòng Thi
    </div>
    <ul style="margin-top: 4pt; margin-bottom: 12pt; line-height: 1.5;">
      ${studyGuide.readinessChecklist.map((chk) => `<li>[  ] ${formatLatexToWordUnicode(chk)}</li>`).join('')}
    </ul>
    ` : ''}

    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #047857;">
      7. Lời Dặn Của Giáo Viên & Mẹo Ôn Tập Cốt Lõi
    </div>
    <ul style="margin-top: 4pt; margin-bottom: 12pt; line-height: 1.5;">
      ${studyGuide.reviewTips.map((t) => `<li>${formatLatexToWordUnicode(t)}</li>`).join('')}
    </ul>
  `;
}

function renderExamQuestionsToWord(questions: QuestionItem[]): string {
  let html = '';
  let currentPart = '';
  let qNumber = 1;

  questions.forEach((q) => {
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

    if (q.passage) {
      html += `
        <div style="background-color: #f9f9f9; padding: 6pt; border-left: 3px solid #333; margin-bottom: 8pt; font-style: italic;">
          <strong>Đọc đoạn trích/ngữ liệu sau để trả lời câu hỏi:</strong><br>
          ${q.passage.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    html += `<div class="question-block">`;
    html += `<div><strong>Câu ${qNumber++} (${q.score || 0} điểm):</strong> ${formatLatexToWordUnicode(q.question)}</div>`;

    if ((q.type === 'mcq_single' || q.part === 'part1') && q.options && q.options.length === 4) {
      html += `
        <table class="option-table" style="width: 100%; margin-top: 4pt;">
          <tr>
            <td style="width: 50%;"><strong>A.</strong> ${formatLatexToWordUnicode(q.options[0])}</td>
            <td style="width: 50%;"><strong>B.</strong> ${formatLatexToWordUnicode(q.options[1])}</td>
          </tr>
          <tr>
            <td style="width: 50%;"><strong>C.</strong> ${formatLatexToWordUnicode(q.options[2])}</td>
            <td style="width: 50%;"><strong>D.</strong> ${formatLatexToWordUnicode(q.options[3])}</td>
          </tr>
        </table>
      `;
    }

    if ((q.type === 'true_false_group' || q.part === 'part2') && q.subItems) {
      html += `<div style="margin-left: 15pt; margin-top: 4pt;">`;
      q.subItems.forEach((sub) => {
        html += `<div><strong>${sub.label})</strong> ${formatLatexToWordUnicode(sub.statement)}</div>`;
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
        <div><strong>Câu ${idx + 1} (${q.score || 0} điểm) [${q.level}]:</strong> ${formatLatexToWordUnicode(q.question)}</div>
        <div style="color: #006600; font-weight: bold; margin-top: 3pt;">
          Đáp án đúng: ${typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}
        </div>
        ${q.subItems ? `
          <ul style="margin: 3pt 0 3pt 15pt;">
            ${q.subItems.map((s) => `<li>Ý ${s.label}: <strong>${s.isCorrect ? 'ĐÚNG' : 'SAI'}</strong> ${s.explanation ? `(${formatLatexToWordUnicode(s.explanation)})` : ''}</li>`).join('')}
          </ul>
        ` : ''}
        <div style="margin-top: 3pt;"><strong>Hướng dẫn giải chi tiết:</strong> ${formatLatexToWordUnicode(q.explanation || 'Áp dụng định lý và tính toán theo chuẩn kiến thức.')}</div>
        ${q.rubric && q.rubric.length > 0 ? `
          <div style="margin-top: 4pt;">
            <strong>Biểu điểm thành phần:</strong>
            <table style="width: 100%; margin-top: 3pt;">
              <tr style="background-color: #f2f2f2;"><th>Bước</th><th>Nội dung yêu cầu</th><th>Điểm</th></tr>
              ${q.rubric.map((r) => `<tr><td style="text-align: center;">${r.step}</td><td>${formatLatexToWordUnicode(r.detail)}</td><td style="text-align: center; font-weight: bold;">${r.point}đ</td></tr>`).join('')}
            </table>
          </div>
        ` : ''}
      </div>
    `;
  });
  return html;
}

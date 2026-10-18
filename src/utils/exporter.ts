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
  ${renderSpecTable(specs, matrix)}

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
  ${renderSpecTable(specs, matrix)}

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
export function wrapHtmlForPrint(title: string, bodyHtml: string, config?: ExamConfig): string {
  const fontSize = config?.layoutFontSize === 'small' ? '10pt' : config?.layoutFontSize === 'large' ? '12pt' : '11pt';
  const lineHeight = config?.layoutLineHeight === 'compact' ? '1.2' : config?.layoutLineHeight === 'relaxed' ? '1.8' : '1.35';

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
      font-size: ${fontSize};
      line-height: ${lineHeight};
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
  const parseVal = (val: any) => {
    if (val === undefined || val === null) return { count: 0, codeStr: '' };
    if (typeof val === 'number') return { count: val, codeStr: '' };
    if (typeof val === 'object') return { count: Number(val.count) || 0, codeStr: val.codeStr || '' };
    return { count: 0, codeStr: '' };
  };

  const rows = matrix.rows || [];
  const grandScore = matrix.grandTotal?.score || 10;

  let p1B = 0, p1H = 0, p1V = 0;
  let p2B = 0, p2H = 0, p2V = 0;
  let p3B = 0, p3H = 0, p3V = 0;
  let p4B = 0, p4H = 0, p4V = 0;

  rows.forEach((r) => {
    p1B += parseVal(r.part1?.['Biết'] || r.part1?.['Nhận biết']).count;
    p1H += parseVal(r.part1?.['Hiểu'] || r.part1?.['Thông hiểu']).count;
    p1V += parseVal(r.part1?.['Vận dụng'] || r.part1?.['VD']).count;

    p2B += parseVal(r.part2?.['Biết'] || r.part2?.['Nhận biết']).count;
    p2H += parseVal(r.part2?.['Hiểu'] || r.part2?.['Thông hiểu']).count;
    p2V += parseVal(r.part2?.['Vận dụng'] || r.part2?.['VD']).count;

    p3B += parseVal(r.part3?.['Biết'] || r.part3?.['Nhận biết']).count;
    p3H += parseVal(r.part3?.['Hiểu'] || r.part3?.['Thông hiểu']).count;
    p3V += parseVal(r.part3?.['Vận dụng'] || r.part3?.['VD']).count;

    p4B += parseVal(r.part4?.['Biết'] || r.part4?.['Nhận biết']).count;
    p4H += parseVal(r.part4?.['Hiểu'] || r.part4?.['Thông hiểu']).count;
    p4V += parseVal(r.part4?.['Vận dụng'] || r.part4?.['VD']).count;
  });

  const sumB = p1B + p2B + p3B + p4B;
  const sumH = p1H + p2H + p3H + p4H;
  const sumV = p1V + p2V + p3V + p4V;
  const grandCount = sumB + sumH + sumV;

  const countP1 = p1B + p1H + p1V;
  const countP2 = p2B + p2H + p2V;
  const countP3 = p3B + p3H + p3V;
  const countP4 = p4B + p4H + p4V;

  const score1 = countP1 * 0.25;
  const score2 = countP2 * 0.25;
  const score3 = countP3 * 0.5;
  const score4 = Math.max(0, grandScore - score1 - score2 - score3);

  const renderCellHTML = (val: any) => {
    const { count, codeStr } = parseVal(val);
    if (count <= 0) return '';
    if (codeStr) return `<b>${count}</b><br><span style="font-size: 8pt; color: #444444;">(${codeStr})</span>`;
    return `<b>${count}</b>`;
  };

  const fmt = (n: number) => (n % 1 === 0 ? `${n},0` : n.toFixed(1).replace('.', ','));

  return `
  <div style="text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 6pt;">
    1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;" border="1">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th rowspan="3" style="width: 3%;">TT</th>
        <th rowspan="3" style="width: 14%;">Chủ đề/Chương</th>
        <th rowspan="3" style="width: 22%;">Nội dung/đơn vị kiến thức</th>
        <th colspan="12" style="text-transform: uppercase;">Mức độ đánh giá</th>
        <th colspan="3" rowspan="2" style="background-color: #e6e6e6;">Tổng</th>
        <th rowspan="3" style="width: 6%; background-color: #e6f2ff;">Tỉ lệ % điểm</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-weight: bold;">
        <th colspan="9">TNKQ</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-size: 9pt;">
        <th colspan="3">Nhiều lựa chọn</th>
        <th colspan="3">“Đúng – Sai”²</th>
        <th colspan="3">Trả lời ngắn³</th>
        <th colspan="3">Tự luận</th>
        <th style="background-color: #e6e6e6;">Biết</th>
        <th style="background-color: #e6e6e6;">Hiểu</th>
        <th style="background-color: #e6e6e6;">Vận dụng</th>
      </tr>
      <tr style="background-color: #f2f2f2; font-size: 8.5pt; font-weight: bold;">
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th colspan="4" style="background-color: #e6e6e6;"></th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((row, idx) => {
        const getV = (part: any, lvl: string) => {
          const keys = Object.keys(part || {});
          const mk = keys.find(k => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
          return part?.[mk];
        };

        const v1B = getV(row.part1, 'Biết');
        const v1H = getV(row.part1, 'Hiểu');
        const v1V = getV(row.part1, 'Vận dụng') || getV(row.part1, 'VD');

        const v2B = getV(row.part2, 'Biết');
        const v2H = getV(row.part2, 'Hiểu');
        const v2V = getV(row.part2, 'Vận dụng') || getV(row.part2, 'VD');

        const v3B = getV(row.part3, 'Biết');
        const v3H = getV(row.part3, 'Hiểu');
        const v3V = getV(row.part3, 'Vận dụng') || getV(row.part3, 'VD');

        const v4B = getV(row.part4, 'Biết');
        const v4H = getV(row.part4, 'Hiểu');
        const v4V = getV(row.part4, 'Vận dụng') || getV(row.part4, 'VD');

        const rSumB = parseVal(v1B).count + parseVal(v2B).count + parseVal(v3B).count + parseVal(v4B).count;
        const rSumH = parseVal(v1H).count + parseVal(v2H).count + parseVal(v3H).count + parseVal(v4H).count;
        const rSumV = parseVal(v1V).count + parseVal(v2V).count + parseVal(v3V).count + parseVal(v4V).count;

        const chap = row.chapter || `Chủ đề ${Math.ceil((idx + 1) / 2)}`;

        return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold;">${chap}</td>
          <td style="text-align: left;">${row.topic}</td>

          <td>${renderCellHTML(v1B)}</td>
          <td>${renderCellHTML(v1H)}</td>
          <td>${renderCellHTML(v1V)}</td>

          <td>${renderCellHTML(v2B)}</td>
          <td>${renderCellHTML(v2H)}</td>
          <td>${renderCellHTML(v2V)}</td>

          <td>${renderCellHTML(v3B)}</td>
          <td>${renderCellHTML(v3H)}</td>
          <td>${renderCellHTML(v3V)}</td>

          <td>${renderCellHTML(v4B)}</td>
          <td>${renderCellHTML(v4H)}</td>
          <td>${renderCellHTML(v4V)}</td>

          <td style="background-color: #f5f5f5; font-weight: bold;">${rSumB > 0 ? rSumB : ''}</td>
          <td style="background-color: #f5f5f5; font-weight: bold;">${rSumH > 0 ? rSumH : ''}</td>
          <td style="background-color: #f5f5f5; font-weight: bold;">${rSumV > 0 ? rSumV : ''}</td>

          <td style="background-color: #e6f2ff; font-weight: bold;">${row.percent ? `${row.percent}%` : ''}</td>
        </tr>
        `;
      }).join('')}

      <!-- Dòng 1: Tổng số câu -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="3" style="text-align: center; text-transform: uppercase;">Tổng số câu</td>
        <td colspan="3">${countP1 || ''}</td>
        <td colspan="3">${countP2 || ''}</td>
        <td colspan="3">${countP3 || ''}</td>
        <td colspan="3">${countP4 || ''}</td>
        <td style="background-color: #e6e6e6;">${sumB || ''}</td>
        <td style="background-color: #e6e6e6;">${sumH || ''}</td>
        <td style="background-color: #e6e6e6;">${sumV || ''}</td>
        <td style="background-color: #cce5ff;"></td>
      </tr>

      <!-- Dòng 2: Tổng số điểm -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="3" style="text-align: center; text-transform: uppercase;">Tổng số điểm</td>
        <td colspan="3">${fmt(score1) || '3,0'}⁵</td>
        <td colspan="3">${fmt(score2) || '2,0'}</td>
        <td colspan="3">${fmt(score3) || '2,0'}</td>
        <td colspan="3">${fmt(score4) || '3,0'}</td>
        <td style="background-color: #e6e6e6;">4,0</td>
        <td style="background-color: #e6e6e6;">3,0</td>
        <td style="background-color: #e6e6e6;">3,0</td>
        <td style="background-color: #cce5ff;">${grandScore},0</td>
      </tr>

      <!-- Dòng 3: Tỉ lệ % -->
      <tr style="background-color: #e6f2ff; font-weight: bold;">
        <td colspan="3" style="text-align: center; text-transform: uppercase;">Tỉ lệ %</td>
        <td colspan="3">30</td>
        <td colspan="3">20</td>
        <td colspan="3">20</td>
        <td colspan="3">30</td>
        <td style="background-color: #b3d7ff;">40</td>
        <td style="background-color: #b3d7ff;">30</td>
        <td style="background-color: #b3d7ff;">30</td>
        <td style="background-color: #80bfff; font-size: 10pt;">100%</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size: 8.5pt; font-style: italic; margin-top: 6pt; line-height: 1.4; color: #333;">
    <div><sup>2</sup> Mỗi câu hỏi bao gồm 4 ý nhỏ, mỗi ý học sinh phải chọn đúng hoặc sai. Một số tài liệu xếp loại câu hỏi này vào loại <i>Nhiều lựa chọn phức hợp</i> hoặc <i>Nhiều lựa chọn có nhiều phương án đúng</i>.</div>
    <div><sup>3</sup> Đối với môn học không sử dụng dạng này thì chuyển toàn bộ số điểm cho dạng <i>“Đúng – Sai”</i>.</div>
    <div><sup>4</sup> Có ở trong một số ô của ma trận, thể hiện số câu hỏi hoặc câu hỏi số bao nhiêu.</div>
    <div><sup>5</sup> Lựa chọn sao cho được khoảng 3,0 điểm, tương ứng với tỉ lệ khoảng 30%; tương tự như thế đối với các dạng khác.</div>
  </div>
  `;
}

function renderSpecTable(specs: ExamSpecificationRow[], matrix?: ExamMatrix): string {
  const rows = matrix?.rows || [];

  const parseVal = (val: any) => {
    if (val === undefined || val === null) return { count: 0, codeStr: '' };
    if (typeof val === 'number') return { count: val, codeStr: '' };
    if (typeof val === 'object') return { count: Number(val.count) || 0, codeStr: val.codeStr || '' };
    return { count: 0, codeStr: '' };
  };

  const renderSpecCellHTML = (val: any) => {
    const { count, codeStr } = parseVal(val);
    if (count <= 0) return '';
    return `(${count})<br><span style="font-size: 7.5pt; color: #444;">(${codeStr || 'NL?'})</span>`;
  };

  const grandScore = matrix?.grandTotal?.score || 10;
  let countP1 = 0, countP2 = 0, countP3 = 0, countP4 = 0;

  rows.forEach((r) => {
    countP1 += parseVal(r.part1?.['Biết'] || r.part1?.['Nhận biết']).count + parseVal(r.part1?.['Hiểu'] || r.part1?.['Thông hiểu']).count + parseVal(r.part1?.['Vận dụng'] || r.part1?.['VD']).count;
    countP2 += parseVal(r.part2?.['Biết'] || r.part2?.['Nhận biết']).count + parseVal(r.part2?.['Hiểu'] || r.part2?.['Thông hiểu']).count + parseVal(r.part2?.['Vận dụng'] || r.part2?.['VD']).count;
    countP3 += parseVal(r.part3?.['Biết'] || r.part3?.['Nhận biết']).count + parseVal(r.part3?.['Hiểu'] || r.part3?.['Thông hiểu']).count + parseVal(r.part3?.['Vận dụng'] || r.part3?.['VD']).count;
    countP4 += parseVal(r.part4?.['Biết'] || r.part4?.['Nhận biết']).count + parseVal(r.part4?.['Hiểu'] || r.part4?.['Thông hiểu']).count + parseVal(r.part4?.['Vận dụng'] || r.part4?.['VD']).count;
  });

  const score1 = countP1 * 0.25;
  const score2 = countP2 * 0.25;
  const score3 = countP3 * 0.5;
  const score4 = Math.max(0, grandScore - score1 - score2 - score3);
  const fmt = (n: number) => (n % 1 === 0 ? `${n},0` : n.toFixed(1).replace('.', ','));

  return `
  <div style="text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 6pt; margin-top: 15pt;">
    2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;" border="1">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th rowspan="3" style="width: 3%;">TT</th>
        <th rowspan="3" style="width: 12%;">Chủ đề/Chương</th>
        <th rowspan="3" style="width: 15%;">Nội dung/đơn vị kiến thức</th>
        <th rowspan="3" style="width: 30%;">Yêu cầu cần đạt</th>
        <th colspan="12" style="text-transform: uppercase;">Số câu hỏi ở các mức độ đánh giá</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-weight: bold;">
        <th colspan="9">TNKQ</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-size: 9pt;">
        <th colspan="3">Nhiều lựa chọn</th>
        <th colspan="3">“Đúng – Sai”</th>
        <th colspan="3">Trả lời ngắn</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f2f2f2; font-size: 8.5pt; font-weight: bold;">
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows.map((row, idx) => {
        const getV = (part: any, lvl: string) => {
          const keys = Object.keys(part || {});
          const mk = keys.find(k => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
          return part?.[mk];
        };

        const v1B = getV(row.part1, 'Biết');
        const v1H = getV(row.part1, 'Hiểu');
        const v1V = getV(row.part1, 'Vận dụng') || getV(row.part1, 'VD');

        const v2B = getV(row.part2, 'Biết');
        const v2H = getV(row.part2, 'Hiểu');
        const v2V = getV(row.part2, 'Vận dụng') || getV(row.part2, 'VD');

        const v3B = getV(row.part3, 'Biết');
        const v3H = getV(row.part3, 'Hiểu');
        const v3V = getV(row.part3, 'Vận dụng') || getV(row.part3, 'VD');

        const v4B = getV(row.part4, 'Biết');
        const v4H = getV(row.part4, 'Hiểu');
        const v4V = getV(row.part4, 'Vận dụng') || getV(row.part4, 'VD');

        const chap = row.chapter || `Chủ đề ${Math.ceil((idx + 1) / 2)}`;

        return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold;">${chap}</td>
          <td style="text-align: left;">${row.topic}</td>
          <td style="text-align: left; font-size: 9pt; line-height: 1.35;">
            <div><b>- Biết:</b> Nhận biết và nêu được các kiến thức cốt lõi về ${row.topic}.</div>
            <div><b>- Hiểu:</b> Giải thích, mô tả bản chất và tính toán đại lượng đặc trưng của ${row.topic}.</div>
            <div><b>- VD:</b> Vận dụng định lý, quy tắc để giải quyết tình huống thực tế về ${row.topic}.</div>
          </td>

          <td>${renderSpecCellHTML(v1B)}</td>
          <td>${renderSpecCellHTML(v1H)}</td>
          <td>${renderSpecCellHTML(v1V)}</td>

          <td>${renderSpecCellHTML(v2B)}</td>
          <td>${renderSpecCellHTML(v2H)}</td>
          <td>${renderSpecCellHTML(v2V)}</td>

          <td>${renderSpecCellHTML(v3B)}</td>
          <td>${renderSpecCellHTML(v3H)}</td>
          <td>${renderSpecCellHTML(v3V)}</td>

          <td>${renderSpecCellHTML(v4B)}</td>
          <td>${renderSpecCellHTML(v4H)}</td>
          <td>${renderSpecCellHTML(v4V)}</td>
        </tr>
        `;
      }).join('') : specs.map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>Chủ đề ${idx + 1}</td>
          <td>${s.topic}</td>
          <td style="text-align: left;">${s.competency}</td>
          <td colspan="12" style="text-align: center;">${s.questionCount} câu (${s.level})</td>
        </tr>
      `).join('')}

      <!-- Dòng 1: Tổng số câu -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="4" style="text-align: center; text-transform: uppercase;">Tổng số câu</td>
        <td colspan="3">${countP1 || 12}</td>
        <td colspan="3">${countP2 || 4}</td>
        <td colspan="3">${countP3 || 4}</td>
        <td colspan="3">${countP4 || 2}</td>
      </tr>

      <!-- Dòng 2: Tổng số điểm -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="4" style="text-align: center; text-transform: uppercase;">Tổng số điểm</td>
        <td colspan="3">${fmt(score1) || '3,0'}</td>
        <td colspan="3">${fmt(score2) || '2,0'}</td>
        <td colspan="3">${fmt(score3) || '2,0'}</td>
        <td colspan="3">${fmt(score4) || '3,0'}</td>
      </tr>

      <!-- Dòng 3: Tỉ lệ % -->
      <tr style="background-color: #e6f2ff; font-weight: bold;">
        <td colspan="4" style="text-align: center; text-transform: uppercase;">Tỉ lệ %</td>
        <td colspan="3">${Math.round((score1 / grandScore) * 100) || 30}</td>
        <td colspan="3">${Math.round((score2 / grandScore) * 100) || 20}</td>
        <td colspan="3">${Math.round((score3 / grandScore) * 100) || 20}</td>
        <td colspan="3">${Math.round((score4 / grandScore) * 100) || 30}</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size: 8.5pt; font-style: italic; margin-top: 6pt; color: #333;">
    <sup>6</sup> Kí hiệu năng lực thành tố cần đánh giá (hoặc mã câu hỏi tương ứng trong đề thi).
  </div>
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

/**
 * 6. Xuất BẢNG TỔNG HỢP ĐÁP ÁN ĐA MÃ ĐỀ (.doc)
 */
export function exportMasterAnswerKeyWordDoc(
  config: ExamConfig,
  shuffledCodes: ShuffledExamCode[]
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ';
  const school = (config.schoolName || 'TRƯỜNG THPT').toUpperCase();
  const department = (config.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase();
  const subject = (config.customSubject || config.subject || 'Môn học').toUpperCase();
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade}` : `Lớp ${config.grade}`;
  const academicYear = config.academicYear || '2025 - 2026';

  const baseCode = shuffledCodes[0] || { code: '101', questions: [], quickAnswers: [] };
  const baseQuestions = baseCode.questions || [];

  const part1Base = baseQuestions.filter(q => q.part === 'part1' || q.type === 'mcq_single');
  const part2Base = baseQuestions.filter(q => q.part === 'part2' || q.type === 'true_false_group');
  const part3Base = baseQuestions.filter(q => q.part === 'part3' || q.type === 'short_answer');

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>BẢNG TỔNG HỢP ĐÁP ÁN ĐA MÃ ĐỀ - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- Header -->
  <table class="header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-family: 'Times New Roman', serif;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 11pt;">${department}</div>
        <div class="bold uppercase" style="font-size: 11pt;">${school}</div>
        <div class="italic bold" style="font-size: 10.5pt; margin-top: 3pt;">HỘI ĐỒNG KHẢO THÍ</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 12pt;">BẢNG TỔNG HỢP ĐÁP ÁN CÁC MÃ ĐỀ</div>
        <div class="bold uppercase" style="font-size: 11pt; margin-top: 2pt;">${title} – NĂM HỌC ${academicYear}</div>
        <div class="italic" style="font-size: 11pt; margin-top: 2pt;">MÔN: ${subject} – ${gradeStr.toUpperCase()}</div>
      </td>
    </tr>
  </table>

  <div style="border-bottom: 1.5pt solid #000; margin-bottom: 14pt;"></div>

  <!-- PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN -->
  ${part1Base.length > 0 ? `
  <div class="bold uppercase" style="font-size: 11.5pt; margin-bottom: 4pt; color: #1e3a8a;">
    PHẦN I. ĐÁP ÁN TRẮC NGHIỆM NHIỀU LỰA CHỌN (Mỗi câu đúng được 0.25 điểm)
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        ${shuffledCodes.map(c => `<th style="text-align: center; width: ${Math.floor(90 / shuffledCodes.length)}%;">Mã đề ${c.code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${part1Base.map((_, idx) => {
        const qNum = idx + 1;
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; background-color: #fafafa;">Câu ${qNum}</td>
            ${shuffledCodes.map(c => {
              const q = (c.questions.filter(item => item.part === 'part1' || item.type === 'mcq_single'))[idx];
              const ans = q ? String(q.correctAnswer) : '-';
              return `<td style="text-align: center; font-weight: bold; color: #006600; font-size: 11pt;">${ans}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI 4 Ý -->
  ${part2Base.length > 0 ? `
  <div class="page-break"></div>
  <div class="bold uppercase" style="font-size: 11.5pt; margin-top: 10pt; margin-bottom: 4pt; color: #1e3a8a;">
    PHẦN II. ĐÁP ÁN TRẮC NGHIỆM ĐÚNG / SAI (Quy tắc bậc thang: 1 ý đúng = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; 4 ý = 1.0đ)
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        <th style="width: 8%; text-align: center;">Lệnh</th>
        ${shuffledCodes.map(c => `<th style="text-align: center; width: ${Math.floor(82 / shuffledCodes.length)}%;">Mã đề ${c.code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${part2Base.flatMap((_, qIdx) => {
        const qNum = qIdx + 1;
        return ['a', 'b', 'c', 'd'].map((label, subIdx) => `
          <tr ${subIdx === 0 ? 'style="border-top: 1.5pt solid #000;"' : ''}>
            ${subIdx === 0 ? `<td rowspan="4" style="text-align: center; font-weight: bold; background-color: #f7f7f7; vertical-align: middle;">Câu ${qNum}</td>` : ''}
            <td style="text-align: center; font-weight: bold;">${label})</td>
            ${shuffledCodes.map(c => {
              const q = (c.questions.filter(item => item.part === 'part2' || item.type === 'true_false_group'))[qIdx];
              const sub = q?.subItems?.[subIdx];
              const isCorrect = sub ? sub.isCorrect : false;
              return `<td style="text-align: center; font-weight: bold; color: ${isCorrect ? '#006600' : '#cc0000'};">${isCorrect ? 'Đ' : 'S'}</td>`;
            }).join('')}
          </tr>
        `);
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- PHẦN III: TRẢ LỜI NGẮN -->
  ${part3Base.length > 0 ? `
  <div class="bold uppercase" style="font-size: 11.5pt; margin-top: 10pt; margin-bottom: 4pt; color: #1e3a8a;">
    PHẦN III. ĐÁP ÁN TRẮC NGHIỆM TRẢ LỜI NGẮN (Mỗi câu đúng được 0.5 điểm)
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        ${shuffledCodes.map(c => `<th style="text-align: center; width: ${Math.floor(90 / shuffledCodes.length)}%;">Mã đề ${c.code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${part3Base.map((_, idx) => {
        const qNum = idx + 1;
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; background-color: #fafafa;">Câu ${qNum}</td>
            ${shuffledCodes.map(c => {
              const q = (c.questions.filter(item => item.part === 'part3' || item.type === 'short_answer'))[idx];
              const ans = q ? String(q.correctAnswer) : '-';
              return `<td style="text-align: center; font-weight: bold; color: #0044cc; font-size: 11pt;">${ans}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="text-center italic" style="margin-top: 25pt;">
    --- HẾT BẢNG TỔNG HỢP ĐÁP ÁN ---
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Bang_Tong_Hop_Dap_An_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_DaMaDe.doc`);
}

/**
 * 7. Xuất PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN A4 (.doc)
 */
export function exportAnswerSheetWordDoc(
  config: ExamConfig,
  currentCode: ShuffledExamCode
): void {
  const school = (config.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase();
  const subject = (config.customSubject || config.subject || 'Môn học').toUpperCase();
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade}` : `Lớp ${config.grade}`;
  const p1Count = config.sectionCounts.part1 || 12;
  const p2Count = config.sectionCounts.part2 || 4;
  const p3Count = config.sectionCounts.part3 || 6;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>PHIẾU TRẢ LỜI TRẮC NGHIỆM - ${subject}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- Header -->
  <table class="header-table" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <div class="bold uppercase" style="font-size: 10.5pt;">${school}</div>
        <div class="bold uppercase" style="font-size: 10.5pt; margin-top: 2pt;">HỘI ĐỒNG COI THI: .........................</div>
        <div style="font-size: 10pt; margin-top: 2pt;">Phòng thi số: ....... Điểm thi: .............</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <div class="bold uppercase" style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="bold underline" style="font-size: 10.5pt;">Độc lập - Tự do - Hạnh phúc</div>
      </td>
    </tr>
  </table>

  <!-- Title -->
  <div class="text-center" style="margin-top: 10pt; margin-bottom: 10pt;">
    <div class="bold uppercase" style="font-size: 15pt; letter-spacing: 1px;">PHIẾU TRẢ LỜI TRẮC NGHIỆM</div>
    <div class="bold uppercase" style="font-size: 11pt; margin-top: 2pt;">BÀI THI: ${subject} – ${gradeStr.toUpperCase()}</div>
    <div class="italic" style="font-size: 9.5pt;">(Định dạng chuẩn khảo thí 2025 của Bộ Giáo dục và Đào tạo)</div>
  </div>

  <!-- Student Info Box -->
  <table style="width: 100%; border: 1.5pt solid #000; margin-bottom: 8pt;">
    <tr>
      <td style="width: 60%; vertical-align: top; padding: 6pt; border-right: 1pt solid #000;">
        <div style="margin-bottom: 6pt;"><strong>1. Họ, chữ đệm và tên thí sinh:</strong> ............................................................................</div>
        <div style="margin-bottom: 6pt;"><strong>2. Ngày sinh:</strong> ..... / ..... / ......... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>3. Lớp:</strong> ....................</div>
        <div style="margin-bottom: 8pt;"><strong>4. Trường:</strong> ..........................................................................................................</div>
        <table class="header-table" style="width: 100%; margin-top: 4pt;">
          <tr>
            <td style="text-align: center; width: 50%; border: 1pt solid #000; padding: 4pt; height: 40pt; vertical-align: top;">
              <span style="font-size: 8.5pt; font-weight: bold;">CHỮ KÝ GIÁM THỊ 1</span>
            </td>
            <td style="text-align: center; width: 50%; border: 1pt solid #000; padding: 4pt; height: 40pt; vertical-align: top;">
              <span style="font-size: 8.5pt; font-weight: bold;">CHỮ KÝ GIÁM THỊ 2</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="width: 40%; vertical-align: top; padding: 6pt; text-align: center;">
        <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 4pt;">5. SỐ BÁO DANH &nbsp;&nbsp;&nbsp;&nbsp; 6. MÃ ĐỀ THI: [ ${currentCode.code} ]</div>
        <div style="font-size: 9pt; color: #444; border: 1px dashed #666; padding: 8pt;">
          [KHUNG TÔ BỌNG CHÌ ĐIỆN TỬ SBD & MÃ ĐỀ]<br>
          <span style="font-size: 8pt;">(Học sinh dùng bút chì 2B tô tròn kín ô số tương ứng)</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- Sections Tables -->
  <table class="header-table" style="width: 100%; margin-top: 8pt;">
    <tr>
      <!-- Column Left: Part I -->
      <td style="width: 50%; vertical-align: top; padding-right: 6pt;">
        <div style="background-color: #000; color: #fff; font-weight: bold; text-align: center; padding: 3pt; font-size: 10pt;">
          PHẦN I. CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (${p1Count} câu)
        </div>
        <table style="width: 100%; margin-top: 4pt; font-size: 9pt;">
          ${Array.from({ length: Math.max(p1Count, 12) }).map((_, idx) => {
            const qNum = idx + 1;
            return `
              <tr>
                <td style="width: 25%; font-weight: bold; text-align: center;">Câu ${qNum}</td>
                <td style="text-align: center;">[A] &nbsp;&nbsp; [B] &nbsp;&nbsp; [C] &nbsp;&nbsp; [D]</td>
              </tr>
            `;
          }).join('')}
        </table>
      </td>

      <!-- Column Right: Part II & III -->
      <td style="width: 50%; vertical-align: top; padding-left: 6pt;">
        <div style="background-color: #000; color: #fff; font-weight: bold; text-align: center; padding: 3pt; font-size: 10pt;">
          PHẦN II. CÂU ĐÚNG / SAI (${p2Count} câu x 4 ý)
        </div>
        <table style="width: 100%; margin-top: 4pt; font-size: 9pt;">
          ${Array.from({ length: Math.max(p2Count, 4) }).map((_, idx) => {
            const qNum = idx + 1;
            return `
              <tr style="background-color: #f2f2f2;">
                <td colspan="2" style="font-weight: bold; text-align: center;">Câu ${qNum}</td>
              </tr>
              <tr><td style="width: 30%; text-align: center;">Ý a)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
              <tr><td style="width: 30%; text-align: center;">Ý b)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
              <tr><td style="width: 30%; text-align: center;">Ý c)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
              <tr><td style="width: 30%; text-align: center;">Ý d)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
            `;
          }).join('')}
        </table>

        ${p3Count > 0 ? `
        <div style="background-color: #000; color: #fff; font-weight: bold; text-align: center; padding: 3pt; font-size: 10pt; margin-top: 8pt;">
          PHẦN III. TRẢ LỜI NGẮN (${p3Count} câu)
        </div>
        <table style="width: 100%; margin-top: 4pt; font-size: 9pt;">
          ${Array.from({ length: p3Count }).map((_, idx) => {
            const qNum = idx + 1;
            return `
              <tr>
                <td style="width: 25%; font-weight: bold; text-align: center;">Câu ${qNum}</td>
                <td style="text-align: center; font-style: italic; color: #666;">[ _ _ _ _ _ ] (Tô ô số kết quả)</td>
              </tr>
            `;
          }).join('')}
        </table>
        ` : ''}
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Phieu_Tra_Loi_Trac_Nghiem_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}


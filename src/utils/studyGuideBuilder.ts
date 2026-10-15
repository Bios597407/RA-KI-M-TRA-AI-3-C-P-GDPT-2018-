import { ExamConfig, QuestionItem, StudyGuideData } from '../types/exam';

/**
 * Builds a comprehensive Study Guide (Đề cương tóm tắt kiến thức trọng tâm)
 * based on current exam config and questions
 */
export function buildStudyGuide(config: ExamConfig, questions: QuestionItem[]): StudyGuideData {
  const subject = (config.customSubject || config.subject || 'Toán học').toLowerCase();
  const topic = config.topicTitle || 'Kiến thức trọng tâm';
  const grade = config.grade;

  let coreConcepts: Array<{ term: string; definition: string }> = [];
  let keyFormulas: Array<{ name: string; formula: string; note: string }> = [];
  let commonMistakes: string[] = [];
  let reviewTips: string[] = [];

  if (subject.includes('toán')) {
    coreConcepts = [
      {
        term: 'Cực trị của hàm số',
        definition: 'Điểm mà tại đó đạo hàm $f\'(x)$ triệt tiêu hoặc không xác định và đổi dấu khi qua điểm đó.',
      },
      {
        term: 'Đường tiệm cận ngang / đứng',
        definition: 'Đường thẳng $y = y_0$ là TCN nếu $\\lim_{x \\to \\pm\\infty} f(x) = y_0$; đường thẳng $x = x_0$ là TCĐ nếu $\\lim_{x \\to x_0} f(x) = \\pm\\infty$.',
      },
      {
        term: 'Giá trị lớn nhất và nhỏ nhất (GTLN, GTNN)',
        definition: 'Số $M$ là GTLN của $f(x)$ trên tập $D$ nếu $f(x) \\le M, \\forall x \\in D$ và $\\exists x_0 \\in D: f(x_0) = M$.',
      },
    ];

    keyFormulas = [
      {
        name: 'Quy tắc xét cực trị',
        formula: '$f\'(x_0) = 0$ và $f\'\'(x_0) < 0 \\implies x_0$ là điểm cực đại',
        note: 'Dùng dấu của đạo hàm cấp 2 để phân biệt cực đại / cực tiểu nhanh.',
      },
      {
        name: 'Đạo hàm hàm phân thức',
        formula: '$\\left(\\frac{ax+b}{cx+d}\\right)\' = \\frac{ad - bc}{(cx+d)^2}$',
        note: 'Dấu của đạo hàm luôn đồng nhất trên từng khoảng xác định.',
      },
      {
        name: 'Điều kiện 3 nghiệm phân biệt',
        formula: '$y_{\\text{CĐ}} \\times y_{\\text{CT}} < 0$',
        note: 'Hai điểm cực trị nằm về hai phía so với trục hoành $Ox$.',
      },
    ];

    commonMistakes = [
      'Nhầm lẫn giữa "Điểm cực trị của hàm số" ($x$) và "Giá trị cực trị" ($y$).',
      'Quên đối chiếu điều kiện xác định của phương trình trước khi nhận nghiệm.',
      'Bỏ quên trường hợp mẫu số bằng 0 khi tìm tiệm cận đứng.',
      'Tính sai dấu khi nhân chéo công thức đạo hàm hàm bậc nhất trên bậc nhất.',
    ];

    reviewTips = [
      'Vẽ nhanh bảng biến thiên để trực quan hóa hướng đi của đồ thị.',
      'Với bài toán trắc nghiệm, thử các giá trị đặc biệt hoặc dùng máy tính cầm tay để loại trừ phương án sai.',
      'Đọc kỹ đề bài yêu cầu tìm GTLN trên khoảng hay trên đoạn kín.',
    ];
  } else if (subject.includes('văn') || subject.includes('tiếng việt')) {
    coreConcepts = [
      {
        term: 'Thể loại & Ngữ cảnh sáng tác',
        definition: 'Hoàn cảnh lịch sử - xã hội và cảm hứng sáng tạo tác động trực tiếp đến tư tưởng chủ đề của tác phẩm.',
      },
      {
        term: 'Biện pháp tu từ nổi bật',
        definition: 'Ẩn dụ, hoán dụ, điệp từ, tương phản nhằm tăng sức gợi hình, gợi cảm và chiều sâu biểu cảm.',
      },
      {
        term: 'Đặc trưng nhân vật & Hình tượng',
        definition: 'Được thể hiện qua ngoại hình, hành động, ngôn ngữ đối thoại/độc thoại và diễn biến nội tâm.',
      },
    ];

    keyFormulas = [
      {
        name: 'Cấu trúc đoạn văn nghị luận xã hội (200 chữ)',
        formula: 'Giải thích \\to Phân tích/Chứng minh \\to Bàn luận mở rộng \\to Bài học',
        note: 'Dẫn chứng thực tế phải tiêu biểu, xác thực và có tính thuyết phục cao.',
      },
      {
        name: 'Cấu trúc câu hỏi đọc hiểu nhận biết',
        formula: 'Phương thức biểu đạt + Thể thơ + Thao tác lập luận',
        note: 'Trả lời ngắn gọn, trực diện, không lan man.',
      },
    ];

    commonMistakes = [
      'Kể lại tác phẩm thay vì phân tích chi tiết nghệ thuật và dụng ý tác giả.',
      'Viết đoạn văn 200 chữ nhưng xuống dòng thành nhiều đoạn (mất điểm hình thức).',
      'Dẫn chứng nghị luận xã hội quá chung chung hoặc thiếu tính thời sự.',
    ];

    reviewTips = [
      'Gạch chân từ khóa trong câu hỏi đọc hiểu để không bỏ sót lệnh hỏi.',
      'Phân bổ thời gian: 15-20 phút cho Đọc hiểu, 20 phút cho Nghị luận xã hội, thời gian còn lại cho Nghị luận văn học.',
    ];
  } else if (subject.includes('anh')) {
    coreConcepts = [
      {
        term: 'Pronunciation / Stress rules',
        definition: 'Quy tắc phát âm đuôi -ed (/t/, /d/, /ɪd/) và đuôi -s/es (/s/, /z/, /ɪz/); quy tắc trọng âm từ 2 và 3 âm tiết.',
      },
      {
        term: 'Tenses & Verb Forms',
        definition: 'Sự hòa hợp giữa các thì, câu điều kiện loại 1-2-3, câu gián tiếp và cấu trúc câu bị động.',
      },
    ];

    keyFormulas = [
      {
        name: 'Inversion (Đảo ngữ)',
        formula: 'Not only + Aux + S + V ... but also ...',
        note: 'Đảo trợ động từ lên trước chủ ngữ khi từ phủ định đứng đầu câu.',
      },
      {
        name: 'Wish / If only',
        formula: 'S + wish + S + V(quá khứ) / had + V3',
        note: 'Lùi một thì so với thực tế ở hiện tại hoặc quá khứ.',
      },
    ];

    commonMistakes = [
      'Quên không lùi thì khi chuyển sang câu gián tiếp.',
      'Nhầm lẫn giữa mệnh đề quan hệ xác định và không xác định (dùng "that" sau dấu phẩy).',
      'Không đọc kỹ ngữ cảnh bài đọc dẫn đến chọn từ đồng nghĩa nhưng sai sắc thái nghĩa.',
    ];

    reviewTips = [
      'Học thuộc các cụm cố định (Collocations) và giới từ đi kèm tính từ/động từ.',
      'Đọc lướt (Skimming) để nắm ý chính trước khi đọc quét (Scanning) tìm chi tiết trả lời câu hỏi.',
    ];
  } else {
    // General sciences / social
    coreConcepts = [
      {
        term: 'Quy luật bản chất của chủ đề',
        definition: `Mối quan hệ nhân quả và nguyên lý chi phối các hiện tượng trong chủ đề "${topic}".`,
      },
      {
        term: 'Khái niệm & Thuật ngữ chuyên ngành',
        definition: 'Định nghĩa chuẩn mực khoa học theo Chương trình GDPT 2018.',
      },
    ];

    keyFormulas = [
      {
        name: 'Mối quan hệ định lượng',
        formula: 'Đại lượng A tỉ lệ thuận / nghịch với Đại lượng B',
        note: 'Chú ý đơn vị đo chuẩn trong hệ đo lường quốc tế SI.',
      },
    ];

    commonMistakes = [
      'Ghi nhớ máy móc số liệu mà không hiểu bản chất hiện tượng.',
      'Nhầm lẫn giữa nguyên nhân trực tiếp và nguyên nhân sâu xa của sự kiện.',
    ];

    reviewTips = [
      'Vẽ sơ đồ tư duy (Mindmap) để hệ thống hóa kiến thức toàn bài.',
      'Luyện tập trả lời các câu hỏi tình huống thực tế để phát triển năng lực vận dụng.',
    ];
  }

  return {
    topicTitle: topic,
    coreConcepts,
    keyFormulas,
    commonMistakes,
    reviewTips,
  };
}

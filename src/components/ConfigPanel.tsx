import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wand2,
} from 'lucide-react';
import { ExamConfig, GradeLevel, CognitiveSystem } from '../types/exam';
import { extractTextFromFile } from '../utils/fileParser';
import { useToast } from './Toast';

interface ConfigPanelProps {
  config: ExamConfig;
  onChange: (updated: ExamConfig) => void;
  onGenerate: () => void;
  onBuildMatrixOnly: () => void;
  isGenerating: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  onGenerate,
  onBuildMatrixOnly,
  isGenerating,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Grade options based on level
  const gradesByLevel: Record<GradeLevel, string[]> = {
    primary: ['1', '2', '3', '4', '5'],
    secondary: ['6', '7', '8', '9'],
    high: ['10', '11', '12'],
  };

  const handleLevelChange = (newLevel: GradeLevel) => {
    const defaultGrade = gradesByLevel[newLevel][0];
    const newCognitiveSystem: CognitiveSystem = newLevel === 'primary' ? 'primary_3' : 'secondary_3';

    let defaultDist: Record<string, number> = {};
    if (newLevel === 'primary') {
      defaultDist = { 'Mức 1': 40, 'Mức 2': 40, 'Mức 3': 20 };
    } else {
      defaultDist = { Biết: 40, Hiểu: 30, 'Vận dụng': 30 };
    }

    // Default subjects
    let defaultSubject = 'Toán học';
    if (newLevel === 'primary') defaultSubject = 'Toán';

    onChange({
      ...config,
      gradeLevel: newLevel,
      grade: defaultGrade,
      subject: defaultSubject,
      cognitiveSystem: newCognitiveSystem,
      cognitiveDist: defaultDist,
    });
    toast.info(`Đã chuyển sang cấp: ${newLevel === 'primary' ? 'Tiểu học' : newLevel === 'secondary' ? 'THCS' : 'THPT'}`);
  };

  const handleCognitiveSystemToggle = (system: CognitiveSystem) => {
    let defaultDist: Record<string, number> = {};
    if (system === 'secondary_3') {
      defaultDist = { Biết: 40, Hiểu: 30, 'Vận dụng': 30 };
    } else if (system === 'secondary_4') {
      defaultDist = { 'Nhận biết': 40, 'Thông hiểu': 30, 'Vận dụng': 20, 'Vận dụng cao': 10 };
    } else {
      defaultDist = { 'Mức 1': 40, 'Mức 2': 40, 'Mức 3': 20 };
    }

    onChange({
      ...config,
      cognitiveSystem: system,
      cognitiveDist: defaultDist,
    });
    toast.info(`Đã chuyển sang hệ đánh giá: ${system === 'secondary_4' ? '4 Mức (NB-TH-VD-VDC)' : '3 Mức (CV 7991)'}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newDocs = [...(config.uploadedDocs || [])];
    let countSuccess = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractTextFromFile(file);
        newDocs.push({
          name: file.name,
          content: text,
          size: file.size,
        });
        countSuccess++;
      } catch (err) {
        console.error('File parsing error', err);
        toast.error(`Không thể đọc file: ${file.name}`);
      }
    }

    onChange({
      ...config,
      uploadedDocs: newDocs,
    });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (countSuccess > 0) {
      toast.success(`Đã trích xuất thành công ${countSuccess} tài liệu tham chiếu!`);
    }
  };

  const removeDoc = (idx: number) => {
    const docName = config.uploadedDocs[idx]?.name || 'Tài liệu';
    const newDocs = config.uploadedDocs.filter((_, i) => i !== idx);
    onChange({ ...config, uploadedDocs: newDocs });
    toast.info(`Đã gỡ bỏ: ${docName}`);
  };

  // Section Counts calculation
  const totalQuestions =
    (config.sectionCounts.part1 || 0) +
    (config.sectionCounts.part2 || 0) +
    (config.sectionCounts.part3 || 0) +
    (config.sectionCounts.part4 || 0);

  // Total prompt commands: Part 2 has 4 sub-items per question
  const totalCommands =
    (config.sectionCounts.part1 || 0) +
    (config.sectionCounts.part2 || 0) * 4 +
    (config.sectionCounts.part3 || 0) +
    (config.sectionCounts.part4 || 0);

  // Cognitive % verification
  const totalPercent = Object.values(config.cognitiveDist).reduce((sum, val) => sum + (val || 0), 0);
  const isPercentValid = config.distMode === 'count' || totalPercent === 100;

  // Auto-balance cognitive distribution to exactly 100%
  const handleAutoBalanceCognitive = () => {
    const keys = Object.keys(config.cognitiveDist);
    if (keys.length === 0) return;

    let newDist: Record<string, number> = {};
    if (config.gradeLevel === 'primary' || config.cognitiveSystem === 'primary_3') {
      newDist = { 'Mức 1': 40, 'Mức 2': 40, 'Mức 3': 20 };
    } else if (config.cognitiveSystem === 'secondary_3') {
      newDist = { Biết: 40, Hiểu: 30, 'Vận dụng': 30 };
    } else {
      newDist = { 'Nhận biết': 40, 'Thông hiểu': 30, 'Vận dụng': 20, 'Vận dụng cao': 10 };
    }

    onChange({
      ...config,
      cognitiveDist: newDist,
    });
    toast.success('Đã tự động cân bằng tỷ lệ nhận thức về 100% chuẩn Bộ GD&ĐT!');
  };

  const subjectOptions = [
    'Toán học',
    'Ngữ văn',
    'Tiếng Anh',
    'Khoa học tự nhiên',
    'Lịch sử & Địa lý',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lý',
    'Tin học',
    'Giáo dục công dân',
    'Giáo dục Kinh tế & Pháp luật',
    'Công nghệ',
    'Tiếng Việt',
    'Tự nhiên & Xã hội',
    'Đạo đức',
  ];

  const applyPreset = (presetType: 'thpt_2025' | 'thcs_70_30' | 'primary_tt27' | 'quick_15' | 'traditional_45') => {
    if (presetType === 'thpt_2025') {
      onChange({
        ...config,
        gradeLevel: 'high',
        grade: '12',
        durationMinutes: 90,
        sectionCounts: { part1: 12, part2: 4, part3: 6, part4: 0 },
        cognitiveSystem: 'secondary_4',
        cognitiveDist: { 'Nhận biết': 40, 'Thông hiểu': 30, 'Vận dụng': 20, 'Vận dụng cao': 10 },
        gradingRuleTF: 'stepped',
        totalScore: 10,
      });
      toast.success('Đã nạp mẫu: THPT Chuẩn 2025 (12 Trắc nghiệm 4 lựa chọn, 4 Đúng/Sai, 6 Trả lời ngắn, 90 phút)');
    } else if (presetType === 'thcs_70_30') {
      onChange({
        ...config,
        gradeLevel: 'secondary',
        grade: '8',
        durationMinutes: 60,
        sectionCounts: { part1: 16, part2: 2, part3: 0, part4: 2 },
        cognitiveSystem: 'secondary_3',
        cognitiveDist: { Biết: 40, Hiểu: 30, 'Vận dụng': 30 },
        totalScore: 10,
      });
      toast.success('Đã nạp mẫu: THCS 70% Trắc nghiệm (16 câu Phần I, 2 câu Phần II) & 30% Tự luận (2 câu)');
    } else if (presetType === 'primary_tt27') {
      onChange({
        ...config,
        gradeLevel: 'primary',
        grade: '4',
        subject: 'Toán',
        durationMinutes: 40,
        sectionCounts: { part1: 8, part2: 2, part3: 0, part4: 2 },
        cognitiveSystem: 'primary_3',
        cognitiveDist: { 'Mức 1': 40, 'Mức 2': 40, 'Mức 3': 20 },
        totalScore: 10,
      });
      toast.success('Đã nạp mẫu: Tiểu học Thông tư 27 (3 Mức độ đánh giá, 40 phút)');
    } else if (presetType === 'quick_15') {
      onChange({
        ...config,
        examType: 'Kiểm tra 15 phút',
        examTitle: 'ĐỀ KIỂM TRA 15 PHÚT',
        durationMinutes: 15,
        sectionCounts: { part1: 10, part2: 0, part3: 0, part4: 0 },
        totalScore: 10,
      });
      toast.success('Đã nạp mẫu: Kiểm tra 15 phút (10 câu trắc nghiệm nhanh)');
    } else if (presetType === 'traditional_45') {
      onChange({
        ...config,
        examType: 'Kiểm tra 45 phút (1 tiết)',
        examTitle: 'ĐỀ KIỂM TRA 1 TIẾT (45 PHÚT)',
        durationMinutes: 45,
        sectionCounts: { part1: 20, part2: 0, part3: 0, part4: 2 },
        totalScore: 10,
      });
      toast.success('Đã nạp mẫu: Kiểm tra 1 tiết (20 câu TN + 2 câu Tự luận, 45 phút)');
    }
  };

  const handleGenerateClick = () => {
    if (isGenerating) return;

    if (!isPercentValid) {
      // Auto balance and notify
      handleAutoBalanceCognitive();
    }
    onGenerate();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
      {/* 1-Click Presets Bar */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2">
        <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs uppercase tracking-wide">
          <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
          <span>Nạp nhanh Cấu trúc Mẫu Chuẩn Bộ GD&ĐT (1-Click Preset):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('thpt_2025')}
            className="px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-600 hover:text-white text-blue-800 text-[11px] font-bold shadow-2xs transition"
          >
            🏛️ THPT Chuẩn 2025 (12-4-6)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('thcs_70_30')}
            className="px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-600 hover:text-white text-blue-800 text-[11px] font-bold shadow-2xs transition"
          >
            🏫 THCS (70% TN - 30% TL)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('primary_tt27')}
            className="px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-600 hover:text-white text-blue-800 text-[11px] font-bold shadow-2xs transition"
          >
            🎒 Tiểu học (TT 27: 3 Mức)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('quick_15')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-700 hover:text-white text-slate-700 text-[11px] font-medium shadow-2xs transition"
          >
            ⚡ 15 Phút (10 câu)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('traditional_45')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-700 hover:text-white text-slate-700 text-[11px] font-medium shadow-2xs transition"
          >
            📝 1 Tiết (45 phút)
          </button>
        </div>
      </div>

      {/* Step 1: Chọn Cấp học */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            1
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Chọn Cấp Học</h2>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { id: 'primary', label: 'Tiểu học', sub: 'Lớp 1 – 5 (TT 27)', icon: '🎒' },
            { id: 'secondary', label: 'THCS', sub: 'Lớp 6 – 9 (GDPT 2018)', icon: '🏫' },
            { id: 'high', label: 'THPT', sub: 'Lớp 10 – 12 (Định dạng 2025)', icon: '🏛️' },
          ].map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => handleLevelChange(lvl.id as GradeLevel)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                config.gradeLevel === lvl.id
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-2 ring-blue-500/20 font-bold'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <span className="text-xl sm:text-2xl mb-1">{lvl.icon}</span>
              <span className="text-xs sm:text-sm font-bold">{lvl.label}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">{lvl.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 & 3: Lớp, Môn học & Bộ sách */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            2
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Khối Lớp, Môn Học & Bộ Sách
          </h2>
        </div>

        <div className="space-y-3">
          {/* Chọn Lớp */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chọn lớp:</label>
            <div className="flex flex-wrap gap-1.5">
              {gradesByLevel[config.gradeLevel].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChange({ ...config, grade: g })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    config.grade === g
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Môn & Nhập môn khác */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Môn học:</label>
              <select
                value={config.subject}
                onChange={(e) => onChange({ ...config, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
              >
                {subjectOptions.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Hoặc nhập tên môn / chuyên đề khác:
              </label>
              <input
                type="text"
                placeholder="VD: Toán Olympic, Stem..."
                value={config.customSubject || ''}
                onChange={(e) => onChange({ ...config, customSubject: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Chọn Bộ sách giáo khoa */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bộ sách giáo khoa:</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'Kết nối tri thức với cuộc sống',
                'Chân trời sáng tạo',
                'Cánh Diều',
                'Chung chương trình GDPT 2018',
              ].map((book) => (
                <button
                  key={book}
                  type="button"
                  onClick={() => onChange({ ...config, textbook: book })}
                  className={`p-2 rounded-lg border text-left text-[11px] transition ${
                    config.textbook === book
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {book}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Nội dung kiến thức & Yêu cầu cần đạt */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            3
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Nội Dung Bài Học & Yêu Cầu Cần Đạt
          </h2>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tên bài / Chủ đề:</label>
              <input
                type="text"
                value={config.topicTitle}
                onChange={(e) => onChange({ ...config, topicTitle: e.target.value })}
                placeholder="VD: Khảo sát hàm số, Sóng cơ học..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chương / Phạm vi:</label>
              <input
                type="text"
                value={config.chapter}
                onChange={(e) => onChange({ ...config, chapter: e.target.value })}
                placeholder="VD: Chương I, Giữa học kỳ 1..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Yêu cầu cần đạt / Mục tiêu đánh giá:
            </label>
            <input
              type="text"
              value={config.learningOutcomes}
              onChange={(e) => onChange({ ...config, learningOutcomes: e.target.value })}
              placeholder="VD: Nhận biết cực trị, tính được giới hạn, giải quyết bài toán tối ưu..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Dán nội dung bài học hoặc ngữ liệu đọc hiểu:
            </label>
            <textarea
              rows={3}
              value={config.readingPassage}
              onChange={(e) => onChange({ ...config, readingPassage: e.target.value })}
              placeholder="Dán văn bản đoạn trích thơ, văn xuôi, đoạn thông tin khoa học hoặc dữ kiện thực tế để làm ngữ liệu ra đề chùm..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-sans leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Step 5: Tài liệu tham chiếu & Upload File thực tế */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            4
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Tài Liệu Tham Chiếu (Đọc PDF / DOCX / TXT)
          </h2>
        </div>

        <div className="space-y-3">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 rounded-xl p-4 text-center cursor-pointer transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="mx-auto h-6 w-6 text-blue-600 mb-1" />
            <p className="text-xs font-bold text-blue-900">
              {uploading ? 'Đang trích xuất nội dung file...' : 'Tải lên SGK, Đề cương, Giáo án (PDF, DOCX, TXT)'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Hệ thống đọc trực tiếp trên trình duyệt, bảo mật 100%
            </p>
          </div>

          {/* Uploaded Files List */}
          {config.uploadedDocs?.length > 0 && (
            <div className="space-y-1.5">
              {config.uploadedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate font-medium text-slate-700">{doc.name}</span>
                    <span className="text-[10px] text-slate-400">({Math.round(doc.size / 1024)} KB)</span>
                  </div>
                  <button
                    onClick={() => removeDoc(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Nguồn kiến thức */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-semibold text-slate-500">Nguyên tắc nguồn kiến thức:</label>
            <div className="space-y-1 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="sourceOption"
                  checked={config.sourceOption === 'doc_only'}
                  onChange={() => onChange({ ...config, sourceOption: 'doc_only' })}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Chỉ sử dụng tài liệu tải lên (Tuyệt đối không bịa dữ kiện ngoài)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="sourceOption"
                  checked={config.sourceOption === 'doc_plus_standard'}
                  onChange={() => onChange({ ...config, sourceOption: 'doc_plus_standard' })}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Kết hợp tài liệu tải lên + Kiến thức chuẩn GDPT 2018</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="sourceOption"
                  checked={config.sourceOption === 'teacher_prompt'}
                  onChange={() => onChange({ ...config, sourceOption: 'teacher_prompt' })}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Giáo viên tự nhập nội dung / chủ đề tự do</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Step 6: Loại đề & Thời gian làm bài */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            5
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Loại Đề & Thời Gian</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loại kiểm tra:</label>
            <select
              value={config.examType}
              onChange={(e) => onChange({ ...config, examType: e.target.value, examTitle: `ĐỀ ${e.target.value.toUpperCase()}` })}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium"
            >
              <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên</option>
              <option value="Kiểm tra 15 phút">Kiểm tra 15 phút</option>
              <option value="Kiểm tra 45 phút (1 tiết)">Kiểm tra 45 phút (1 tiết)</option>
              <option value="Kiểm tra giữa học kỳ">Kiểm tra giữa học kỳ</option>
              <option value="Kiểm tra cuối học kỳ">Kiểm tra cuối học kỳ</option>
              <option value="Đề ôn tập">Đề ôn tập</option>
              <option value="Đề luyện tập">Đề luyện tập</option>
              <option value="Khảo sát chất lượng">Khảo sát chất lượng</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Thời gian làm bài:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="5"
                max="180"
                value={config.durationMinutes}
                onChange={(e) => onChange({ ...config, durationMinutes: parseInt(e.target.value, 10) || 45 })}
                className="w-20 rounded-lg border border-slate-300 p-2 text-xs font-bold text-center"
              />
              <span className="text-xs text-slate-600">phút</span>
              <div className="flex space-x-1">
                {[15, 45, 60, 90].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ ...config, durationMinutes: t })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                  >
                    {t}'
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 7: Cấu trúc số lượng câu hỏi */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              6
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Cấu Trúc Đề (Cấu trúc mới 2025)
            </h2>
          </div>
          <div className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
            Tổng: {totalQuestions} câu • {totalCommands} lệnh hỏi
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {/* Phần I */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">Phần I: TN nhiều lựa chọn</span>
              <p className="text-[10px] text-slate-500">4 phương án A, B, C, D (chọn 1)</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="40"
                value={config.sectionCounts.part1}
                onChange={(e) =>
                  onChange({
                    ...config,
                    sectionCounts: { ...config.sectionCounts, part1: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-16 rounded-md border border-slate-300 p-1.5 text-center font-bold"
              />
              <span className="text-slate-500">câu</span>
            </div>
          </div>

          {/* Phần II */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">Phần II: TN Đúng/Sai 2025</span>
              <p className="text-[10px] text-slate-500">Mỗi câu gồm 4 ý a, b, c, d (4 lệnh hỏi)</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="10"
                value={config.sectionCounts.part2}
                onChange={(e) =>
                  onChange({
                    ...config,
                    sectionCounts: { ...config.sectionCounts, part2: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-16 rounded-md border border-slate-300 p-1.5 text-center font-bold"
              />
              <span className="text-slate-500">câu</span>
            </div>
          </div>

          {/* Phần III */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">Phần III: TN Trả lời ngắn</span>
              <p className="text-[10px] text-slate-500">Học sinh tính toán và điền đáp số ngắn</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="20"
                value={config.sectionCounts.part3}
                onChange={(e) =>
                  onChange({
                    ...config,
                    sectionCounts: { ...config.sectionCounts, part3: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-16 rounded-md border border-slate-300 p-1.5 text-center font-bold"
              />
              <span className="text-slate-500">câu</span>
            </div>
          </div>

          {/* Phần IV */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">Phần IV: Câu hỏi Tự luận</span>
              <p className="text-[10px] text-slate-500">Giải bài tập, giải thích, viết đoạn văn...</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="10"
                value={config.sectionCounts.part4}
                onChange={(e) =>
                  onChange({
                    ...config,
                    sectionCounts: { ...config.sectionCounts, part4: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-16 rounded-md border border-slate-300 p-1.5 text-center font-bold"
              />
              <span className="text-slate-500">câu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 8: Thiết lập Mức độ nhận thức */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              7
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mức Độ Nhận Thức</h2>
          </div>

          {/* Toggle System for THCS / THPT */}
          {config.gradeLevel !== 'primary' && (
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px]">
              <button
                type="button"
                onClick={() => handleCognitiveSystemToggle('secondary_3')}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  config.cognitiveSystem === 'secondary_3' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Hệ 3 Mức (CV 7991)
              </button>
              <button
                type="button"
                onClick={() => handleCognitiveSystemToggle('secondary_4')}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  config.cognitiveSystem === 'secondary_4' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Hệ 4 Mức (NB-TH-VD-VDC)
              </button>
            </div>
          )}
        </div>

        {/* Cognitive Percent Inputs */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
          {Object.entries(config.cognitiveDist).map(([lvl, val]) => (
            <div key={lvl} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="block font-bold text-slate-700 truncate">{lvl}</span>
              <div className="mt-1 flex items-center justify-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={val}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      cognitiveDist: { ...config.cognitiveDist, [lvl]: parseInt(e.target.value, 10) || 0 },
                    })
                  }
                  className="w-12 rounded border border-slate-300 p-1 text-center font-bold"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Percent Warning */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs">
          <span className="text-slate-500">
            Tổng tỷ lệ: <strong className={isPercentValid ? 'text-emerald-700' : 'text-rose-600 font-bold'}>{totalPercent}%</strong>
          </span>
          {!isPercentValid && (
            <div className="flex items-center space-x-2">
              <span className="text-rose-600 font-bold flex items-center space-x-1 text-[11px]">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Chưa đủ 100%</span>
              </span>
              <button
                type="button"
                onClick={handleAutoBalanceCognitive}
                className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-lg flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                title="Tự động chia lại tỷ lệ thành 100% chuẩn GDPT"
              >
                <Wand2 className="h-3 w-3" />
                <span>Cân bằng 100%</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Toggle */}
      <div className="border-t pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between py-1 text-xs font-bold text-slate-600 hover:text-blue-700"
        >
          <span>⚙️ Cài đặt nâng cao (Thang điểm, Đảo đề, Giữ câu hỏi GV)</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs animate-in fade-in duration-150">
            {/* Thang điểm & Quy tắc */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Thang điểm:</label>
                <select
                  value={config.totalScore}
                  onChange={(e) => onChange({ ...config, totalScore: parseInt(e.target.value, 10) || 10 })}
                  className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs font-bold"
                >
                  <option value={10}>Thang 10 điểm (Chuẩn)</option>
                  <option value={20}>Thang 20 điểm</option>
                  <option value={100}>Thang 100 điểm</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Quy tắc chấm Đúng/Sai 4 ý:
                </label>
                <select
                  value={config.gradingRuleTF}
                  onChange={(e) => onChange({ ...config, gradingRuleTF: e.target.value as 'stepped' | 'equal' })}
                  className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs font-medium"
                >
                  <option value="stepped">Lũy tiến Bộ GD&ĐT (0.1 - 0.25 - 0.5 - 1.0)</option>
                  <option value="equal">Chia đều (0.25 điểm / mỗi ý)</option>
                </select>
              </div>
            </div>

            {/* Số mã đề */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Số lượng mã đề cần tạo tự động:
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => onChange({ ...config, testCodesCount: cnt as 1 | 2 | 3 | 4 })}
                    className={`flex-1 py-1 rounded border text-xs font-bold ${
                      config.testCodesCount === cnt
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cnt} mã ({cnt === 1 ? '101' : cnt === 2 ? '101, 102' : cnt === 3 ? '101-103' : '101-104'})
                  </button>
                ))}
              </div>
            </div>

            {/* Giữ câu hỏi GV */}
            <div className="pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.keepFixedQuestions}
                  onChange={(e) => onChange({ ...config, keepFixedQuestions: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-800">
                  Bật chế độ: Giữ nguyên các câu hỏi giáo viên tự nhập / đã ghim
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 hover:from-blue-800 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer active:scale-99"
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span>{isGenerating ? 'ĐANG TẠO ĐỀ KIỂM TRA...' : '✨ TẠO ĐỀ KIỂM TRA CHUẨN'}</span>
        </button>

        <button
          type="button"
          onClick={onBuildMatrixOnly}
          className="w-full py-3 px-3.5 rounded-xl border-2 border-blue-200 bg-blue-50/70 hover:bg-blue-100 hover:border-blue-400 text-blue-900 text-xs sm:text-sm font-extrabold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-98"
          title="Xem trước khung Ma trận 2 chiều và Bản đặc tả kỹ thuật theo cấu hình hiện tại trước khi tạo câu hỏi"
        >
          <FileCheck2 className="h-4.5 w-4.5 text-blue-700 shrink-0" />
          <span>📊 XEM MA TRẬN & BẢN ĐẶC TẢ TRƯỚC</span>
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;

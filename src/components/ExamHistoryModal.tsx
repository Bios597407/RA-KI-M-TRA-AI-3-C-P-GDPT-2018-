import React from 'react';
import { X, History, RotateCcw, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { ExamHistoryItem } from '../types/exam';

interface ExamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExamHistoryItem[];
  onRestore: (item: ExamHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
}

export const ExamHistoryModal: React.FC<ExamHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRestore,
  onDeleteHistoryItem,
  onClearAllHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-lg">Lịch Sử Các Đề Kiểm Tra Đã Tạo</h3>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  {history.length} đề
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu tự động trong bộ nhớ trình duyệt, mở lại đề bất kỳ lúc nào để in hoặc chỉnh sửa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Chưa có lịch sử đề nào được lưu.</p>
              <p className="text-xs text-slate-400 mt-1">
                Mỗi khi thầy cô bấm "✨ TẠO ĐỀ KIỂM TRA", đề mới sẽ tự động được lưu vào đây.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {item.gradeLevel === 'primary' ? 'Tiểu học' : item.gradeLevel === 'secondary' ? 'THCS' : 'THPT'} – Lớp {item.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{item.subject}</span>
                    <span className="text-[11px] text-slate-500">({item.totalQuestions} câu • {item.totalScore}đ)</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.examTitle}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>{item.dateStr}</span>
                    <span>•</span>
                    <span className="truncate max-w-[240px]">Chủ đề: {item.config.topicTitle || 'Kiến thức trọng tâm'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                  <button
                    onClick={() => {
                      onRestore(item);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Mở đề này</span>
                  </button>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Xóa đề này khỏi lịch sử"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          {history.length > 0 ? (
            <button
              onClick={() => {
                if (confirm('Xóa toàn bộ lịch sử các đề đã tạo?')) {
                  onClearAllHistory();
                }
              }}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Xóa sạch lịch sử
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamHistoryModal;

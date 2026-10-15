import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { QAReport } from '../types/exam';

interface AutoQAModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: QAReport | null;
}

export const AutoQAModal: React.FC<AutoQAModalProps> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${report.passedAll ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  Báo cáo Kiểm tra Chất lượng Đề (Auto-QA)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  report.passedAll ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  Đạt {report.score}/100 điểm
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Đối chiếu 12 tiêu chuẩn khảo thí chuẩn Bộ GD&ĐT & Chương trình GDPT 2018
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

        {/* List of 12 items */}
        <div className="overflow-y-auto p-6 space-y-3">
          {report.items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.passed
                  ? 'border-emerald-100 bg-emerald-50/60 text-emerald-950'
                  : item.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                  : 'border-rose-200 bg-rose-50/70 text-rose-950'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 shrink-0">
                  {item.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : item.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide">
                      Tiêu chí {item.id}: {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.passed ? 'ĐẠT CHUẨN' : item.severity === 'warning' ? 'CẦN CHÚ Ý' : 'CHƯA ĐẠT'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed">{item.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-slate-500">
            Hệ thống tự động rà soát trước khi xuất bản file Word và in ấn.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Đóng báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoQAModal;

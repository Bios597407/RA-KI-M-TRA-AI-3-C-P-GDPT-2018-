import React from 'react';
import { Sparkles, Key, Download, Database, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenApiKey: () => void;
  onOpenQuestionBank: () => void;
  onResetDefaults: () => void;
  onDownloadStandalone: () => void;
  savedBankCount: number;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKey,
  onOpenQuestionBank,
  onResetDefaults,
  onDownloadStandalone,
  savedBankCount,
  hasApiKey,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-md">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                RA ĐỀ KIỂM TRA AI – 3 CẤP
              </h1>
              <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 md:inline-block">
                GDPT 2018
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tiểu học • THCS • THPT — Mọi môn học, Ma trận, Bản đặc tả & Đảo đề 2025
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Bank */}
          <button
            onClick={onOpenQuestionBank}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            title="Ngân hàng câu hỏi cá nhân"
          >
            <Database className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ngân hàng</span>
            <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
              {savedBankCount}
            </span>
          </button>

          {/* Standalone HTML */}
          <button
            onClick={onDownloadStandalone}
            className="flex items-center space-x-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            title="Tải về file HTML độc lập chạy offline không cần mạng"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden md:inline">Bản Offline</span>
          </button>

          {/* Gemini API Key */}
          <button
            onClick={onOpenApiKey}
            className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              hasApiKey
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>{hasApiKey ? 'Gemini AI: Đã kết nối' : 'Cấu hình API Key'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={onResetDefaults}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="Khôi phục cấu hình mặc định"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

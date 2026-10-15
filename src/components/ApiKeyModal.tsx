import React, { useState } from 'react';
import { Key, CheckCircle2, AlertCircle, X, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const toast = useToast();
  const [inputKey, setInputKey] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, msg: 'Vui lòng nhập API Key trước khi kiểm tra.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${inputKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Trả về chuỗi: OK' }] }],
        }),
      });

      if (res.ok) {
        setTestResult({
          success: true,
          msg: 'Kết nối thành công tới Gemini 2.5 Flash! Bạn đã sẵn sàng tạo đề thông minh 100%.',
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          msg: `Kết nối thất bại (${res.status}): ${errData.error?.message || 'Key không hợp lệ hoặc hết quota.'}`,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        msg: `Lỗi kết nối mạng: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    toast.success('Đã lưu cấu hình Gemini API Key!');
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setTestResult(null);
    toast.info('Đã xóa API Key, chuyển sang chế độ Smart Fallback Generator.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Cấu hình Gemini API Key</h3>
              <p className="text-xs text-slate-500">Google Generative Language API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Key được lưu trữ an toàn trong trình duyệt của bạn (LocalStorage) và không bao giờ gửi ra ngoài.
            </p>
          </div>

          <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center font-semibold text-blue-800 space-x-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Chế độ tự động thông minh:</span>
            </div>
            <p>
              • Nếu bạn đã nhập Key: Ứng dụng gọi trực tiếp <strong>Gemini 2.5 Flash</strong> để sinh đề thực tế 100% bám sát mọi bài học & tài liệu tải lên.
            </p>
            <p>
              • Nếu chưa nhập Key: Hệ thống tự động kích hoạt <strong>Smart Fallback Generator</strong> với cơ sở dữ liệu phong phú, vẫn tạo đầy đủ Ma trận, Bản đặc tả và đề chuẩn số lượng câu.
            </p>
          </div>

          {testResult && (
            <div
              className={`rounded-lg p-3 text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{testResult.msg}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
            </button>

            <div className="flex items-center space-x-2">
              {inputKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-rose-600"
                >
                  Xóa Key
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;

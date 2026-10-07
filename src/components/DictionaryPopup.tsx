import React from 'react';
import { X, Loader2 } from 'lucide-react';
import type { DictionaryEntry } from '../services/dictionaryService';

interface DictionaryPopupProps {
  entry: DictionaryEntry | null;
  loading: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export const DictionaryPopup: React.FC<DictionaryPopupProps> = ({ entry, loading, position, onClose }) => {
  if (!position) return null;

  // Tính toán vị trí hiển thị hợp lý để không bị tràn màn hình
  const left = Math.min(position.x, window.innerWidth - 340);
  const top = position.y > window.innerHeight / 2 ? position.y - 180 : position.y + 20;

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-krones-blue/20 p-4 w-80 animate-in fade-in zoom-in duration-200"
      style={{ left, top }}
    >
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X size={18} />
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-24 gap-3 text-krones-blue">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-medium">Đang dùng AI tra cứu...</span>
        </div>
      ) : entry ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between pe-4">
            <h4 className="font-bold text-lg text-[#003366] capitalize">{entry.word}</h4>
          </div>
          <div className="inline-flex w-fit items-center px-2 py-1 bg-[#0066B2]/10 text-[#0066B2] text-xs font-semibold rounded border border-[#0066B2]/20">
            [ {entry.english} ]
          </div>
          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
            <span className="font-semibold text-krones-navy">Ý nghĩa:</span> {entry.meaning}
          </div>
          <div className="text-sm text-gray-600 italic border-l-2 border-[#0066B2] pl-2">
            "{entry.example}"
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4 text-sm">
          Không tìm thấy kết quả hoặc lỗi mạng.
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { X, Loader2, BookmarkPlus, Library } from 'lucide-react';
import type { DictionaryEntry } from '../services/dictionaryService';
import { parseMeaning } from '../services/dictionaryService';

interface DictionaryPopupProps {
  wordSearched?: string;
  entry: DictionaryEntry | null;
  loading: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onSaveToLookup?: (word: string) => void;
  onSaveToDictionary?: (entry: DictionaryEntry) => void;
}

export const DictionaryPopup: React.FC<DictionaryPopupProps> = ({ wordSearched, entry, loading, position, onClose, onSaveToLookup, onSaveToDictionary }) => {
  if (!position) return null;

  // Tính toán vị trí hiển thị hợp lý để không bị tràn màn hình
  const left = Math.min(position.x, window.innerWidth - 340);
  const top = position.y > window.innerHeight / 2 ? position.y - 180 : position.y + 20;

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-krones-blue/20 p-4 w-80 max-h-[70vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
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
        <div className="flex flex-col gap-3 pt-2">
          <h4 className="font-bold text-lg text-[#003366] capitalize">{entry.word}</h4>
          
          <div className="flex flex-col gap-1">
            {(() => {
              const { etymology, context } = parseMeaning(entry.meaning);
              if (context) {
                return (
                  <>
                    <div className="text-sm font-medium text-krones-blue">{context}</div>
                    <div className="text-xs text-gray-500 italic border-t pt-1 mt-1 border-gray-100">{etymology}</div>
                  </>
                );
              }
              return <div className="text-sm font-medium text-gray-700">{entry.meaning}</div>;
            })()}
          </div>
          
          <div className="text-sm text-gray-600 italic">
            - {entry.example}
          </div>

          <div className="inline-flex w-fit items-center px-2 py-1 bg-[#0066B2]/10 text-[#0066B2] text-xs font-semibold rounded border border-[#0066B2]/20">
            [ {entry.english} ]
          </div>
          
          {onSaveToDictionary && (
            <button 
              onClick={() => onSaveToDictionary(entry)}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white text-sm py-2 rounded-lg transition-colors"
            >
              <Library size={16} /> Lưu vào Tự điển
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          <div className="text-center text-gray-500 text-sm">
            Không tìm thấy kết quả hoặc lỗi mạng.
          </div>
          {wordSearched && onSaveToLookup && (
            <button 
              onClick={() => onSaveToLookup(wordSearched)}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-lg transition-colors"
            >
              <BookmarkPlus size={16} /> Lưu vào mục Tra cứu
            </button>
          )}
        </div>
      )}
    </div>
  );
};

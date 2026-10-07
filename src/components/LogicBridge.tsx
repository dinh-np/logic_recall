import React, { useState, useEffect } from 'react';
import { BookOpen, Calculator, BrainCircuit } from 'lucide-react';

export interface HanViet {
  word: string;
  root_meaning: string;
  logical_anchor: string;
}

export interface Formula {
  formula: string;
  description: string;
}

export interface LessonData {
  han_viet_dictionary: HanViet[];
  formula_summary: Formula[];
  keywords_level_1: string[];
  keywords_level_2: string[];
}

interface LogicBridgeProps {
  originalText: string;
  data: LessonData;
  initialMode?: 'manual' | 'ai';
}

export const LogicBridge: React.FC<LogicBridgeProps> = ({ originalText, data, initialMode = 'ai' }) => {
  const [level, setLevel] = useState<number>(0);
  const [mode, setMode] = useState<'manual' | 'ai'>(initialMode);
  const [hiddenWords, setHiddenWords] = useState<Set<number>>(new Set());
  const [peekWords, setPeekWords] = useState<Set<number>>(new Set());
  const [peekCount, setPeekCount] = useState(0);

  // Phân tách từ, dấu câu, khoảng trắng
  const words: string[] = originalText.match(/([\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]+|\s+)/gu) || [];

  useEffect(() => {
    if (mode === 'ai') {
      const newHidden = new Set<number>();
      const l1 = new Set(data.keywords_level_1.map(w => w.toLowerCase()));
      const l2 = new Set(data.keywords_level_2.map(w => w.toLowerCase()));

      words.forEach((w, i) => {
        const cleanWord = w.trim().toLowerCase();
        if (level >= 1 && l1.has(cleanWord)) newHidden.add(i);
        if (level >= 2 && l2.has(cleanWord)) newHidden.add(i);
        if (level === 3 && /\w/u.test(w)) newHidden.add(i);
      });
      setHiddenWords(newHidden);
    } else {
      setHiddenWords(new Set());
    }
  }, [level, mode, data]);

  const toggleWord = (index: number, word: string) => {
    if (!/\w/u.test(word)) return;
    
    if (mode === 'manual') {
      const next = new Set(hiddenWords);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      setHiddenWords(next);
    } else {
      if (hiddenWords.has(index) && !peekWords.has(index)) {
        setPeekCount(c => c + 1);
        const next = new Set(peekWords);
        next.add(index);
        setPeekWords(next);
        setTimeout(() => {
          setPeekWords(prev => {
            const p = new Set(prev);
            p.delete(index);
            return p;
          });
        }, 1500);
      }
    }
  };

  const renderWord = (word: string, index: number) => {
    const isWord = /\w/u.test(word);
    if (!isWord) return <span key={index}>{word}</span>;

    const isHidden = hiddenWords.has(index);
    const isPeeked = peekWords.has(index);

    if (isHidden && !isPeeked) {
      let hint = "......";
      if (level === 2 && data.keywords_level_2.some(kw => kw.toLowerCase() === word.trim().toLowerCase())) {
        hint = word.charAt(0) + "......";
      }

      return (
        <span 
          key={index} 
          onClick={() => toggleWord(index, word)}
          className="inline-block bg-krones-ice text-transparent border-b-2 border-krones-blue cursor-pointer px-1 mx-1 rounded select-none relative transition-all"
          title="Chạm để xem gợi ý"
        >
          <span className="text-krones-blue font-bold opacity-70 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">{hint}</span>
          <span className="opacity-0">{word}</span>
        </span>
      );
    }

    return (
      <span 
        key={index} 
        onClick={() => toggleWord(index, word)}
        className={`cursor-pointer transition-colors duration-300 ${mode === 'manual' ? 'hover:bg-krones-ice rounded px-1' : ''} ${isPeeked ? 'bg-yellow-200 text-yellow-900 font-medium rounded px-1' : ''}`}
      >
        {word}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-4xl mx-auto">
      
      {/* 1. Hán Việt Dictionary */}
      {data.han_viet_dictionary && data.han_viet_dictionary.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-krones-ice shadow-sm">
          <h3 className="text-xl font-bold text-krones-navy mb-4 flex items-center gap-2">
            <BookOpen className="text-krones-blue" />
            Từ điển Hán - Việt
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {data.han_viet_dictionary.map((hv, idx) => (
              <div key={idx} className="p-4 bg-krones-bg rounded-lg border-l-4 border-krones-blue hover:shadow-md transition-shadow">
                <div className="font-bold text-lg text-krones-navy mb-1">{hv.word}</div>
                <div className="text-sm font-medium text-krones-blue mb-2">{hv.root_meaning}</div>
                <div className="text-sm text-gray-600 italic">"{hv.logical_anchor}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Formula Summary */}
      {data.formula_summary && data.formula_summary.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-krones-ice shadow-sm">
          <h3 className="text-xl font-bold text-krones-navy mb-4 flex items-center gap-2">
            <Calculator className="text-krones-blue" />
            Hệ thống Công thức
          </h3>
          <div className="space-y-3">
            {data.formula_summary.map((f, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-krones-bg rounded-lg border border-gray-100">
                <div className="font-mono font-bold text-lg text-krones-navy bg-white border border-krones-blue px-3 py-1 rounded shadow-sm">
                  {f.formula}
                </div>
                <div className="text-gray-700 font-medium">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. The Vanishing Game */}
      <div className="bg-white p-6 rounded-xl border border-krones-ice shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-6">
          <h3 className="text-xl font-bold text-krones-navy flex items-center gap-2">
            <BrainCircuit className="text-krones-blue" />
            Luyện Xóa Chữ <span className="hidden sm:inline opacity-60 font-normal text-sm">(The Vanishing Game)</span>
          </h3>
          <div className="text-sm font-medium text-krones-blue bg-krones-ice px-4 py-1.5 rounded-full shadow-inner">
            Gợi ý đã dùng: <span className="font-bold text-lg">{peekCount}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full sm:w-auto">
            <button 
              onClick={() => { setMode('manual'); setLevel(0); }}
              className={`flex-1 sm:flex-none px-4 py-2 font-medium text-sm transition-colors ${mode === 'manual' ? 'bg-krones-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Chọn bằng tay
            </button>
            <button 
              onClick={() => setMode('ai')}
              className={`flex-1 sm:flex-none px-4 py-2 font-medium text-sm transition-colors ${mode === 'ai' ? 'bg-krones-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              AI Tự động
            </button>
          </div>

          {mode === 'ai' && (
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap hidden sm:inline">Mức độ che:</span>
              <input 
                type="range" 
                min="0" 
                max="3" 
                value={level} 
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-krones-blue"
              />
              <span className="text-sm font-bold text-krones-blue w-28 text-center bg-white py-1 rounded shadow-sm border border-gray-100">
                {level === 0 ? 'Hiện cả (0%)' : level === 1 ? 'Từ nối (30%)' : level === 2 ? 'Từ khóa (70%)' : 'Ẩn hết (100%)'}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#f8fafc] rounded-xl border-2 border-dashed border-gray-300 text-lg leading-loose font-sans text-gray-800 shadow-inner min-h-[300px] whitespace-pre-wrap">
          {words.map((word, index) => renderWord(word, index))}
        </div>
      </div>
      
    </div>
  );
};

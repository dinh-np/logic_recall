import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, BrainCircuit, Save, Check, Plus, X, Image as ImageIcon } from 'lucide-react';
import { DictionaryPopup } from './DictionaryPopup';
import { lookupTerm, parseMeaning, type DictionaryEntry } from '../services/dictionaryService';
import { saveLessonToFirestore, saveWordToDictionary } from '../services/firebase';
import { HandwritingVerification } from './HandwritingVerification';
import type { Subject, SavedLesson } from '../types/index';

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
  subject: Subject;
}

export const LogicBridge: React.FC<LogicBridgeProps> = ({ originalText, data, initialMode = 'ai', subject }) => {
  const [level, setLevel] = useState<number>(0);
  const [mode, setMode] = useState<'manual' | 'ai'>(initialMode);
  const [hiddenWords, setHiddenWords] = useState<Set<number>>(new Set());
  const [peekWords, setPeekWords] = useState<Set<number>>(new Set());
  const [peekCount, setPeekCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject>(subject);
  const [showVerification, setShowVerification] = useState(false);

  // Dictionary Popup State
  const [dictEntry, setDictEntry] = useState<DictionaryEntry | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [popupPos, setPopupPos] = useState<{ x: number, y: number } | null>(null);
  
  const [dictionaryList, setDictionaryList] = useState<HanViet[]>(data.han_viet_dictionary || []);
  const [lookupList, setLookupList] = useState<string[]>([]);
  const [wordSearched, setWordSearched] = useState<string>('');
  
  const [visualAids, setVisualAids] = useState<string[]>(Array(8).fill(''));
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Phân tách từ, dấu câu, khoảng trắng
  const words: string[] = originalText.match(/([\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]+|\s+)/gu) || [];

  const { l1Words, l2Words } = useMemo(() => {
    return {
      l1Words: new Set(data.keywords_level_1.flatMap(w => w.toLowerCase().split(/\s+/))),
      l2Words: new Set(data.keywords_level_2.flatMap(w => w.toLowerCase().split(/\s+/)))
    };
  }, [data]);

  useEffect(() => {
    if (mode === 'ai') {
      const newHidden = new Set<number>();
      words.forEach((w, i) => {
        const cleanWord = w.trim().toLowerCase();
        if (!cleanWord) return;
        
        // Pseudo-random based on index for a stable continuous slider (0-100)
        let score = (i * 137) % 100; 
        
        // L2 words hide easier (score reduced so they hide at lower slider levels)
        if (l2Words.has(cleanWord)) score = score * 0.3;
        else if (l1Words.has(cleanWord)) score = 30 + (score * 0.4);
        else score = 70 + (score * 0.3);
        
        if (level > score) {
          newHidden.add(i);
        }
      });
      setHiddenWords(newHidden);
    } else {
      setHiddenWords(new Set());
    }
  }, [level, mode, l1Words, l2Words, originalText]);

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

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    // Bỏ qua nếu chọn quá dài (không phải 1-2 từ)
    if (text.length === 0 || text.split(/\s+/).length > 4) return;

    setWordSearched(text);

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Mở popup ngay lập tức với trạng thái loading
    setPopupPos({ x: rect.left, y: rect.bottom });
    setDictLoading(true);
    setDictEntry(null);

    const entry = await lookupTerm(text);
    setDictEntry(entry);
    setDictLoading(false);
  };

  const handleLookupRetry = async (word: string) => {
    setWordSearched(word);
    setPopupPos({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 100 });
    setDictLoading(true);
    setDictEntry(null);
    const entry = await lookupTerm(word);
    setDictEntry(entry);
    setDictLoading(false);
  };

  const handleSaveToLookup = (word: string) => {
    if (!lookupList.includes(word)) {
      setLookupList([...lookupList, word]);
    }
    setPopupPos(null);
  };

  const handleSaveToDictionary = async (entry: DictionaryEntry) => {
    const newEntry: HanViet = {
      word: entry.word,
      root_meaning: `[${entry.english}] ${entry.example}`,
      logical_anchor: entry.meaning
    };
    
    if (!dictionaryList.find(d => d.word.toLowerCase() === newEntry.word.toLowerCase())) {
      setDictionaryList([...dictionaryList, newEntry]);
      setLookupList(lookupList.filter(w => w.toLowerCase() !== newEntry.word.toLowerCase()));
    }
    setPopupPos(null);
    
    try {
      await saveWordToDictionary(newEntry);
    } catch (e) {
      console.error("Failed to save word to dictionary", e);
    }
  };

  const handleSaveToLibrary = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    
    // Clean data before saving to prevent undefined errors in Firestore
    const title = originalText.split('\n')[0].substring(0, 50) + (originalText.length > 50 ? '...' : '');
    const lessonToSave: Omit<SavedLesson, 'id'> = {
      title: title || 'Bài học mới',
      subject: currentSubject || 'Other',
      originalText: originalText || '',
      formulaSummary: data.formula_summary ? data.formula_summary.map(f => `${f.formula} - ${f.description}`).join('\n') : '',
      hanVietDictionary: data.han_viet_dictionary ? data.han_viet_dictionary.map(h => ({
        word: h.word,
        rootMeaning: h.root_meaning,
        logicalAnchor: h.logical_anchor
      })) : [],
      keywordsLevel1: data.keywords_level_1 || [],
      keywordsLevel2: data.keywords_level_2 || [],
      visualAids: visualAids.filter(v => v !== ''),
      createdAt: Date.now()
    };
    
    try {
      await saveLessonToFirestore(lessonToSave);
      setIsSaved(true);
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-in slide-in-from-bottom-5';
      toast.innerText = 'Đã lưu bài học vào Thư viện thành công!';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }, 3000);

    } catch (error: any) {
      console.error("Lỗi khi lưu Firestore:", error.message || error);
      
      // Fallback: Local Storage
      try {
        const localSaved = localStorage.getItem('saved_lessons_local');
        const lessons = localSaved ? JSON.parse(localSaved) : [];
        lessons.push({ id: 'local_' + Date.now(), ...lessonToSave });
        localStorage.setItem('saved_lessons_local', JSON.stringify(lessons));
        
        setIsSaved(true);
        
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-yellow-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-in slide-in-from-bottom-5';
        toast.innerText = 'Đã lưu vào bộ nhớ máy (Offline) thành công!';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('fade-out');
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      } catch (localErr) {
        console.error("Lỗi khi lưu LocalStorage:", localErr);
        alert(`Không thể lưu bài học: ${error.message || 'Lỗi không xác định'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newAids = [...visualAids];
        newAids[index] = event.target.result as string;
        setVisualAids(newAids);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderWord = (word: string, index: number) => {
    const isWord = /\w/u.test(word);
    if (!isWord) return <span key={index}>{word}</span>;

    const isHidden = hiddenWords.has(index);
    const isPeeked = peekWords.has(index);

    if (isHidden && !isPeeked) {
      return (
        <span 
          key={index} 
          onClick={() => toggleWord(index, word)}
          className="inline-block bg-krones-ice text-transparent border-b-2 border-krones-blue cursor-pointer px-1 mx-1 rounded select-none relative transition-all"
          title="Chạm để xem gợi ý"
        >
          <span className="text-krones-blue font-bold opacity-70 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">[......]</span>
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

  if (showVerification) {
    return (
      <HandwritingVerification 
        originalText={originalText}
        keywordsLevel2={data.keywords_level_2}
        onBack={() => setShowVerification(false)}
        onComplete={() => {
          setShowVerification(false);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-4xl mx-auto">
      
      {/* LogicBridge Header with Save Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-krones-ice shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-krones-navy flex items-center gap-2">
            LogicBridge 
            <select
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value as Subject)}
              className="bg-krones-ice text-krones-blue text-sm px-2 py-1 rounded-full outline-none focus:ring-2 focus:ring-krones-blue cursor-pointer border border-transparent hover:border-krones-blue transition-colors font-medium ml-2"
            >
              {['GDCD', 'Lịch Sử', 'Địa Lý', 'KHTN', 'Công nghệ', 'Ngữ văn', 'Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </h2>
        </div>
        <button
          onClick={handleSaveToLibrary}
          disabled={isSaved || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all ${
            isSaved 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-krones-navy text-white hover:bg-krones-hover shadow-md'
          }`}
        >
          {isSaving ? (
            <span className="animate-pulse">Đang lưu...</span>
          ) : isSaved ? (
            <>
              <Check size={18} />
              <span>✓ Đã lưu</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>💾 Lưu vào Thư viện</span>
            </>
          )}
        </button>
      </div>

      {/* Khối TỪ KHÓ */}
      <div className="bg-white p-6 rounded-xl border border-krones-ice shadow-sm">
        <h3 className="text-xl font-bold text-krones-navy mb-4 flex items-center gap-2">
          <BookOpen className="text-krones-blue" />
          TỪ KHÓ
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Cột 1: TỪ ĐIỂN */}
          <div>
            <h4 className="text-lg font-bold text-krones-blue mb-4 border-b pb-2">TỪ ĐIỂN</h4>
            {dictionaryList.length > 0 ? (
              <div className="grid gap-3">
                {dictionaryList.map((hv, idx) => (
                  <div key={idx} className="p-3 bg-krones-bg rounded-lg border-l-4 border-krones-blue hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleLookupRetry(hv.word)}>
                    <div className="font-bold text-base text-krones-navy mb-1">{hv.word}</div>
                    <div className="flex flex-col gap-1 mt-1">
                      {(() => {
                        const { etymology, context } = parseMeaning(hv.logical_anchor);
                        if (context) {
                          return (
                            <>
                              <span className="text-sm font-medium text-krones-blue">{context}</span>
                              <span className="text-xs text-krones-blue/80 italic">{etymology}</span>
                            </>
                          );
                        }
                        return <span className="text-sm font-medium text-krones-blue">{hv.logical_anchor}</span>;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Chưa có từ nào trong từ điển.</p>
            )}
          </div>
          
          {/* Cột 2: TRA CỨU */}
          <div>
            <h4 className="text-lg font-bold text-orange-500 mb-4 border-b pb-2">TRA CỨU</h4>
            {lookupList.length > 0 ? (
              <div className="grid gap-3">
                {lookupList.map((word, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                    <span className="font-bold text-orange-700">{word}</span>
                    <button 
                      onClick={() => handleLookupRetry(word)}
                      className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-200 transition-colors font-medium"
                    >
                      Tra cứu lại
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Không có từ nào cần tra cứu.</p>
            )}
          </div>
        </div>
      </div>

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
                max="100" 
                step="1"
                value={level} 
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-krones-blue"
              />
              <span className="text-sm font-bold text-krones-blue w-28 text-center bg-white py-1 rounded shadow-sm border border-gray-100">
                Ẩn {level}%
              </span>
            </div>
          )}
        </div>

        <div 
          className="p-6 bg-[#f8fafc] rounded-xl border-2 border-dashed border-gray-300 text-lg leading-loose font-sans text-gray-800 shadow-inner min-h-[300px] whitespace-pre-wrap relative"
          onMouseUp={handleTextSelection}
        >
          {words.map((word, index) => renderWord(word, index))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => setShowVerification(true)}
            className="flex items-center gap-2 px-8 py-4 bg-krones-navy text-white text-lg font-bold rounded-xl shadow-lg hover:bg-krones-deep-hover hover:scale-105 transition-all"
          >
            📝 Chấm điểm bài viết tay
          </button>
        </div>
      </div>

      {/* 4. Hình ảnh Giảng bài & Sơ đồ Tư duy */}
      <div className="bg-white p-6 rounded-xl border border-krones-ice shadow-sm">
        <h3 className="text-xl font-bold text-krones-navy mb-4 flex items-center gap-2">
          <ImageIcon className="text-krones-blue" />
          Hình ảnh Giảng bài & Sơ đồ Tư duy
        </h3>
        
        <div className="grid grid-cols-4 md:grid-cols-4 gap-4 overflow-x-auto pb-2">
          {visualAids.map((aid, index) => (
            <div 
              key={index} 
              className="relative aspect-square border-2 border-dashed border-krones-blue/30 rounded-xl bg-[#f8fafc] flex items-center justify-center group overflow-hidden cursor-pointer hover:border-krones-blue transition-colors min-w-[80px]"
            >
              {aid ? (
                <>
                  <img 
                    src={aid} 
                    alt={`Visual aid ${index + 1}`} 
                    className="w-full h-full object-cover"
                    onClick={() => setFullscreenImage(aid)}
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newAids = [...visualAids];
                      newAids[index] = '';
                      setVisualAids(newAids);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex items-center justify-center cursor-pointer text-krones-blue/50 hover:text-krones-blue transition-colors">
                  <Plus size={24} />
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={(e) => handleImageUpload(index, e)}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / Modal View */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen visual aid" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <DictionaryPopup 
        wordSearched={wordSearched}
        entry={dictEntry}
        loading={dictLoading}
        position={popupPos}
        onClose={() => setPopupPos(null)}
        onSaveToLookup={handleSaveToLookup}
        onSaveToDictionary={handleSaveToDictionary}
      />
      
    </div>
  );
};

import { useState, useEffect } from 'react';
import { MultiModalInput } from './components/MultiModalInput';
import { SelfReview } from './components/SelfReview';
import { LogicBridge, type LessonData } from './components/LogicBridge';
import { Brain, AlertCircle, Library } from 'lucide-react';
import { seedDictionary } from './services/dictionaryService';
import { LibraryModal } from './components/LibraryModal';
import type { Subject, SavedLesson } from './types/index';

function App() {
  const [step, setStep] = useState<'input' | 'review' | 'locked' | 'analyzed'>('input');
  const [draftText, setDraftText] = useState('');
  const [lockedText, setLockedText] = useState('');
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [initialMode, setInitialMode] = useState<'ai' | 'manual'>('ai');
  const [currentSubject, setCurrentSubject] = useState<Subject>('GDCD');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    seedDictionary().catch(console.error);
    const saved = localStorage.getItem('current_active_lesson');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLockedText(parsed.lockedText);
        setLessonData(parsed.lessonData);
        setCurrentSubject(parsed.currentSubject || 'GDCD');
        setStep('analyzed');
      } catch (e) {
        console.error("Lỗi khi khôi phục bài học:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (step === 'analyzed' && lessonData && lockedText) {
      localStorage.setItem('current_active_lesson', JSON.stringify({
        lockedText,
        lessonData,
        currentSubject
      }));
    }
  }, [step, lessonData, lockedText, currentSubject]);

  const handleInputComplete = (text: string, subject: Subject) => {
    setDraftText(text);
    setCurrentSubject(subject);
    setStep('review');
  };

  const handleOpenLibraryLesson = (savedLesson: SavedLesson) => {
    setIsLibraryOpen(false);
    setLockedText(savedLesson.originalText);
    setCurrentSubject(savedLesson.subject);
    setLessonData({
      han_viet_dictionary: savedLesson.hanVietDictionary.map(h => ({
        word: h.word,
        root_meaning: h.rootMeaning,
        logical_anchor: h.logicalAnchor
      })),
      formula_summary: savedLesson.formulaSummary ? savedLesson.formulaSummary.split('\n').map(line => {
        const [formula, ...descParts] = line.split(' - ');
        return { formula: formula.trim(), description: descParts.join(' - ').trim() };
      }).filter(f => f.formula) : [],
      keywords_level_1: savedLesson.keywordsLevel1,
      keywords_level_2: savedLesson.keywordsLevel2
    });
    setInitialMode('ai');
    setStep('analyzed');
  };

  const handleReviewLock = async (finalText: string) => {
    setLockedText(finalText);
    setStep('locked');
    setErrorMsg('');
    setInitialMode('ai');
    
    try {
      const res = await fetch('/api/analyze-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: finalText })
      });
      const resText = await res.text();
      let data;
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error("Phản hồi từ máy chủ không hợp lệ: " + resText.slice(0, 100));
      }
      
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi phân tích bài học');
      }
      setLessonData(data);
      setStep('analyzed');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra khi kết nối AI');
    }
  };

  return (
    <div className="min-h-screen bg-krones-bg py-8 px-4 font-sans text-gray-900">
      <header className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-krones-navy rounded flex items-center justify-center shadow-lg">
            <Brain className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-krones-navy uppercase tracking-wide">Logic Recall</h1>
            <p className="text-sm font-medium text-krones-blue">Active Learning for Analytical Minds</p>
          </div>
        </div>
        <button 
          onClick={() => setIsLibraryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-krones-navy border border-krones-blue rounded-full shadow-sm hover:bg-krones-ice transition-colors font-medium"
        >
          <Library size={20} className="text-krones-blue" />
          <span className="hidden sm:inline">Bài đã lưu</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto">
        {step === 'input' && (
          <MultiModalInput onComplete={handleInputComplete} />
        )}
        
        {step === 'review' && (
          <SelfReview 
            initialText={draftText} 
            onBack={() => setStep('input')}
            onLock={handleReviewLock} 
          />
        )}

        {step === 'locked' && (
          <div className="p-8 bg-white rounded-xl border-2 border-krones-blue shadow-lg text-center">
            <Brain className="mx-auto text-krones-blue mb-4 animate-bounce" size={48} />
            <h2 className="text-2xl font-bold text-krones-navy mb-2">Đang phân tích hệ thống logic...</h2>
            <p className="text-lg text-gray-600 mb-6">Mở khóa từ Hán - Việt và trích xuất phương trình.</p>
            {errorMsg ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2 border border-red-200">
                  <AlertCircle />
                  <span>{errorMsg}</span>
                  <button 
                    onClick={() => handleReviewLock(lockedText)} 
                    className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setLessonData({
                      han_viet_dictionary: [],
                      formula_summary: [],
                      keywords_level_1: [],
                      keywords_level_2: []
                    });
                    setInitialMode('manual');
                    setStep('analyzed');
                  }}
                  className="mx-auto px-6 py-2 bg-krones-blue text-white rounded font-medium hover:bg-krones-navy transition-colors shadow-md"
                >
                  Bỏ qua AI & Tự chọn từ khóa bằng tay
                </button>
              </div>
            ) : (
              <div className="w-full bg-krones-ice rounded-full h-3 mb-6 overflow-hidden">
                <div className="bg-krones-blue h-3 rounded-full animate-[pulse_2s_ease-in-out_infinite] w-2/3"></div>
              </div>
            )}
            <div className="mt-6 p-4 bg-krones-ice/50 rounded text-left border border-krones-ice">
              <h3 className="font-bold text-krones-navy mb-2">Văn bản gốc đã khóa:</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lockedText}</p>
            </div>
          </div>
        )}

        {step === 'analyzed' && lessonData && (
          <LogicBridge originalText={lockedText} data={lessonData} initialMode={initialMode} subject={currentSubject} />
        )}
      </main>

      {isLibraryOpen && (
        <LibraryModal 
          onClose={() => setIsLibraryOpen(false)}
          onOpenLesson={handleOpenLibraryLesson}
        />
      )}
    </div>
  );
}

export default App;

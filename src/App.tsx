import { useState } from 'react';
import { MultiModalInput } from './components/MultiModalInput';
import { SelfReview } from './components/SelfReview';
import { LogicBridge, type LessonData } from './components/LogicBridge';
import { Brain, AlertCircle } from 'lucide-react';

function App() {
  const [step, setStep] = useState<'input' | 'review' | 'locked' | 'analyzed'>('input');
  const [draftText, setDraftText] = useState('');
  const [lockedText, setLockedText] = useState('');
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputComplete = (text: string) => {
    setDraftText(text);
    setStep('review');
  };

  const handleReviewLock = async (finalText: string) => {
    setLockedText(finalText);
    setStep('locked');
    setErrorMsg('');
    
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
      <header className="max-w-3xl mx-auto mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-krones-navy rounded flex items-center justify-center shadow-lg">
          <Brain className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-krones-navy uppercase tracking-wide">Logic Recall</h1>
          <p className="text-sm font-medium text-krones-blue">Active Learning for Analytical Minds</p>
        </div>
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
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2 border border-red-200">
                <AlertCircle />
                <span>{errorMsg}</span>
                <button 
                  onClick={() => handleReviewLock(lockedText)} 
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Thử lại
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
          <LogicBridge originalText={lockedText} data={lessonData} />
        )}
      </main>
    </div>
  );
}

export default App;

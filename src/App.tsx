import { useState } from 'react';
import { MultiModalInput } from './components/MultiModalInput';
import { SelfReview } from './components/SelfReview';
import { Brain } from 'lucide-react';

function App() {
  const [step, setStep] = useState<'input' | 'review' | 'locked'>('input');
  const [draftText, setDraftText] = useState('');
  const [lockedText, setLockedText] = useState('');

  const handleInputComplete = (text: string) => {
    setDraftText(text);
    setStep('review');
  };

  const handleReviewLock = (finalText: string) => {
    setLockedText(finalText);
    setStep('locked');
    // TODO: Connect to Gemini to get hanVietList, formulas, etc.
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
            <div className="w-full bg-krones-ice rounded-full h-3 mb-6 overflow-hidden">
              <div className="bg-krones-blue h-3 rounded-full animate-[pulse_2s_ease-in-out_infinite] w-2/3"></div>
            </div>
            <div className="p-4 bg-krones-ice/50 rounded text-left border border-krones-ice">
              <h3 className="font-bold text-krones-navy mb-2">Văn bản gốc đã khóa:</h3>
              <p className="text-gray-700 leading-relaxed">{lockedText}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

import { useState, useRef, useEffect } from 'react';
import { Edit2, Lock, ArrowLeft } from 'lucide-react';

interface SelfReviewProps {
  initialText: string;
  onBack: () => void;
  onLock: (finalText: string) => void;
}

export const SelfReview: React.FC<SelfReviewProps> = ({ initialText, onBack, onLock }) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-xl shadow-sm border border-krones-ice">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-krones-blue hover:text-krones-navy font-medium touch-target p-2 -ml-2"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-krones-navy">Tự soát lỗi (Self-Editing)</h2>
        <div className="w-24"></div> {/* spacer */}
      </div>

      <div className="bg-krones-ice/30 p-4 rounded mb-4 border border-krones-ice">
        <p className="text-sm text-krones-navy font-medium flex items-center gap-2">
          <Edit2 size={16} />
          Hãy rà soát kỹ lỗi chính tả và các từ nhận diện sai trước khi khóa văn bản nhé!
        </p>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full min-h-[300px] p-4 border-2 border-krones-blue/50 rounded focus:border-krones-blue outline-none text-lg leading-relaxed resize-none overflow-hidden mb-6 font-sans"
      />

      <div className="flex justify-end">
        <button 
          onClick={() => onLock(text)}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-8 py-4 bg-krones-navy text-white rounded font-bold text-lg hover:bg-krones-hover transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Lock size={24} />
          <span>Khóa Văn Bản & Phân Tích AI</span>
        </button>
      </div>
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Mic, MicOff, ClipboardPaste, Camera, Keyboard, CheckCircle, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MultiModalInputProps {
  onComplete: (text: string) => void;
}

// Helper nén ảnh bằng Canvas
async function compressImageToJpegBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Luôn xuất ra định dạng image/jpeg chuẩn
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      // Cắt bỏ phần "data:image/jpeg;base64," để lấy raw base64
      const base64Data = dataUrl.split(',')[1];
      resolve(base64Data);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export const MultiModalInput: React.FC<MultiModalInputProps> = ({ onComplete }) => {
  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Khởi tạo Speech Recognition
  useEffect(() => {
    if (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsMicActive(true);
      };
      
      recognition.onend = () => {
        setIsMicActive(false);
        setInterimText('');
        setIsPaused(false); 
      };
      
      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsMicActive(false);
        setIsPaused(false);
        setInterimText('');
      };

      recognition.onresult = (event: any) => {
        if (isPausedRef.current) return;

        let currentInterim = '';
        let currentFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinal += result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }
        
        if (currentFinal) {
          setText((prev) => prev + (prev && prev.trim() ? ' ' : '') + currentFinal);
        }
        setInterimText(currentInterim);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort(); 
      }
    };
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của thiết bị này không hỗ trợ nhận diện giọng nói (Web Speech API).');
      return;
    }
    
    if (isMicActive) {
      setIsPaused(!isPaused);
      if (!isPaused) {
        setInterimText('');
      }
    } else {
      try {
        setIsPaused(false);
        recognitionRef.current.start();
      } catch (e) {
        console.error("Không thể khởi động mic, có thể nó đang chạy.", e);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText((prev) => prev + (prev && prev.trim() ? '\n' : '') + clipboardText);
    } catch (err) {
      alert('Không thể dán văn bản. Vui lòng cấp quyền truy cập Clipboard cho trình duyệt.');
    }
  };

  // OCR sử dụng input type=file để tương thích tốt nhất với iOS/Android Camera
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    if (isMicActive && recognitionRef.current) {
      recognitionRef.current.abort();
    }

    try {
      const base64Data = await compressImageToJpegBase64(file);

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Thiếu biến môi trường VITE_GEMINI_API_KEY");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "Hãy đọc và trích xuất toàn bộ văn bản tiếng Việt có trong trang sách này. Chỉ trả về nội dung văn bản thuần túy, không thêm lời giải thích hay định dạng markdown.";
      
      const imageParts = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const extractedText = response.text().trim();
      
      setText((prev) => prev + (prev && prev.trim() ? '\n\n' : '') + extractedText);
    } catch (error: any) {
      console.error("OCR Error:", error);
      alert(`Lỗi trích xuất: ${error.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsScanning(false);
      // Reset input để có thể chụp lại tấm ảnh giống hệt nếu cần
      event.target.value = '';
    }
  };

  const handleComplete = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    onComplete(text);
  };

  const displayText = text + (interimText ? (text && text.trim() ? ' ' : '') + interimText : '');

  const getMicButtonLabel = () => {
    if (isMicActive && !isPaused) return 'Đang nghe... (Chạm để Tạm dừng)';
    if (isMicActive && isPaused) return 'Tiếp tục đọc (Mic)';
    if (text) return 'Đọc thêm bằng Mic';
    return 'Đọc Micro (VN)';
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-xl shadow-sm border border-krones-ice">
      <h2 className="text-xl font-bold text-krones-navy mb-4">Nhập liệu Đa kênh</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium">
          <Keyboard size={20} />
          <span>Gõ tay</span>
        </button>
        <button onClick={handlePaste} className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium">
          <ClipboardPaste size={20} />
          <span>Dán nhanh</span>
        </button>
        <button 
          onClick={handleVoiceInput} 
          className={`flex items-center gap-2 px-4 py-2 rounded touch-target font-medium transition-colors ${
            isMicActive && !isPaused 
              ? 'bg-red-500 text-white animate-pulse shadow-md' 
              : 'bg-krones-ice text-krones-navy hover:bg-krones-blue hover:text-white'
          }`}
        >
          {isMicActive && !isPaused ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{getMicButtonLabel()}</span>
        </button>
        
        {/* Nút chụp ảnh sử dụng thẻ Label bọc thẻ Input File */}
        <label className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium cursor-pointer">
          <Camera size={20} />
          <span>Chụp ảnh SGK</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </label>
      </div>

      {isScanning && (
        <div className="flex items-center justify-center gap-3 p-8 mb-4 border-2 border-krones-ice border-dashed rounded bg-krones-bg">
          <Loader2 className="text-krones-blue animate-spin" size={32} />
          <p className="text-krones-navy font-medium text-lg">Đang quét chữ từ ảnh (Gemini OCR)...</p>
        </div>
      )}

      {!isScanning && (
        <div className="relative mb-4">
          <textarea
            value={displayText}
            onChange={(e) => {
              setText(e.target.value);
              setInterimText(''); 
            }}
            placeholder="Nhập hoặc dán nội dung bài học vào đây..."
            className="w-full min-h-[200px] p-4 border-2 border-krones-ice rounded focus:border-krones-blue outline-none text-lg leading-relaxed resize-y font-sans shadow-inner bg-gray-50/50"
          />
          {interimText && (
            <span className="absolute bottom-4 right-4 text-sm font-semibold text-krones-blue animate-pulse bg-krones-ice px-2 py-1 rounded">
              Đang nghe...
            </span>
          )}
          {isMicActive && isPaused && (
            <span className="absolute bottom-4 right-4 text-sm font-semibold text-gray-500 bg-krones-ice px-2 py-1 rounded">
              Micro đang ở chế độ chờ...
            </span>
          )}
        </div>
      )}

      <div className="flex justify-end mt-2">
        <button 
          onClick={handleComplete}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-krones-navy text-white rounded font-bold text-lg hover:bg-krones-hover transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <CheckCircle size={24} />
          <span>Tiến hành Rà soát</span>
        </button>
      </div>
    </div>
  );
};

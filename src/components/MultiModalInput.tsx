import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Mic, MicOff, ClipboardPaste, Camera, Keyboard, CheckCircle, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
// import removed as it is now used server-side
// @ts-ignore
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

interface MultiModalInputProps {
  onComplete: (text: string) => void;
}

// Helper nén ảnh bằng Canvas
async function compressImageToJpegBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1024;
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      const base64Data = dataUrl.split(',')[1];
      resolve(base64Data);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Helper chuyển file PDF sang base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });
}

export const MultiModalInput: React.FC<MultiModalInputProps> = ({ onComplete }) => {
  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMessage, setScanningMessage] = useState('Đang đọc và xử lý tài liệu...');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
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

  // Hàm gọi API nội bộ (/api/extract-text) chung cho Hình ảnh và PDF
  const extractTextWithGemini = async (base64Data: string, mimeType: string, signal?: AbortSignal) => {
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Data,
        mimeType,
        prompt: "Hãy đọc và trích xuất toàn bộ văn bản tiếng Việt có trong tài liệu/hình ảnh này. Giữ nguyên câu chữ, không thêm lời giải thích hay định dạng markdown."
      }),
      signal
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Lỗi trích xuất văn bản');
    }
    return data.text;
  };

  // OCR sử dụng input type=file cho Ảnh (Camera hoặc Thư viện)
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const controller = new AbortController();
    setAbortController(controller);
    setScanningMessage('Đang phân tích hình ảnh bằng AI...');
    setIsScanning(true);

    if (isMicActive && recognitionRef.current) {
      recognitionRef.current.abort();
    }

    try {
      const base64Data = await compressImageToJpegBase64(file);
      const extractedText = await extractTextWithGemini(base64Data, "image/jpeg", controller.signal);
      setText((prev) => prev + (prev && prev.trim() ? '\n\n' : '') + extractedText);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Image scanning was aborted");
      } else {
        console.error("OCR Image Error:", error);
        alert(`Lỗi trích xuất ảnh: ${error.message || 'Vui lòng thử lại.'}`);
      }
    } finally {
      setIsScanning(false);
      setAbortController(null);
      event.target.value = '';
    }
  };

  // Xử lý tải tài liệu các loại (PDF, DOCX, XLSX, TXT)
  const handleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const controller = new AbortController();
    setAbortController(controller);

    if (file.name.toLowerCase().endsWith('.pdf')) {
      setScanningMessage('Đang đọc tài liệu PDF (có thể mất chút thời gian với file lớn)...');
    } else {
      setScanningMessage('Đang xử lý tài liệu...');
    }
    setIsScanning(true);

    if (isMicActive && recognitionRef.current) {
      recognitionRef.current.abort();
    }

    try {
      const fileName = file.name.toLowerCase();
      let extractedText = "";

      if (fileName.endsWith('.pdf')) {
        // Gửi PDF qua Gemini
        const base64Data = await fileToBase64(file);
        extractedText = await extractTextWithGemini(base64Data, "application/pdf", controller.signal);
      } 
      else if (fileName.endsWith('.txt')) {
        // Đọc trực tiếp text
        extractedText = await file.text();
      }
      else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        // Sử dụng mammoth để trích xuất text từ Word
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      }
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Sử dụng xlsx để đọc text từ Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        extractedText = XLSX.utils.sheet_to_txt(workbook.Sheets[sheetName]);
      } else {
        throw new Error("Định dạng tệp không được hỗ trợ.");
      }
      
      setText((prev) => prev + (prev && prev.trim() ? '\n\n' : '') + extractedText.trim());
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Document scanning was aborted");
      } else {
        console.error("Document Upload Error:", error);
        alert(`Lỗi xử lý tài liệu: ${error.message || 'Vui lòng thử lại.'}`);
      }
    } finally {
      setIsScanning(false);
      setAbortController(null);
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
        
        {/* Nút 1: Chụp ảnh trực tiếp */}
        <label className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium cursor-pointer">
          <Camera size={20} />
          <span>Chụp SGK</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </label>

        {/* Nút 2: Tải ảnh có sẵn */}
        <label className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium cursor-pointer">
          <ImageIcon size={20} />
          <span>Tải ảnh SGK</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </label>

        {/* Nút 3: Tải tệp tài liệu (PDF/Word/Excel) */}
        <label className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium cursor-pointer">
          <FileText size={20} />
          <span>Tải tệp PDF/Word</span>
          <input 
            type="file" 
            accept=".pdf,.docx,.doc,.xlsx,.xls,.txt" 
            onChange={handleDocumentUpload} 
            className="hidden" 
          />
        </label>
      </div>

      {isScanning && (
        <div className="flex flex-col items-center justify-center gap-3 p-8 mb-4 border-2 border-krones-ice border-dashed rounded bg-krones-bg">
          <div className="flex items-center gap-3">
            <Loader2 className="text-krones-blue animate-spin" size={32} />
            <p className="text-krones-navy font-medium text-lg">{scanningMessage}</p>
          </div>
          {abortController && (
            <button
              onClick={() => abortController.abort()}
              className="mt-2 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-medium border border-red-200"
            >
              Dừng lại
            </button>
          )}
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
            placeholder="Nhập hoặc tải tài liệu/ảnh bài học vào đây..."
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

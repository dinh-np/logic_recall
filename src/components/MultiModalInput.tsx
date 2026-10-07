import { useState, useRef } from 'react';
import { Mic, ClipboardPaste, Camera, Keyboard, CheckCircle } from 'lucide-react';

interface MultiModalInputProps {
  onComplete: (text: string) => void;
}

export const MultiModalInput: React.FC<MultiModalInputProps> = ({ onComplete }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Web Speech API cho tiếng Việt
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setText((prev) => prev + (prev ? ' ' : '') + currentTranscript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText((prev) => prev + (prev ? '\n' : '') + clipboardText);
    } catch (err) {
      alert('Không thể dán văn bản. Vui lòng cấp quyền truy cập Clipboard.');
    }
  };

  // Mock OCR using a placeholder for now until Gemini Vision is hooked up
  const handleCameraCapture = () => {
    setIsCameraOpen(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error(err);
        alert('Không thể mở camera.');
        setIsCameraOpen(false);
      });
  };

  const captureImage = () => {
    // TODO: In actual implementation, draw video frame to canvas and send to Gemini OCR.
    // Mock for sprint 1
    alert('Đã chụp! (Mock OCR)');
    setText((prev) => prev + (prev ? '\n' : '') + "Đoạn văn bản trích xuất từ sách giáo khoa...");
    setIsCameraOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
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
        <button onClick={handleVoiceInput} className={`flex items-center gap-2 px-4 py-2 rounded touch-target font-medium transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-krones-ice text-krones-navy hover:bg-krones-blue hover:text-white'}`}>
          <Mic size={20} />
          <span>{isListening ? 'Đang nghe...' : 'Đọc Micro (VN)'}</span>
        </button>
        <button onClick={handleCameraCapture} className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium">
          <Camera size={20} />
          <span>Chụp ảnh SGK</span>
        </button>
      </div>

      {isCameraOpen && (
        <div className="relative mb-4 rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button 
            onClick={captureImage}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-krones-blue flex items-center justify-center touch-target"
          >
            <Camera size={24} className="text-krones-navy" />
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập hoặc dán nội dung bài học vào đây..."
        className="w-full min-h-[200px] p-4 border-2 border-krones-ice rounded focus:border-krones-blue outline-none text-lg leading-relaxed resize-y mb-4"
      />

      <div className="flex justify-end">
        <button 
          onClick={() => onComplete(text)}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-krones-navy text-white rounded font-bold text-lg hover:bg-krones-hover transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={24} />
          <span>Tiến hành Rà soát</span>
        </button>
      </div>
    </div>
  );
};

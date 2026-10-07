import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, ClipboardPaste, Camera, Keyboard, CheckCircle, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MultiModalInputProps {
  onComplete: (text: string) => void;
}

export const MultiModalInput: React.FC<MultiModalInputProps> = ({ onComplete }) => {
  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  
  // isMicActive: Trạng thái thực tế của phần cứng Micro
  const [isMicActive, setIsMicActive] = useState(false);
  // isPaused: Trạng thái ngắt thu âm bằng phần mềm (bỏ qua text)
  const [isPaused, setIsPaused] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  // Dùng ref để trong event listener (onresult) có thể đọc được trạng thái pause mới nhất
  const isPausedRef = useRef(false);

  // Sync state vào ref
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
        // Nếu hệ thống tự tắt mic (do im lặng quá lâu), reset lại nút pause
        setIsPaused(false); 
      };
      
      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsMicActive(false);
        setIsPaused(false);
        setInterimText('');
      };

      recognition.onresult = (event: any) => {
        // Nếu người dùng đã bấm nút Tạm dừng (mềm), bỏ qua hoàn toàn các kết quả thu được
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

    // Cleanup triệt để khi component unmount
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
      // Nếu mic đang chạy, chỉ chuyển đổi trạng thái phần mềm (isPaused)
      // KHÔNG gọi stop() để tránh thiết bị iOS/Android hỏi lại quyền khi mở lại
      setIsPaused(!isPaused);
      if (!isPaused) {
        // Nếu đang chuyển sang Paused, dọn sạch interim text trên màn hình
        setInterimText('');
      }
    } else {
      // Nếu mic chưa bật, bật nó lên
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
        alert('Không thể mở camera. Bạn có thể chưa cấp quyền.');
        setIsCameraOpen(false);
      });
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    if (video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setIsScanning(true);

    // Tự động dừng Mic hoàn toàn nếu đang chụp hình (giảm tải thiết bị)
    if (isMicActive && recognitionRef.current) {
      recognitionRef.current.abort();
    }

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "Hãy trích xuất chính xác 100% toàn bộ văn bản tiếng Việt có trong ảnh chụp trang sách này. Không thêm lời mở đầu hay giải thích, chỉ trả về nội dung văn bản thuần túy.";
      
      const imageParts = [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: "image/jpeg"
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const extractedText = response.text().trim();
      
      setText((prev) => prev + (prev && prev.trim() ? '\n\n' : '') + extractedText);
    } catch (error) {
      console.error("OCR Error:", error);
      alert('Lỗi trích xuất văn bản từ ảnh. Vui lòng thử lại.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleComplete = () => {
    // Tắt hẳn mic triệt để khi chốt khóa text
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    onComplete(text);
  };

  const displayText = text + (interimText ? (text && text.trim() ? ' ' : '') + interimText : '');

  // Xác định chữ và icon cho nút Mic
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
        <button onClick={handleCameraCapture} className="flex items-center gap-2 px-4 py-2 bg-krones-ice text-krones-navy rounded hover:bg-krones-blue hover:text-white transition-colors touch-target font-medium">
          <Camera size={20} />
          <span>Chụp ảnh SGK</span>
        </button>
      </div>

      {isCameraOpen && (
        <div className="relative mb-4 rounded overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <button 
            onClick={captureImage}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-krones-blue flex items-center justify-center touch-target hover:bg-krones-ice transition-colors shadow-lg"
          >
            <Camera size={24} className="text-krones-navy" />
          </button>
          
          <button 
            onClick={() => {
              setIsCameraOpen(false);
              if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
              }
            }}
            className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded hover:bg-black/70 transition-colors"
          >
            Đóng
          </button>
        </div>
      )}

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
              setInterimText(''); // Xóa interim nếu người dùng tự gõ can thiệp
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

import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { compareText } from '../services/diffService';
import type { DiffResult } from '../services/diffService';

interface HandwritingVerificationProps {
  originalText: string;
  keywordsLevel2: string[];
  onBack: () => void;
  onComplete?: () => void;
}

// Canvas Compression
async function compressImageToJpegBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        const base64Data = dataUrl.split(',')[1];
        resolve(base64Data);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
  });
}

export const HandwritingVerification: React.FC<HandwritingVerificationProps> = ({
  originalText,
  keywordsLevel2,
  onBack,
  onComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<DiffResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const base64Data = await compressImageToJpegBase64(file);
      
      const response = await fetch('/api/verify-handwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type || 'image/jpeg',
          prompt: "Bạn là chuyên gia thẩm định chữ viết tay tiếng Việt của học sinh. Hãy đọc chính xác toàn bộ nội dung học sinh đã viết tay trong bức ảnh này. Chỉ trả về nội dung chữ viết tay học sinh đã viết, giữ nguyên các câu/đoạn, không thêm nhận xét hay lời chào."
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi server OCR');

      const transcribedText = data.text;
      
      // Calculate diff
      const diffResult = compareText(originalText, transcribedText, keywordsLevel2);
      setResult(diffResult);

    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đọc ảnh.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-krones-navy" />
        </button>
        <h2 className="text-2xl font-bold text-krones-navy">📝 Chấm điểm bài viết tay</h2>
      </div>

      {!result && !isProcessing && (
        <div className="bg-white p-8 rounded-xl shadow-md border-2 border-krones-ice text-center flex flex-col items-center gap-6">
          <p className="text-lg text-gray-700 max-w-xl">
            Sau khi luyện tập, con hãy chép lại bài ra giấy, sau đó chụp một bức ảnh rõ nét để hệ thống tự động chấm điểm nhé!
          </p>
          
          <div className="flex gap-4 w-full max-w-md">
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-krones-navy text-white rounded-xl hover:bg-krones-deep-hover shadow-lg transition-transform active:scale-95"
            >
              <Camera size={40} />
              <span className="font-semibold text-lg">Chụp ảnh</span>
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-white text-krones-navy border-2 border-krones-navy rounded-xl hover:bg-gray-50 shadow-md transition-transform active:scale-95"
            >
              <Upload size={40} />
              <span className="font-semibold text-lg">Tải ảnh lên</span>
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
          
          {errorMsg && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 w-full text-left">
              <strong>Lỗi:</strong> {errorMsg}
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="bg-white p-12 rounded-xl shadow-md border-2 border-krones-ice text-center flex flex-col items-center gap-4">
          <RefreshCw size={48} className="text-krones-blue animate-spin" />
          <h3 className="text-xl font-bold text-krones-navy">Đang phân tích chữ viết tay...</h3>
          <p className="text-gray-500">Xin vui lòng chờ một chút để hệ thống đọc và so khớp</p>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-krones-ice text-center">
            <h3 className="text-2xl font-bold text-krones-navy mb-2">
              🎯 Độ chính xác: <span className={result.accuracy >= 80 ? 'text-green-600' : 'text-amber-500'}>{result.accuracy}%</span>
            </h3>
            <p className="text-gray-600">
              {result.accuracy >= 90 ? "Rất xuất sắc! Con đã nhớ gần như toàn bộ bài học." : 
               result.accuracy >= 70 ? "Khá tốt! Con chỉ quên một vài từ thôi." : 
               "Con cần luyện tập thêm một chút nữa nhé!"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-krones-ice">
            <h4 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">Khung So khớp Trực quan (Diff)</h4>
            <div className="text-lg leading-relaxed whitespace-pre-wrap">
              {result.changes.map((change, index) => {
                if (change.added) {
                  return <span key={index} className="text-amber-500 bg-amber-50 px-1 mx-0.5 rounded" title="Viết thêm (không có trong bài gốc)">{change.value}</span>;
                }
                if (change.removed) {
                  return <span key={index} className="text-red-500 line-through bg-red-50 px-1 mx-0.5 rounded" title="Bị thiếu">{change.value}</span>;
                }
                return <span key={index} className="text-green-600 bg-green-50 px-1 rounded">{change.value}</span>;
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-gray-500 justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Khớp bài gốc</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span> Con quên viết</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-full inline-block"></span> Con tự thêm vào</span>
            </div>
          </div>

          {result.missingKeywords.length > 0 && (
            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
              <h4 className="font-bold text-lg text-red-700 flex items-center gap-2 mb-3">
                <XCircle size={20} /> Cần bổ sung ngay (Từ khóa quan trọng con đã quên)
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-white text-red-600 border border-red-300 rounded-full font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => setResult(null)}
              className="flex-1 py-4 text-lg font-bold text-krones-navy bg-krones-ice hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={24} /> Viết lại lần nữa
            </button>
            <button 
              onClick={onComplete}
              className="flex-1 py-4 text-lg font-bold text-white bg-krones-navy hover:bg-krones-deep-hover rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={24} /> Hoàn thành bài học
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

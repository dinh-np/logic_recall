import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Thiếu API Key trên server' });
    }

    const { base64Data, mimeType, prompt } = req.body;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Tự động ưu tiên gọi model đầu tiên tìm thấy trong danh sách khả dụng từ Google
    let candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (listResponse.ok) {
        const data = await listResponse.json();
        const availableModels = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace("models/", ""));
        
        if (availableModels.length > 0) {
          candidateModels = [availableModels[0], ...candidateModels];
        }
      }
    } catch (e) {
      console.warn("Không thể lấy danh sách model:", e);
    }

    // Loại bỏ model trùng lặp
    candidateModels = Array.from(new Set(candidateModels));

    let extractedText = '';
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data
            }
          },
          prompt || "Trích xuất toàn bộ văn bản tiếng Việt có trong tài liệu/ảnh này. Chỉ trả về nội dung văn bản thuần túy."
        ]);
        extractedText = response.response.text();
        if (extractedText) break;
      } catch (e: any) {
        lastErr = e;
        console.warn(`Thử model ${modelName} thất bại:`, e.message);
      }
    }

    if (!extractedText && lastErr) {
      let errorMessage = lastErr.message || 'Lỗi xử lý OCR';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        errorMessage = "API Key chưa kích hoạt Generative Language API hoặc không hợp lệ. Vui lòng kiểm tra tại aistudio.google.com/apikey. Lỗi gốc: " + errorMessage;
      }
      throw new Error(errorMessage);
    }

    return res.status(200).json({ text: extractedText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    let errorMsg = error.message || 'Lỗi xử lý OCR';
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      errorMsg = "API Key chưa kích hoạt Generative Language API hoặc không hợp lệ. Vui lòng kiểm tra tại aistudio.google.com/apikey. Lỗi gốc: " + errorMsg;
    }
    return res.status(500).json({ error: errorMsg });
  }
}

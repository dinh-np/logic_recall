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
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: base64Data
        }
      },
      prompt || "Hãy đọc và trích xuất toàn bộ văn bản tiếng Việt có trong tài liệu/ảnh này. Chỉ trả về nội dung văn bản thuần túy, không thêm bất kỳ định dạng hay lời giải thích nào."
    ]);
    
    const text = result.response.text();
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    let errorMsg = error.message || 'Lỗi xử lý OCR';
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      errorMsg = "API Key chưa kích hoạt Generative Language API hoặc không hợp lệ. Vui lòng kiểm tra tại aistudio.google.com/apikey. Lỗi gốc: " + errorMsg;
    }
    return res.status(500).json({ error: errorMsg });
  }
}

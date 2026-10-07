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

    // Sử dụng danh sách model khả dụng
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

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
      throw lastErr;
    }

    return res.status(200).json({ text: extractedText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý OCR' });
  }
}

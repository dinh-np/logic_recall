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
    
    const MODELS_TO_TRY = ["gemini-3.8-flash", "gemini-3.6-flash"];

    const generateWithRetry = async (modelInstance: any, contents: any, maxRetries = 2) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await modelInstance.generateContent(contents);
        } catch (err: any) {
          if (err?.message?.includes("503") && attempt < maxRetries) {
            console.warn(`Gặp 503, thử lại lần ${attempt + 1} sau 1.5s...`);
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw err;
        }
      }
    };

    let text = "";
    let lastErr = null;

    for (const modelName of MODELS_TO_TRY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await generateWithRetry(model, [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Data
            }
          },
          prompt || "Hãy đọc và trích xuất toàn bộ văn bản tiếng Việt có trong tài liệu/ảnh này. Chỉ trả về nội dung văn bản thuần túy, không thêm bất kỳ định dạng hay lời giải thích nào."
        ]);
        text = result.response.text();
        if (text) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${modelName} thất bại:`, err.message);
      }
    }

    if (!text && lastErr) {
      throw lastErr;
    }

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

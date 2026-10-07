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

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text content' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
Phân tích văn bản bài học sau và trả về JSON chuẩn theo cấu trúc sau:
{
  "han_viet_dictionary": [ {"word": "...", "meaning": "...", "example": "..."} ], // Bảng giải nghĩa từ Hán - Việt dạng module ("Tách âm - Ghép nghĩa" + Ví dụ neo tư duy logic).
  "formula_summary": [ {"formula": "...", "description": "..."} ], // Công thức toán học / hệ phương trình tóm tắt bài học (Formula View). Trả về mảng rỗng nếu không có.
  "keywords_level_1": ["...", "..."], // Danh sách từ nối, từ phụ, từ chỉ bối cảnh chung.
  "keywords_level_2": ["...", "..."] // Danh sách từ khóa cốt lõi mang điểm số, quan trọng nhất của bài học.
}

Văn bản cần phân tích:
"""
${text}
"""
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const json = JSON.parse(responseText);

    return res.status(200).json(json);
  } catch (error: any) {
    console.error('Analyze Lesson Error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý AI' });
  }
}

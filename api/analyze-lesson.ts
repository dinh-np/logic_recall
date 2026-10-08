import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 10; // Keep within Hobby tier limit (10s)

function generateLocalFallback(text: string) {
  const commonConnectives = ["và", "là", "những", "được", "của", "qua", "trong", "về", "có", "từ", "đến", "với"];
  const words = text.split(/\s+/);
  const kw1 = Array.from(new Set(words.filter(w => commonConnectives.includes(w.toLowerCase())))).slice(0, 8);
  
  // Lấy các từ khóa sau dấu gạch đầu dòng hoặc từ dài
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const kw2 = lines.slice(0, 6).map(l => l.replace(/^[•\-\d\.\s]+/, '').split(' - ')[0].trim()).filter(Boolean);

  return {
    formula_summary: [
      {
        formula: lines[0]?.replace(/^[•\-\d\.\s]+/, '') || "Nội dung bài học",
        description: "Trọng tâm ghi nhớ"
      }
    ],
    han_viet_dictionary: [],
    keywords_level_1: kw1.length > 0 ? kw1 : ["và", "là", "của", "được"],
    keywords_level_2: kw2.length > 0 ? kw2 : ["quan trọng", "cốt lõi", "ghi nhớ"]
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey || !text) {
    return res.status(200).json(generateLocalFallback(text || ""));
  }

  try {
    const controller = new AbortController();
    // Ép ngắt ở 7.5s trước trần Vercel 10s
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    const prompt = `Phân tích văn bản sau cho học sinh lớp 7 (chỉ lấy tối đa 4 từ Hán-Việt, 1 dòng công thức, 6 từ nối kw1, 6 từ khóa chính kw2):
"${text}"
Trả về JSON thuần:
{"formula_summary": [{"formula": "...", "description": "..."}], "han_viet_dictionary": [{"word": "...", "root_meaning": "...", "logical_anchor": "..."}], "keywords_level_1": [...], "keywords_level_2": [...]}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 600
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Google API busy or error");

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);
    
    // Ensure array for formula_summary to prevent crashing LogicBridge
    if (!Array.isArray(parsed.formula_summary)) {
      parsed.formula_summary = [{ formula: "Logic", description: String(parsed.formula_summary) }];
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.warn("Chuyển sang Local Heuristic Fallback:", err);
    // Luôn trả về 200 kèm kết quả dự phòng, không bao giờ để crash giao diện
    return res.status(200).json(generateLocalFallback(text));
  }
}

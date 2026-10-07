export const config = {
  runtime: 'edge', // Chạy trên Edge Network, không bị giới hạn cold-start
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Thiếu API Key' }), { status: 500 });
    }

    const prompt = `Bạn là trợ lý học tập. Hãy phân tích đoạn văn sau cho học sinh lớp 7:
"${text}"

Yêu cầu trả về đúng định dạng JSON:
{
  "formula_summary": [
    {"formula": "công thức ngắn gọn", "description": "giải thích công thức"}
  ],
  "han_viet_dictionary": [
    {"word": "từ khó", "root_meaning": "giải nghĩa ngắn", "logical_anchor": "ví dụ thực tế"}
  ],
  "keywords_level_1": ["từ nối 1", "từ nối 2"],
  "keywords_level_2": ["từ khóa chính 1", "từ khóa chính 2"]
}`;

    // Gọi trực tiếp REST API qua fetch để đạt tốc độ tối đa
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Lỗi từ Google API');
    }

    const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedData = JSON.parse(rawJson);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Edge Analysis Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Lỗi phân tích' }), { status: 500 });
  }
}

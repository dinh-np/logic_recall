import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chưa cấu hình API Key trên Vercel" });
  }

  try {
    // Gọi trực tiếp REST API ListModels của Google
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "Google API từ chối Key", 
        details: data 
      });
    }

    // Trả về danh sách các model có hỗ trợ generateContent
    const availableModels = (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: any) => m.name.replace("models/", ""));

    return res.status(200).json({ 
      status: "Key hợp lệ", 
      totalModels: availableModels.length,
      availableModels 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

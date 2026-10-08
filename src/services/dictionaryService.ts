import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export interface DictionaryEntry {
  word: string;
  meaning: string;
  example: string;
  english: string;
}

export const lookupTerm = async (word: string): Promise<DictionaryEntry | null> => {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return null;

  try {
    // 1. Tra cứu Firestore
    const q = query(collection(db, 'dictionary'), where('word', '==', cleanWord));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as DictionaryEntry;
    }

    // 2. Không có trong DB -> Gọi AI
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const prompt = `Bạn là từ điển Hán Việt. Giải nghĩa ngắn gọn từ sau: "${cleanWord}".
    Trả về chuẩn JSON:
    {
      "word": "${cleanWord}",
      "meaning": "chỉ đưa ra giải nghĩa cốt lõi hoặc bản chất của từ (lược bỏ phần chiết tự từ nguyên)",
      "example": "ví dụ thực tế ngắn gọn",
      "english": "từ/cụm từ tiếng Anh tương đương"
    }`;

    const result = await model.generateContent(prompt);
    const rawJson = result.response.text();
    const entryData = JSON.parse(rawJson) as DictionaryEntry;
    
    // 3. Lưu vào DB
    await addDoc(collection(db, 'dictionary'), {
      ...entryData,
      word: cleanWord, // Ensure case matching
      createdAt: new Date()
    });

    return entryData;
  } catch (error) {
    console.error("Lỗi tra từ:", error);
    return null;
  }
};

export const seedDictionary = async () => {
  const seedWords = [
    { word: "truyền thống", meaning: "Kế thừa liên tục qua nhiều thế hệ.", example: "Giữ gìn truyền thống văn hóa dân tộc.", english: "Tradition / Heritage" },
    { word: "khái niệm", meaning: "Hình thức tư duy phản ánh thuộc tính bản chất của sự vật.", example: "Học sinh cần nắm vững khái niệm trước khi làm bài tập.", english: "Concept" },
    { word: "lưu truyền", meaning: "Giữ gìn và truyền lại cho đời sau.", example: "Những câu ca dao được lưu truyền từ ngàn đời nay.", english: "Hand down / Transmit" },
    { word: "bản sắc", meaning: "Tính chất đặc trưng làm nên giá trị riêng biệt.", example: "Bản sắc văn hóa Việt Nam rất phong phú.", english: "Identity" },
    { word: "tự hào", meaning: "Cảm thấy hãnh diện, vui sướng về điều tốt đẹp.", example: "Chúng em tự hào về lịch sử quê hương.", english: "Pride" },
    { word: "di sản", meaning: "Tài sản vật chất hoặc tinh thần do thế hệ trước để lại.", example: "Vịnh Hạ Long là di sản thiên nhiên thế giới.", english: "Heritage / Legacy" }
  ];

  for (const item of seedWords) {
    const q = query(collection(db, 'dictionary'), where('word', '==', item.word));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      await addDoc(collection(db, 'dictionary'), { ...item, createdAt: new Date() });
    } else {
      // Overwrite existing to clean up old root_meaning format
      for (const docSnapshot of querySnapshot.docs) {
        await import('firebase/firestore').then(({ updateDoc }) => {
          updateDoc(docSnapshot.ref, { meaning: item.meaning });
        });
      }
    }
  }
};

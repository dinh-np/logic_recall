# SYSTEM ARCHITECTURE & DATA FLOW

## 1. Sơ đồ luồng dữ liệu (Data Pipeline)

```text
[Thiết bị: iPad / Note 20 / S26 / Laptop]
   │
   ├── (Input: Voice / OCR Sách / Gõ / Paste)
   │        ▼
   ├── [Màn hình Rà Soát & Chỉnh Sửa] ──> Khóa originalText
   │        │
   │        ├──> Lưu tạm vào IndexedDB (Cục bộ thiết bị của con)
   │        └──> Gửi (base64) lên Serverless API nội bộ (/api/extract-text)
   │                 │
   │                 ├──> (Backend Serverless - Ẩn API Key, áp dụng Fallback Models: Gemini 2.5 -> 2.0 -> 1.5)
   │                 ▼
   │           { hanVietList, formula, keywordsLevel1, keywordsLevel2 }
   │                 │
   ├── [Màn chơi: Vanishing Game] (Level 1 -> 2 -> 3)
   │        │
   └── [Màn kiểm tra: Viết tay ra giấy] 
            │
            ├──> Camera chụp ảnh trang giấy (Có nén dung lượng bằng Canvas)
            ├──> Gửi { image_blob, originalText } lên Serverless API nội bộ (/api/extract-text)
            │        │
            │        ▼
            │     { transcribedText, accuracyScore, matched, missing }
            │        │
            ├──> Render Diff Xanh / Đỏ trực quan
            └──> Đồng bộ kết quả lên Firebase Firestore (Cha xem từ xa)

2. Mô hình dữ liệu chuẩn (TypeScript Interfaces)
export type Subject = 'GDCD' | 'Lịch Sử' | 'Địa Lý' | 'Khác';

export interface HanVietTerm {
  word: string;             // "Lưu truyền"
  rootMeaning: string;      // "Lưu = giữ lại; Truyền = chuyển giao"
  logicalAnchor: string;    // "Giống chuyển dữ liệu qua các máy chủ"
}

export interface Lesson {
  id: string;
  userId: string;
  subject: Subject;
  title: string;
  originalText: string;
  formulaExpression?: string;
  hanVietList: HanVietTerm[];
  keywordsManual: string[];
  keywordsAiLevel1: string[]; // Từ nối, từ phụ
  keywordsAiLevel2: string[]; // Từ khóa mang điểm số
  createdAt: number;
}

export interface VerificationAttempt {
  id: string;
  lessonId: string;
  timestamp: number;
  mode: 'handwriting' | 'voice' | 'typing';
  handwritingImageUrl?: string;
  transcribedText: string;
  accuracyScore: number;       // Thang 0 - 100%
  matchedKeywords: string[];
  missingKeywords: string[];
  teacherFeedback: string;
}

3. Chiến lược lưu trữ Hybrid (IndexedDB + Firebase)
IndexedDB (Cục bộ): Sử dụng thư viện idb hoặc dexie.js.

Lưu toàn bộ cấu trúc bài học, các từ khóa đã đánh dấu, trạng thái game để con có thể học và làm bài ngay cả khi mất mạng.

Firebase Firestore & Storage (Đám mây):

lessons/{lessonId}: Lưu bài học để sao lưu.

attempts/{attemptId}: Lưu kết quả làm bài của con kèm link ảnh bài viết tay đã upload lên Firebase Storage.

Cha ở công trường hoặc đi làm xa chỉ cần mở app là thấy ngay nhật ký tiến bộ của con.

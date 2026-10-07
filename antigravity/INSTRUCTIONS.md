# ANTIGRAVITY AGENT OPERATING INSTRUCTIONS

## 1. VAI TRÒ & NGỮ CẢNH DỰ ÁN
Bạn là Kỹ sư phần mềm Fullstack cấp cao và Chuyên gia UI/UX. Bạn đang xây dựng Progressive Web App (PWA) mang tên **"Logic Recall"** dành riêng cho học sinh lớp 7 tư duy tự nhiên học các môn Xã hội (GDCD, Sử, Địa).

## 2. NGUYÊN TẮC BẮT BUỘC (GROUND RULES)
1. **Đọc kỹ tài liệu trước khi code:** Luôn tham chiếu các file trong thư mục `docs/`:
   - `01_MASTER_PLAN.md`: Triết lý sản phẩm, luồng tính năng tổng thể.
   - `02_SYSTEM_ARCHITECTURE.md`: Mô hình dữ liệu TypeScript, IndexedDB, Firebase.
   - `03_UI_UX_SPEC_KRONES.md`: Bảng màu chuẩn Krones (`#003366`, `#0066B2`), font không chân kỹ thuật, giao diện cảm ứng.
   - `04_PROMPT_ENGINEERING.md`: JSON schema cho Gemini API.
2. **Không tự ý mở rộng tính năng:** Tính năng WebMCP dời lại sau. Tập trung vào luồng cốt lõi: Nhập liệu đa kênh -> Tự soát lỗi -> Giải mã Hán-Việt -> Game xóa chữ (Vanishing) -> Viết tay ra giấy chụp ảnh so khớp Diff Xanh/Đỏ.
3. **Thực thi từng bước (Step-by-step):** Viết code hoàn chỉnh, có type definition rõ ràng, không dùng placeholder dạng `// TODO: implement later`. Sau mỗi component phải đảm bảo code build không lỗi TypeScript.

## 3. CHECKLIST TRIỂN KHAI THEO SPRINT
- [ ] **Sprint 1: Core Setup & Multi-modal Input**
  - Khởi tạo React + Vite + TypeScript + Tailwind CSS theo theme Krones Blue.
  - Cấu hình PWA manifest và service worker.
  - Hoàn thiện 4 cổng input (Gõ tay, Paste, Web Speech tiếng Việt, Chụp ảnh gửi OCR).
  - Hoàn thiện màn hình đối chiếu & tự rà soát văn bản gốc (Self-Editing).
- [ ] **Sprint 2: Logic Bridge & The Vanishing Game**
  - Bảng tra cứu từ Hán-Việt module hóa và Formula View.
  - Component xóa chữ 3 cấp độ (30%, 70%, 100%) kèm tính năng chạm lật thẻ (Peek).
  - Hỗ trợ cả 2 chế độ: Chọn từ khóa thủ công (Manual) và AI tự phân tích.
- [ ] **Sprint 3: Handwriting OCR & Diff Engine**
  - Module chụp ảnh bài làm viết tay ra giấy của con.
  - Kết nối Gemini Vision đọc chữ viết tay tiếng Việt và so khớp barem điểm.
  - Render báo cáo Diff Xanh lá / Đỏ gạch ngang trực quan.
- [ ] **Sprint 4: Persistence & Cloud Sync**
  - Lưu cục bộ IndexedDB (offline-ready).
  - Tích hợp Firebase Firestore để cha kiểm tra tiến độ học từ xa.

2. Câu lệnh kích hoạt (Kick-off Prompt) để dán vào Antigravity IDE
Khi mở dự án trong Antigravity IDE, bạn chỉ cần copy và gửi prompt sau vào khung chat của Agent để bắt đầu:

Prompt kích hoạt:

"Chào Antigravity. Tôi đã chuẩn bị toàn bộ tài liệu kiến trúc dự án PWA 'Logic Recall' trong thư mục docs/ và bản chỉ thị INSTRUCTIONS.md tại thư mục gốc.

Hãy đọc toàn bộ các file trong docs/ và INSTRUCTIONS.md để nắm rõ bối cảnh, triết lý sư phạm, bảng màu Krones Blue và các ràng buộc kỹ thuật.

Sau khi nắm rõ, bắt đầu thực hiện ngay Sprint 1:

Kiểm tra/khởi tạo cấu trúc thư mục, cấu hình vite.config.ts, tailwind.config.js, manifest.webmanifest chuẩn màu sắc Krones.

Xây dựng phân hệ Nhập liệu Đa kênh (Multi-modal Input Pipeline) gồm cả 4 phương thức (gõ tay, paste, đọc micro Web Speech tiếng Việt, tải/chụp ảnh sách) và màn hình tự soát lỗi (Self-Editing Review).

Hãy tiến hành từng bước và giải thích ngắn gọn những gì bạn đã làm."

Chỉ cần file INSTRUCTIONS.md và câu lệnh kích hoạt này, Antigravity IDE sẽ có đầy đủ "bản đồ tác chiến" để tự động triển khai mã nguồn một cách mạch lạc và chuẩn chỉ.
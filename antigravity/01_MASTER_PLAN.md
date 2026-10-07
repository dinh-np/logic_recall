# MASTER PLAN: PWA "LOGIC RECALL" CHO HỌC SINH TỰ NHIÊN

## 1. Bối cảnh & Chân dung người dùng
- **Đối tượng:** Học sinh lớp 7 có thế mạnh tư duy Tự nhiên (Toán, KHTN, Công nghệ, Tiếng Anh). 
- **Đặc điểm não bộ:** Tiếp nhận dữ liệu theo mô hình Logic/Hệ thống (`Input -> Function -> Output`).
- **Nỗi đau:** Khó khăn với các môn Xã hội (GDCD, Lịch sử, Địa lý) do văn phong trừu tượng, nhiều từ Hán - Việt hàn lâm (truyền thống, thế hệ, tư tưởng, đạo đức, lưu truyền...). Não bộ không hình thành được hình ảnh trực quan, học vẹt cơ học thì 1 tiếng sau quên sạch.
- **Triết lý giải pháp:** 
  1. *Kỹ thuật hóa môn Xã hội:* Biến định nghĩa thành công thức toán/hệ phương trình logic; mổ xẻ từ Hán - Việt dạng module ("Tách âm - Ghép nghĩa").
  2. *Truy xuất chủ động (Active Recall):* Game xóa chữ tăng dần 3 cấp độ (The Vanishing Game).
  3. *Con chữ phải chảy từ não đến tay:* Khâu kiểm tra đầu ra ưu tiên viết tay ra giấy thi thực tế, chụp ảnh để AI so khớp xanh/đỏ với bản gốc.

---

## 2. Phạm vi tính năng cốt lõi (Core Features Scope)

### Khối 1: Đa đầu vào (Multi-modal Input Pipeline)
1. Gõ phím trực tiếp.
2. Dán nhanh (Clipboard Paste).
3. Chụp ảnh trang sách giáo khoa (OCR qua Gemini Flash).
4. Đọc to thành tiếng (Voice-to-Text qua Web Speech API tiếng Việt).
*Khâu bắt buộc:* **Self-Editing Review** (Con tự rà soát, đối chiếu và sửa lại lỗi chính tả/nhận diện để kích hoạt vùng nhận thức chủ động trước khi khóa văn bản học).

### Khối 2: Cầu nối Logic & Game Xóa chữ (Logic Bridge & Vanishing Game)
1. **Giải mã Hán - Việt:** Bảng từ điển mini module hóa từng từ khó.
2. **Formula View:** Hiển thị tóm tắt định nghĩa dưới dạng công thức quan hệ nhân - quả / hệ phương trình.
3. **The Vanishing Game:**
   - *Chế độ Manual:* Cha con cùng chạm bôi đen từ khóa muốn ẩn trên màn hình cảm ứng.
   - *Chế độ AI Auto:* Gemini tự động bóc tách từ khóa cốt lõi khi cha đi làm xa.
   - *3 Cấp độ ẩn:* 
     - Level 1: Ẩn 30% (Chỉ ẩn từ nối, giữ từ khóa).
     - Level 2: Ẩn 70% (Ẩn từ khóa cốt lõi, hiện chữ cái đầu gợi ý).
     - Level 3: Ẩn 100% (Ẩn toàn bộ, chỉ hiện vạch gạch dưới).
   - *Tính năng Peek:* Chạm nhẹ vào ô bị ẩn để lật mở xem nhanh khi bị bí.

### Khối 3: Đa đầu ra & Bộ so khớp chữ viết tay (Output Verification & Diff Checker)
1. **Kênh 1 - Viết tay ra giấy (Trọng tâm):** Con viết bài ra giấy trắng -> Chụp ảnh bài viết -> Gemini Vision OCR nhận diện chữ viết tay học sinh tiếng Việt.
2. **Kênh 2 - Đọc Micro:** Trả bài bằng giọng nói theo trí nhớ (Web Speech API).
3. **Kênh 3 - Gõ phím:** Gõ lại trực tiếp trên app.
4. **Bộ so khớp Diff (Diff Engine):**
   - Màu xanh lá (`#10B981`): Đúng từ khóa barem điểm.
   - Màu đỏ gạch ngang (`#EF4444`): Từ khóa bị thiếu hoặc viết sai.
   - Điểm số % độ phủ từ khóa và lời nhận xét khích lệ sư phạm.

---

## 3. Lộ trình phát triển (Milestones)
- **Sprint 1:** Khởi tạo khung PWA Vite + React + Tailwind Krones Theme; module Input đa kênh và màn hình Self-Review. (Đã hoàn thành)
- **Sprint 2:** Xây dựng Engine Vanishing Game (Manual highlight + AI extraction + thanh trượt 3 level). (Đã hoàn thành)
- **Sprint 3:** Module chụp bài viết tay, kết nối Gemini Vision OCR chữ viết tay và render báo cáo Diff Xanh/Đỏ.
- **Sprint 4:** Tích hợp lưu trữ IndexedDB (Offline-first) và Firebase Firestore (Đồng bộ từ xa cho cha).
*(Lưu ý: Tính năng WebMCP dời lại thành dự án nâng cấp riêng biệt sau).*


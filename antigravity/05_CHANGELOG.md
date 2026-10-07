# CHANGELOG & LỊCH SỬ PHÁT TRIỂN

Tài liệu này lưu trữ toàn bộ lịch sử các thay đổi từ mốc khởi tạo đầu tiên ("1_commit lan dau") để theo dõi sát tiến độ dự án.

## Giai đoạn 1: Khởi tạo và xây dựng khung ứng dụng cơ bản
- **1_commit lan dau**: Khởi tạo dự án Logic Recall với Vite + React + Tailwind. Thiết lập thư mục `antigravity` chứa master plan và kiến trúc.
- **2-commit & 3-commit**: Bắt đầu triển khai giao diện, tích hợp các component cơ bản như App shell, giao diện người dùng.
- **4-commit**: Mở rộng các tính năng cốt lõi cho màn hình chính.

## Giai đoạn 2: Tinh chỉnh Service Worker và UX đa kênh
- **fix: Service worker aggressive caching causing white screen**: Khắc phục lỗi Service Worker cache quá mức gây ra màn hình trắng khi tải ứng dụng, tối ưu luồng offline.
- **fix: Web Speech API lifecycle and UX improvements**: Tinh chỉnh chức năng nhận diện giọng nói (Speech-to-Text), xử lý tốt hơn các vòng đời (start/stop/abort) của micro.
- **feat: use soft pause for mic instead of hardware stop**: Bổ sung chế độ tạm dừng micro mượt mà (soft pause) để nâng cao trải nghiệm người dùng, thay vì tắt phần cứng hoàn toàn.

## Giai đoạn 3: Nâng cấp Multi-modal Pipeline (Xử lý Đa đầu vào)
- **fix: use file input and canvas compression for Gemini OCR on iOS**: Tích hợp luồng chọn ảnh trực tiếp qua File Input và nén ảnh bằng HTML5 Canvas ngay tại trình duyệt để giảm dung lượng, giúp gửi ảnh mượt mà trên iOS và các thiết bị cấu hình yếu.
- **feat: complete multi-modal inputs support pdf/word/excel fix gemini model**: Hoàn thiện bộ tính năng đầu vào đa dạng: hỗ trợ nhập văn bản từ file PDF, Word (`mammoth`), Excel (`xlsx`), TXT.
- **Fix: Bypass API requests in Service Worker and update Gemini model**: Sửa lỗi chí mạng `FetchEvent.respondWith null` do Service Worker chặn các request POST dạng lớn gọi lên Google API.

## Giai đoạn 4: Bảo mật & Kiến trúc Serverless AI Fallback
- **Fix: Change model to gemini-1.5-pro**: Chuyển đổi linh hoạt giữa các model từ `gemini-1.5-flash-latest` sang `gemini-1.5-pro` để tối ưu kết quả OCR.
- **Feat: Add Fallback AI Model strategy and upgrade to Gemini 2.5 Flash**: Mặc định sử dụng model cực mạnh `gemini-2.5-flash` và cơ chế fallback tự động chuyển sang các model thế hệ trước (`2.0-flash`, `1.5-flash-002`, `1.5-pro-002`) nếu API gặp lỗi 404/503.
- **Refactor: Move Gemini API call to Vercel Serverless Function**: (Quan trọng) Chuyển toàn bộ logic gọi Gemini API từ Client-side (Frontend React) sang Backend-side sử dụng **Vercel Serverless Function** (`/api/extract-text.ts`). Nâng cấp này giúp ẩn hoàn toàn API Key, vượt qua các lỗi CORS, và xử lý mượt mà cơ chế model fallback từ phía Server.

## Giai đoạn 5: Hoàn thiện & Khắc phục rủi ro vận hành (Đóng Sprint 1)
- **Feat: Add diagnose endpoint and improve Gemini 404 error handling**: Tạo endpoint `/api/diagnose.ts` để kiểm tra trực tiếp quyền hạn API Key từ Google AI Studio, giúp chẩn đoán nhanh lỗi 404. Cập nhật thông báo lỗi thân thiện trên giao diện.
- **Fix: Hardcode gemini-2.5-flash in backend and remove fallback**: Xóa bỏ logic fallback quá tải gây hiểu nhầm ở Frontend, ép sử dụng duy nhất model được chỉ định trên Server.
- **Fix: Update model to gemini-3.8-flash based on API deprecation notice**: Phát hiện lỗi `gemini-2.5-flash` bị khóa với tài khoản mới, lập tức cập nhật lên model mới nhất `gemini-3.8-flash` theo đúng khuyến cáo từ hệ thống Google.
- **Feat: Add 503 retry and PDF loading UI**: Hoàn thiện Sprint 1 bằng cơ chế `generateWithRetry` (tự động chờ 1.5s và thử lại tối đa 2 lần khi gặp lỗi 503 High Demand, sau đó fallback sang `gemini-3.6-flash`). Bổ sung trạng thái Loading UI thân thiện phân biệt giữa việc đọc Ảnh và đọc file PDF dung lượng lớn. Đồng bộ luồng nén Canvas cho Camera.

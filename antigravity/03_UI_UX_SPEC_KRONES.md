```markdown
# UI/UX SPECIFICATION - KRONES INDUSTRIAL DESIGN SYSTEM

## 1. Bảng màu chuẩn Krones (Color Palette)

| Mã màu | Tên gọi | Ứng dụng |
| :--- | :--- | :--- |
| `#003366` | **Krones Deep Navy** | Header chính, nút hành động chốt chặn (Primary Buttons), icon chủ đạo. |
| `#0066B2` | **Technical Blue** | Thanh trượt Level slider, viền thẻ bài active, nút phụ (Secondary Buttons). |
| `#E6EFF7` | **Krones Ice Blue** | Nền thẻ bài học, background của các từ khóa được highlight. |
| `#00254D` | **Deep Hover** | Trạng thái hover/active của các nút chính. |
| `#F4F6F9` | **Neutral Background** | Màu nền toàn màn hình, giảm mỏi mắt khi học lâu. |
| `#FFFFFF` | **Pure White** | Nền các khối Card, ô soạn thảo văn bản. |
| `#10B981` | **Diff Correct (Green)** | Highlight chữ con viết đúng từ khóa barem (`diff-correct`). |
| `#EF4444` | **Diff Missing (Red)** | Gạch ngang chữ con viết thiếu hoặc sai (`diff-missing`). |

---

## 2. Typography & Phông chữ kỹ thuật
- **Font Family:** Ưu tiên họ font sans-serif chuẩn kỹ thuật của Krones:
  ```css
  font-family: 'Univers', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;


Quy tắc phân cấp:

Header Title: 18px - Bold, chữ hoa kỹ thuật.

Formula Box: Phông đơn khoảng cách (font-mono), nền bo góc nhẹ.

Nội dung bài học: 16px - Line-height: 1.6, khoảng cách chữ thoáng để dễ chạm bôi đen.

3. Tối ưu tương tác cảm ứng (Touch & Tablet Optimized)
Toàn bộ button, thanh trượt, checkbox có kích thước chạm tối thiểu 48x48px.

Tương thích tốt với thao tác bút cảm ứng (Samsung S-Pen, Apple Pencil) để con chạm bôi đen từ khóa mượt mà.

Khung hiển thị Diff bài viết tay chia thành dạng Split-View (Nửa trên: Ảnh chụp bài viết tay thật; Nửa dưới: Chữ nhận diện được bôi xanh đỏ) trên màn hình iPad/Laptop.
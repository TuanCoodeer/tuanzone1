# 📋 NHẬT KÝ CẬP NHẬT DỰ ÁN — tuBIzOne (tuanzone1)

## 📅 Phiên làm việc ngày 17/09/2026

### 1. Phân chia độc lập các kho game (Theo chuẩn Giao diện yêu cầu)
- **Tách riêng 4 kho tài khoản riêng biệt:**
  - Kho Free Fire
  - Kho Liên Quân Mobile
  - Kho FC Mobile / Roblox
  - Kho Túi Mù May Mắn Free Fire
- Đồng bộ bộ lọc (filter theo Prime, Rank, OVR, Giá tiền) và danh sách hiển thị theo từng kho mà không làm xáo trộn cấu trúc các kho khác.

### 2. Nâng cấp bảo mật Authentication chuẩn công nghiệp (Industry Standard Security)
- **Băm mật khẩu (Hashing & Salting):** Tích hợp thư viện chuẩn `bcryptjs` với work factor 10, tự động sinh muối ngẫu nhiên cho từng tài khoản. Loại bỏ hoàn toàn việc lưu mật khẩu thô hoặc SHA-256 cơ bản.
- **Chống Brute-force & Credential Stuffing:** Cơ chế In-memory Rate Limiting & Account Lockout – tự động khóa tài khoản 15 phút nếu nhập sai mật khẩu quá 5 lần liên tiếp.
- **Chính sách mật khẩu nghiêm ngặt (Password Policy):** Chuẩn NIST / OWASP – độ dài từ 8 đến 64 ký tự, bắt buộc phải có chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (@$!%*?&#...).
- **Generic Error Messages:** Thông báo lỗi đăng nhập chung ("Tên đăng nhập hoặc mật khẩu không chính xác") nhằm triệt tiêu lỗ hổng dò quét danh tính người dùng (Username Enumeration).
- **Chống XSS & Data Sanitization:** Khử khuẩn mọi dữ liệu đầu vào người dùng trước khi hiển thị lên DOM.

### 3. Thêm KHO CHỨC NĂNG ADMIN (Cách ly tuyệt đối)
- Bổ sung vùng quản trị độc quyền nằm ngay bên dưới kho FC Mobile.
- **Cách ly tuyệt đối:** Chỉ tài khoản Quản trị viên (Admin) mới có thể nhìn thấy nhóm danh mục này và được cấp quyền truy cập. Người dùng thông thường bị chặn cả trên giao diện lẫn cấp độ định tuyến Hash (`#kho-admin`), nếu cố tình truy cập sẽ tự động bị đá về trang chủ.
- **Tích hợp 5 tab tính năng quản trị chuyên sâu:**
  1. *Đăng bán nick mới vào kho.*
  2. *Duyệt nạp tiền thực tế (ATM / Thẻ cào) & tự động cộng số dư cho khách.*
  3. *Báo cáo doanh thu & đơn hàng realtime phân chia theo từng game.*
  4. *Quản lý lịch sử giao dịch toàn bộ shop.*
  5. *Quản lý danh sách thành viên đã đăng ký.*

### 4. Bổ sung các nút Reset & Xóa thành viên
- Thêm nút **Xóa từng thành viên** trong danh sách thành viên (có popup xác nhận).
- Thêm nút **Reset doanh thu về 0đ** (xóa sạch đơn hàng và làm mới doanh thu).
- Thêm nút **Reset duyệt nạp tiền** (xóa sạch các yêu cầu nạp tiền tồn đọng).
- Thêm nút **Reset lịch sử giao dịch** (xóa sạch toàn bộ lịch sử đơn hàng trên hệ thống).

### 5. Khắc phục lỗi số lượng kho & Dọn dẹp nick mẫu ảo
- **Gỡ bỏ auto-injection:** Xóa bỏ hoàn toàn đoạn mã tự sinh 4 túi mù mẫu (`TM-FF-01` -> `TM-FF-04`).
- **Thanh lọc triệt để:** Tự động lọc sạch và xóa các nick mẫu ảo khỏi LocalStorage và Supabase Cloud để không bị sync ngược lại.
- **Đồng bộ chuẩn số lượng toàn shop:** Bổ sung hàm `store.getTotalAvailableAccounts()` đếm chính xác tổng các nick đang mở bán ở **toàn bộ shop (gồm tất cả các kho gộp lại)**.
- Gắn hàm đếm realtime vào thẻ *Đăng Bán Nick Mới* (`#cat-count-admin-total`), đảm bảo số lượng luôn chuẩn xác 100%.

---
**Trạng thái Git:** Toàn bộ mã nguồn đã được commit và đồng bộ thành công lên nhánh `main` của repository GitHub (`TuanCoodeer/tuanzone1`).

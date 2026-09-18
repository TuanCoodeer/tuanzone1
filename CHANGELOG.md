# 📋 NHẬT KÝ CẬP NHẬT DỰ ÁN — tuBIzOne (tuanzone1)

## 📅 Phiên làm việc ngày 18/09/2026

### 1. Tích hợp bộ Icon Bậc Prime (Prime 1 -> Prime 8) cho Kho Free Fire
- **Kho lưu trữ tài nguyên:** Tạo thư mục `assets/prime-icons/` lưu trữ trọn bộ 8 icon vương miện Bậc Prime (Prime 1 đến Prime 8) định dạng PNG trong suốt.
- **Xử lý đồ họa:** Tự động cân chỉnh bounding box để 8 icon đạt độ đồng đều và sắc nét tối đa trên giao diện người dùng.
- **Nâng cấp giao diện nút lọc:**
  - Chuyển đổi 8 nút bấm lọc từ dạng chữ sang dạng nút icon vương miện bấm được (`.filter-chip-prime`).
  - Giữ nguyên nút "Tất cả Prime" với trạng thái mặc định.
  - Tích hợp hiệu ứng viền vàng kim `#f59e0b`, hào quang phát sáng khi hover và active, đảm bảo đồng bộ hoàn hảo với logic lọc tài khoản.

### 2. Hiệu ứng Lưới Tinh Thể Đa Giác & Hào Quang Vàng Ánh Kim (Prime 6 - 8)
- **Lưới tinh thể đa giác 3D (Low-Poly Crystal Facet Mesh):** Xây dựng module canvas chuyên trách `PrimeCrystalAura` vẽ mạng lưới tam giác đa giác phản quang kim cương bao phủ toàn màn hình giống hệt ảnh mẫu trong game khi bấm vào các nút **Prime 6, Prime 7, Prime 8**.
- **Hiệu ứng quét sáng (Dynamic Light Sweep):** Nguồn sáng quét chéo qua các mặt cắt tinh thể tạo ánh phản quang lấp lánh chân thực, đường viền facet wireframe vàng kim tinh tế và biến đổi sắc thái theo cấp Prime (Prime 6 Vàng Hoàng Kim ➔ Prime 7 Ánh Dương Lửa ➔ Prime 8 Kim Cương Huyền Thoại).
- **Hào quang góc & Tia sáng động:** Đồng bộ với lớp hào quang ửng vàng ánh kim tại các góc màn hình và chùm hạt sáng bắn lên từ 2 góc dưới.
- **Loại bỏ hiệu ứng màn hình cho Prime 5:** Nút Prime 5 được cách ly hoàn toàn, khi nhấn chỉ thực hiện lọc tài khoản nội bộ và không kích hoạt bất kỳ hiệu ứng màn hình nào theo yêu cầu người dùng.

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

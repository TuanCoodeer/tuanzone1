# Kế Hoạch Triển Khai: Khu Vực Chi Tiết Tài Khoản (Account Detail View) & Nâng Cấp Form Thêm Acc Album Kho Đồ

## Tổng quan mục tiêu
Nâng cấp trải nghiệm người dùng trên website `tuBIzOne.com`:
1. **Chuyển đổi luồng click tài khoản (Ảnh 2 -> Ảnh 3)**: Khi khách hàng bấm vào một thẻ tài khoản bất kỳ trong shop, thay vì chỉ mở popup mua đơn điệu, trang web sẽ chuyển mượt mà sang **Khu Vực Xem Chi Tiết Tài Khoản (Account Detail View)** chuyên nghiệp:
   - **Thanh Breadcrumb & Nút điều hướng**: `Trang chủ > Kho [Game] > Chi tiết nick #[ID]` + Nút `← Quay lại kho nick`.
   - **Cột Trái (Gallery Kho Đồ Gaming)**: Khung ảnh lớn sắc nét (High-res Viewport), nút "🔍 Xem ảnh lớn" (Lightbox phóng to), kèm thanh trượt danh sách thumbnail bên dưới (`<` `>` và bộ đếm `(1/N)`), click vào ảnh nào sẽ hiển thị ngay ảnh đó.
   - **Cột Phải (Thông tin chi tiết & Mua sắm)**: Tiêu đề nick, mã số `#ID`, bảng thông số (Game, Loại nick, Rank/Prime/OVR, Tình trạng bảo mật), khung giá bán nổi bật màu đỏ rực rỡ (`15.800.000 đ` hoặc giá nick thực tế), nút CTA lớn **"Mua Ngay"**, hàng nút phụ tiện ích: **"Nạp thẻ"** (hồng tím) và **"Nạp ATM"** (xanh cyan).
   - **Khối Mô tả dịch vụ**: Chi tiết thông tin súng/skin/acc và cam kết bảo hành.
   - **Khối Tài khoản liên quan**: Danh sách 4-5 tài khoản cùng game để khách dễ dàng xem thêm.
2. **Nâng cấp Form "Thêm Acc Vào Kho" của Admin (Ảnh 1)**:
   - Bổ sung trường nhập **Album ảnh kho đồ** (cho phép Admin dán nhiều link ảnh URL, mỗi dòng 1 ảnh hoặc cách nhau dấu phẩy).
   - Hỗ trợ thêm trường **Cấp độ/Rank**, **Loại nick**.
   - Bổ sung **Live Preview Thumbnail**: Xem trước ngay album ảnh vừa dán trực quan trước khi bấm "Đăng bán acc vào kho ngay".
   - Tự động sinh danh sách ảnh album cho các nick hiện có hoặc nick tạo mới.
3. **Nguyên tắc tôn trọng dữ liệu**:
   - Tuân thủ nghiêm ngặt lưu ý của người dùng: *(LƯU Ý KO LÀM Y CHANG HAY ĐỔI DỮ LIỆU WEB ĐỂ Y CHANG TRONG ẢNH, ẢNH CHỈ MANG TÍNH CHẤT THAM KHẢO)*.
   - Giữ nguyên cấu trúc dữ liệu hiện tại (Free Fire, Liên Quân, FC Mobile), không bịa dữ liệu giả đè lên hệ thống, phong cách thiết kế Cyber Esports Minimalist đặc trưng của tuanzOne.com.

---

## User Review Required

> [!IMPORTANT]
> - **Điều hướng linh hoạt**: Sử dụng SPA View Switcher kết hợp URL hash `#acc-{id}`:
>   - Khi người dùng bấm vào thẻ acc: Web ẩn giao diện kho shop và cuộn mượt mở khu vực Chi Tiết Nick.
>   - Khách có thể bấm nút "← Quay lại kho nick", bấm Breadcrumb "Trang chủ" / "Shop", hoặc nút Back của trình duyệt để quay về danh sách shop bất cứ lúc nào mà không bị reload trang.
> - **Chính sách tài khoản Admin**: Vẫn áp dụng nghiêm ngặt quy tắc Admin không có số dư ảo và không được mua nick, bảo toàn logic an toàn kinh doanh thực tế.

---

## Chi tiết các bước triển khai

### 1. Cấu trúc Giao diện HTML (`index.html`)
- Thêm section `#view-account-detail` vào trong `<main class="container">` (ẩn mặc định).
- Cấu trúc gồm:
  - `.detail-nav-bar`: Nút back + Breadcrumbs.
  - `.account-detail-grid`:
    - `.detail-gallery-column`:
      - `.main-showcase-box`: `<img>` lớn + nút `btn-zoom-image` + badge rank/id.
      - `.thumb-carousel-wrap`: Nút Prev, container `.thumb-list`, nút Next, badge số ảnh `(1/N)`.
    - `.detail-info-column`:
      - Tiêu đề & Mã nick (kèm nút copy nhanh).
      - Bảng `.detail-spec-table`: Tựa game, Loại tài khoản, Rank/Prime/OVR, Bảo mật (100% Trắng thông tin), Tình trạng.
      - Khung giá `.detail-price-box`: Giá lớn màu đỏ cam/neon rực rỡ + câu slogan cam kết.
      - Nút hành động chính `.btn-detail-buy-now` ("MUA NGAY").
      - Cụm nút phụ: `.btn-detail-topup-card` ("Nạp thẻ") và `.btn-detail-topup-atm` ("Nạp ATM").
  - `.detail-desc-card`: Khối "Chi tiết dịch vụ" hiển thị mô tả acc và cam kết shop.
  - `.related-accounts-section`: Khối "Tài khoản liên quan" render danh sách acc cùng thể loại.
- Nâng cấp Modal `#admin-add-acc-modal`:
  - Thêm ô chọn Loại tài khoản (`Tự chọn`, `VIP Trắng Thông Tin`, `Siêu Phẩm`).
  - Thêm ô nhập Rank/Bậc Hạng.
  - Thay vì 1 ô link ảnh đơn, cung cấp ô nhập **Ảnh đại diện** + Textarea nhập **Danh sách link ảnh kho đồ / chi tiết** (mỗi dòng 1 ảnh).
  - Thêm khung Live Preview xem trước ảnh ngay trong modal.

### 2. Giao diện & Hiệu ứng CSS (`styles/components.css` & `styles/modals.css`)
- Thiết kế layout 2 cột chuẩn tỉ lệ như ảnh 3 (Left: 58% Gallery, Right: 42% Info) trên Desktop, tự động co về 1 cột trên Mobile/Tablet.
- Hiệu ứng chuyển ảnh thumbnail mượt mà, thumbnail đang chọn có viền sáng neon active.
- Styling khung giá tiền đỏ rực rỡ với font chữ Outfit số to sắc nét.
- Nút "Nạp thẻ" (hồng cánh sen `#ff2d75`) và "Nạp ATM" (xanh cyan `#00a8ff`) với hiệu ứng hover bóng bẩy.
- Styling khối "Tài khoản liên quan" với grid thẻ acc chuẩn đẹp.
- Thêm Lightbox modal để phóng to ảnh toàn màn hình khi bấm "🔍 Xem ảnh lớn".

### 3. Logic Xử lý & Dữ liệu (`js/app.js` & `js/store.js`)
- **`js/store.js`**:
  - Nâng cấp `addAccount(data)` để hỗ trợ mảng `images` (album ảnh kho đồ).
  - Tự động fallback nếu acc chỉ có 1 ảnh thì sinh gallery tối thiểu hoặc hỗ trợ xem ảnh chính.
- **`js/app.js`**:
  - Gắn sự kiện click vào thẻ acc (ảnh, tiêu đề, nút chi tiết) -> gọi `openAccountDetail(accId)`.
  - Hàm `renderAccountDetail(acc)`: Điền đầy đủ thông tin, khởi tạo gallery, bắt sự kiện click thumbnail đổi ảnh lớn, cập nhật bộ đếm ảnh.
  - Hàm `renderRelatedAccounts(currentGame, currentAccId)`: Lấy các nick cùng game và render danh sách tài khoản liên quan.
  - Sự kiện nút "Mua Ngay" từ view chi tiết: Tái sử dụng luồng kiểm tra số dư và bàn giao nick an toàn.
  - Sự kiện nút "Nạp Thẻ" và "Nạp ATM": Mở modal nạp tiền tương ứng với số tiền cần nạp.
  - Sự kiện Admin: Cập nhật form thêm acc để lấy danh sách ảnh album, cập nhật live preview.
  - Xử lý URL hash `#acc-{id}` và nút quay lại (`closeAccountDetail()`).

---

## Verification Plan

### Automated / Browser Verification
1. Kiểm tra không có lỗi syntax trong JS / CSS / HTML.
2. Kiểm tra giao diện qua Browser subagent hoặc dev server:
   - Click vào thẻ tài khoản bất kỳ -> View chuyển sang Trang Chi Tiết Nick mượt mà.
   - Thử chuyển qua lại các ảnh trong album kho đồ -> Ảnh lớn cập nhật chính xác.
   - Bấm nút "Quay lại kho nick" hoặc Breadcrumb -> Quay về danh sách kho nick ban đầu.
   - Mở modal Thêm Acc của Admin -> Kiểm tra trường nhập album ảnh và live preview.
   - Bấm thử nút Mua Ngay, Nạp thẻ, Nạp ATM từ trang chi tiết -> Hoạt động trơn tru.
3. Commit Git sạch sẽ và đẩy lên GitHub `TuanCoodeer/tuanzone1`.

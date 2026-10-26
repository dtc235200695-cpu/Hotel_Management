# HotelCloud – Hệ Thống Quản Lý Khách Sạn & Đặt Phòng Trực Tuyến Trên Nền Tảng Đám Mây

Hệ thống quản lý khách sạn và cổng đặt phòng nghỉ dưỡng 5 sao chuyên nghiệp trên nền tảng điện toán đám mây công cộng (Public Cloud Computing), xây dựng theo tài liệu đặc tả [HotelCloud-de-tai.md](./HotelCloud-de-tai.md).

---

## 🌟 Điểm Nổi Bật & Các Chức Năng Cốt Lõi Của Hệ Thống

### 1. Cổng Thông Tin & Đặt Phòng Nghỉ Dưỡng Công Cộng (Public Luxury Resort Website)
- **Giao diện 5 sao đẳng cấp:** Phong cách *Dark Luxury & Champagne Gold*, hiệu ứng thị giác sang trọng, tương thích hoàn hảo trên Mobile, Tablet và Desktop.
- **Tìm kiếm phòng trống thông minh:** Bộ lọc theo ngày nhận phòng (Check-in), ngày trả phòng (Check-out) và số lượng khách lưu trú.
- **Showcase 5 hạng phòng cao cấp:** Standard Queen, Superior City View, Deluxe Ocean & Garden, Executive Suite, Presidential Penthouse với đầy đủ tiện nghi, ảnh minh họa và giá niêm yết.
- **Đặt phòng trực tuyến tức thì:** Khách hàng điền thông tin, chọn phương thức thanh toán (**Quét mã VietQR** tự động hoặc Tiền mặt khi nhận phòng) và nhận ngay **Phiếu Xác Nhận Đặt Phòng Điện Tử (Booking Voucher)** kèm mã đặt phòng duy nhất.
- **Tra cứu đặt phòng trực tuyến (Self-service Booking Lookup):** Khách hàng chỉ cần nhập **Mã đặt phòng (VD: `BK-20261021-104`)** hoặc **Số điện thoại**, hệ thống hiển thị chi tiết phòng, lịch trình, số tiền cọc và trạng thái phòng.
- **Tiện ích & Trải nghiệm nghỉ dưỡng:** Giới thiệu Nhà hàng Á - Âu Golden Lotus, Bể bơi vô cực ngắm hoàng hôn, Lotus Herbal Spa, Xe Limousine đưa đón sân bay 24/7, Đánh giá chân thực từ khách hàng và mục Hỏi đáp FAQ.

---

### 2. Trợ Lý Ảo Thông Minh HotelCloud AI Concierge 24/7 (AI Chatbot)
- **Cửa sổ Chatbot nổi (Floating Widget):** Hoạt động xuyên suốt cả trên Website công cộng lẫn Hệ thống quản lý PMS nội bộ.
- **Tra cứu dữ liệu thời gian thực (Real-time Database Engine):**
  - Tra cứu giá và thông tin các hạng phòng: Gợi ý hạng phòng phù hợp ngân sách và sở thích.
  - Kiểm tra tình trạng phòng trống thực tế trong ngày, tỷ lệ công suất phòng.
  - Tra cứu chi tiết đơn đặt phòng bằng mã đơn hoặc số điện thoại.
  - Cung cấp chính sách khách sạn: Giờ Check-in (14:00) & Check-out (12:00), mật khẩu WiFi, chính sách hủy phòng, thông tin dịch vụ đưa đón sân bay và Spa.
  - **Hỗ trợ nhân viên PMS:** Thống kê nhanh doanh thu đã thanh toán, số đơn đặt phòng mới, danh sách phòng cần dọn dẹp (Cleaning) và thông tin khách VIP.
- **Thẻ tương tác trực tiếp (Interactive Cards):** Cho phép bấm nút *"Đặt Ngay Hạng Phòng Này"* trực tiếp từ màn hình trò chuyện.

---

### 3. Hệ Thống Quản Lý Khách Sạn Chuyên Nghiệp (PMS Dashboard)
- **Sơ đồ phòng trực quan (Interactive Floor Plan):**
  - Quản lý 5 tầng lầu với 28 phòng nghỉ tiện nghi.
  - Phân loại rõ ràng 5 trạng thái phòng: 🟢 *Trống (Available)*, 🟡 *Đã giữ chỗ (Reserved)*, 🔴 *Đang lưu trú (Occupied)*, 🔵 *Đang dọn dẹp (Cleaning)*, ⚫ *Bảo trì (Maintenance)*.
  - Xem chi tiết phòng, nhận phòng nhanh (Walk-in Check-in), gọi dịch vụ tận phòng, thanh toán & trả phòng (Check-out).
  - **Chỉnh sửa & Xóa phòng:** Hỗ trợ Admin/Quản lý cập nhật số phòng, tầng lầu, hạng phòng hoặc xóa phòng.
  - **Thêm phòng mới:** Hỗ trợ mở rộng số lượng phòng trực tiếp trên giao diện.
- **Quản lý Danh mục Hạng phòng (Room Types Management):**
  - Xem danh mục các hạng phòng, giá niêm yết, tiện nghi, sức chứa và số phòng trống thực tế.
  - **Chỉnh sửa & Tạo mới hạng phòng:** Quản trị viên có thể tùy biến giá phòng theo mùa, thêm tiện ích mới hoặc tạo thêm hạng phòng cao cấp.
- **Quản lý Đặt phòng & Thuật toán Chống Trùng Lịch (Anti-Collision Booking System):**
  - Quản lý toàn bộ danh sách đặt phòng với bộ lọc trạng thái (*Confirmed, Checked-in, Checked-out, Cancelled*).
  - **Thuật toán chống xung đột thời gian thực:** Tự động phát hiện và ngăn chặn việc đặt trùng phòng nếu có khách đã đặt trong khoảng ngày tương tự.
  - **Chỉnh sửa đơn đặt phòng:** Hỗ trợ đổi ngày, thay đổi số khách hoặc đổi số phòng linh hoạt.
- **Quản lý Khách hàng & Lịch sử Lưu trú (Customers & Stay History):**
  - Quản lý hồ sơ khách hàng: Họ tên, CMND/CCCD, số điện thoại, email, quốc tịch và ghi chú VIP.
  - **Lịch sử lưu trú toàn diện:** Nhấp vào từng khách hàng để xem toàn bộ danh sách các lần lưu trú trong quá khứ, các phòng từng ở, thời gian và tổng chi tiêu tích lũy.
- **Quản lý Dịch vụ Phòng (Room Services):**
  - Danh mục dịch vụ phong phú: Ẩm thực tại phòng, Minibar, Giặt là cao cấp, Xe Limousine đưa đón sân bay, Spa & Massage thảo dược, Thuê xe tự lái.
  - Gọi dịch vụ trực tiếp cho phòng đang ở với số lượng linh hoạt, tự động cộng dồn vào hóa đơn thanh toán khi trả phòng.
- **Thanh toán & Hóa đơn Điện tử (Invoicing & Checkout):**
  - Tự động tổng hợp: Tiền phòng (theo số đêm thực tế) + Tiền dịch vụ sử dụng + Thuế VAT 8% - Tiền đặt cọc - Chiết khấu voucher.
  - Đa dạng phương thức thanh toán: Chuyển khoản VietQR, Tiền mặt, Thẻ tín dụng.
  - **In hóa đơn chuẩn khách sạn (Print Invoice):** Chế độ xem trước và in hóa đơn đẹp mắt, tự động ẩn giao diện thừa khi in.
- **Báo cáo Hoạt động & Doanh thu (Analytics & Reports):**
  - Thống kê tỷ lệ lấp đầy phòng (Occupancy Rate %).
  - Biểu đồ doanh thu 7 ngày gần nhất, cơ cấu doanh thu theo từng hạng phòng.
  - Danh sách các hóa đơn thanh toán gần đây và phòng đang lưu trú.

---

### 4. Tài Khoản & Phân Quyền Vai Trò (Role-Based Access Control)
- Đăng nhập/Đăng xuất bằng tài khoản nhân viên.
- **3 vai trò chuẩn:**
  1. **Quản trị viên (Admin):** Toàn quyền cấu hình phòng, hạng phòng, nhân sự và sao lưu đám mây.
  2. **Lễ tân (Receptionist):** Quản lý khách hàng, sơ đồ phòng, đặt phòng, check-in, gọi dịch vụ, trả phòng và xuất hóa đơn.
  3. **Quản lý (Manager):** Theo dõi báo cáo kinh doanh, doanh thu, công suất phòng và giá cả dịch vụ.
- **Thanh chuyển đổi vai trò nhanh (Quick Role Switcher):** Cho phép chuyển đổi linh hoạt giữa Admin, Lễ tân và Quản lý để trải nghiệm demo thuận tiện.
- **Nút chuyển đổi chế độ xem (View Mode Switcher):** Dễ dàng chuyển qua lại giữa **"Trang Khách Đặt Phòng" (Public Website)** và **"Quản Lý Khách Sạn" (PMS Dashboard)** chỉ với 1 click trên Navbar.

---

### 5. Thực Nghiệm Điện Toán Đám Mây (Cloud Computing Highlights)
- **Đo lường độ trễ mạng thời gian thực (Live Cloud Edge Latency Monitor):** Đo ping API trực tiếp với hiệu ứng xung nhịp dạ quang.
- **Sao lưu dữ liệu đám mây (Cloud Backup Snapshot):** Xuất toàn bộ dữ liệu hệ thống (Phòng, Đặt phòng, Khách hàng, Hóa đơn, Dịch vụ) thành tệp JSON có tem thời gian chỉ với 1 cú click.
- **Phục hồi thảm họa (Disaster Recovery Simulation):** Khôi phục dữ liệu mẫu ban đầu tức thì khi có sự cố.
- **Kiến trúc Serverless Ready:** Cung cấp sẵn file cấu hình [wrangler.jsonc](./wrangler.jsonc) và file SQL schema [server/schema.sql](./server/schema.sql) tương thích hoàn toàn với Cloudflare Pages và Cloudflare D1.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18+ (Đã kiểm thử hoạt động hoàn hảo trên Node v20/v24).
- **npm**: Đi kèm Node.js.

### 2. Khởi chạy dự án
Ứng dụng được thiết lập chạy đồng thời cả Backend API và Frontend Client chỉ với một lệnh duy nhất:

```bash
# Khởi chạy đồng thời Backend (port 5000) và Frontend (port 3000)
npm run dev
```

Sau khi chạy lệnh:
- **Trang web đặt phòng / Hệ thống PMS:** Mở trình duyệt truy cập: `http://localhost:3000/`
- **Backend API Server:** Hoạt động tại: `http://localhost:5000/`

---

## 👥 Tài Khoản Mẫu Trải Nghiệm Hệ Thống

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `admin123` | Toàn quyền cấu hình phòng, hạng phòng, tài khoản, sao lưu Cloud |
| **Lễ tân (Receptionist)** | `letan` | `letan123` | Sơ đồ phòng, Đặt phòng, Check-in, Dịch vụ, Trả phòng, Khách hàng |
| **Quản lý (Manager)** | `quanly` | `quanly123` | Theo dõi doanh thu, báo cáo, giá dịch vụ, quản lý phòng |

> 💡 **Mẹo:** Bạn có thể đổi vai trò ngay trên góc phải thanh điều hướng (Navbar) bằng dropdown **"Vai trò"** mà không cần đăng xuất/đăng nhập lại.

---

## ☁️ Triển Khai Lên Nền Tảng Đám Mây Cloudflare

Hệ thống đã được tối ưu sẵn với file cấu hình [wrangler.jsonc](./wrangler.jsonc) để triển khai tĩnh SPA:

```bash
# 1. Cài đặt dependencies (nếu chưa có)
npm install

# 2. Xây dựng gói sản phẩm tĩnh
npm run build

# 3. Triển khai lên Cloudflare Workers / Pages
npx wrangler deploy
```


# HotelCloud – Hệ Thống Quản Lý Khách Sạn Trên Nền Tảng Đám Mây

Hệ thống quản lý khách sạn chuyên nghiệp trên nền tảng điện toán đám mây công cộng (Public Cloud Computing), xây dựng theo tài liệu đặc tả [HotelCloud-de-tai.md](./HotelCloud-de-tai.md).

---

## 🌟 Điểm Nổi Bật Của Hệ Thống

1. **Thiết kế chuẩn 5 sao (Dark Luxury & Gold Accents):**
   - Tông màu đen sang trọng kết hợp vàng hoàng gia (Champagne Gold), hiệu ứng kính mờ (Glassmorphism), huy hiệu trạng thái dạ quang và kiểu chữ cao cấp (*Playfair Display* & *Plus Jakarta Sans*).
2. **Nghiệp vụ đầy đủ & Liền mạch (End-to-End Workflow):**
   - **Sơ đồ phòng trực quan (Floor Plan):** Phân chia theo 5 tầng (Tầng 1 đến Tầng 5 với 28 phòng tiện nghi), theo dõi 5 trạng thái phòng: *Trống (Available), Đã đặt (Reserved), Đang ở (Occupied), Đang dọn dẹp (Cleaning), Bảo trì (Maintenance)*. Hỗ trợ tạo thêm phòng mới trực tiếp qua giao diện.
   - **Chọn Hạng Phòng Có Sẵn (Room Types Showcase):** Tab chuyên biệt xem đầy đủ 5 hạng phòng (*Standard, Superior, Deluxe, Suite, President*), tiện nghi, sức chứa, ảnh phòng và số phòng trống thực tế, kèm nút đặt phòng trực tiếp theo hạng phòng mong muốn.
   - **Đặt phòng & Chống trùng lịch (Anti-Collision Algorithm):** Kiểm tra xung đột thời gian thực giữa ngày Check-in và Check-out, hỗ trợ chọn nhanh hạng phòng có sẵn và số phòng cụ thể.
   - **Lưu trú & Check-in linh hoạt:** Nhận phòng nhanh từ đơn đặt trước hoặc Check-in trực tiếp tại quầy (Walk-in).
   - **Quản lý dịch vụ phòng (Room Services):** Gọi dịch vụ trực tiếp cho phòng đang ở (Ẩm thực, Minibar, Giặt là cao cấp, Đưa đón sân bay, Spa & Massage, Thuê xe).
   - **Check-out & Hóa đơn chi tiết:** Tự động tính tiền phòng + toàn bộ dịch vụ + thuế VAT 8% - tiền cọc - chiết khấu/voucher. Hỗ trợ xem trước và in hóa đơn trực tiếp (`Print Invoice`).
   - **Báo cáo doanh thu & Quản lý:** Theo dõi tỷ lệ lấp đầy phòng (Occupancy Rate %), doanh thu ngày/tháng, cơ cấu doanh thu theo từng hạng phòng.
   - **Phân quyền 3 vai trò:** *Admin (Quản trị viên)*, *Receptionist (Lễ tân)*, *Manager (Quản lý)* với thanh chuyển đổi vai trò nhanh (Quick Role Switcher) để demo tiện lợi.
3. **Thực nghiệm Điện toán Đám mây (Cloud Computing Highlights):**
   - **Đo lường độ trễ mạng thời gian thực (Cloud Edge Latency Monitor):** Hiển thị live ping đến Cloud API.
   - **Sao lưu cơ sở dữ liệu (Cloud Backup Snapshot):** Xuất toàn bộ dữ liệu hệ thống thành tệp JSON có tem thời gian chỉ với 1 cú click.
   - **Phục hồi thảm họa (Disaster Recovery Simulation):** Khôi phục dữ liệu mẫu ban đầu tức thì.
   - **Tương thích Cloudflare D1 & Pages:** Cung cấp sẵn file schema SQL SQLite chuẩn cho Cloudflare D1 (`schema.sql`).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18+ (Đã kiểm thử hoạt động hoàn hảo trên Node v24).
- **npm**: Đi kèm Node.js.

### 2. Khởi chạy dự án
Ứng dụng được thiết lập chạy đồng thời cả Backend API và Frontend Client chỉ với một lệnh duy nhất:

```bash
# Khởi chạy đồng thời Backend (port 5000) và Frontend (port 3000)
npm run dev
```

Sau khi chạy lệnh:
- **Giao diện Web:** Mở trình duyệt truy cập: `http://localhost:3000/`
- **Backend API:** Hoạt động tại: `http://localhost:5000/`

---

## 👥 Tài Khoản Mẫu Trải Nghiệm Hệ Thống

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `admin123` | Toàn quyền cấu hình, tài khoản nhân sự, sao lưu Cloud |
| **Lễ tân (Receptionist)** | `letan` | `letan123` | Sơ đồ phòng, Đặt phòng, Check-in, Dịch vụ, Trả phòng |
| **Quản lý (Manager)** | `quanly` | `quanly123` | Theo dõi doanh thu, báo cáo, giá dịch vụ, quản lý phòng |

> 💡 **Mẹo:** Bạn có thể đổi vai trò ngay trên góc phải thanh điều hướng (Navbar) bằng dropdown **"Vai trò"** mà không cần đăng xuất/đăng nhập lại.

---

## ☁️ Triển Khai Lên Nền Tảng Đám Mây Cloudflare

Hệ thống được thiết kế theo đúng **Phương án A** của đề tài:

```bash
# 1. Tạo cơ sở dữ liệu Cloudflare D1 (Serverless SQLite)
npx wrangler d1 create hotelcloud-db

# 2. Thực thi tạo bảng dữ liệu trên Cloudflare D1
npx wrangler d1 execute hotelcloud-db --file=./server/schema.sql

# 3. Triển khai Frontend lên Cloudflare Pages
npm run build
npx wrangler pages deploy dist
```

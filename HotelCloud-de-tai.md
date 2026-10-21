# HotelCloud – Hệ thống quản lý khách sạn trên nền tảng điện toán đám mây công cộng

## 1. Tổng quan đề tài

**Tên đề tài:** HotelCloud – Xây dựng hệ thống quản lý khách sạn trên nền tảng điện toán đám mây công cộng.

**Mục tiêu:** Xây dựng ứng dụng web hỗ trợ khách sạn quản lý phòng, đặt phòng, khách hàng, lưu trú, dịch vụ, hóa đơn và doanh thu. Hệ thống được triển khai trên nền tảng Cloud để người dùng có thể truy cập qua Internet, sử dụng dữ liệu tập trung và thực nghiệm các đặc tính của điện toán đám mây.

**Đối tượng sử dụng:**
- **Quản trị viên (Admin):** quản lý tài khoản và cấu hình hệ thống.
- **Lễ tân (Receptionist):** quản lý khách hàng, đặt phòng, nhận phòng và trả phòng.
- **Quản lý (Manager):** theo dõi hoạt động, doanh thu và báo cáo.

**Phạm vi:** Tập trung vào nghiệp vụ quản lý khách sạn quy mô nhỏ hoặc vừa. Các chức năng mở rộng chỉ thực hiện sau khi hoàn thành các chức năng cốt lõi.

## 2. Các chức năng chính

### 2.1. Quản lý phòng khách sạn
- Thêm, xem, sửa và cập nhật thông tin phòng.
- Quản lý loại phòng, sức chứa và giá phòng.
- Theo dõi trạng thái phòng: trống, đã đặt, đang sử dụng hoặc bảo trì.
- Tìm kiếm và lọc phòng theo loại, giá và trạng thái.

### 2.2. Quản lý đặt phòng
- Tạo, xem, cập nhật và hủy đặt phòng.
- Ghi nhận ngày nhận phòng, ngày trả phòng và số lượng khách.
- Kiểm tra tình trạng phòng theo khoảng thời gian.
- Ngăn ngừa việc đặt trùng phòng trong cùng khoảng thời gian.
- Theo dõi trạng thái đặt phòng.

### 2.3. Quản lý khách hàng và lưu trú
- Lưu và cập nhật thông tin khách hàng.
- Tra cứu khách hàng.
- Thực hiện nhận phòng (check-in) và trả phòng (check-out).
- Xem lịch sử lưu trú của khách hàng.

### 2.4. Quản lý dịch vụ khách sạn
- Quản lý danh sách dịch vụ, đơn giá và trạng thái cung cấp.
- Ghi nhận dịch vụ khách sử dụng trong thời gian lưu trú.
- Tính tổng chi phí dịch vụ và cộng vào hóa đơn.

### 2.5. Quản lý hóa đơn và doanh thu
- Tính tiền phòng dựa trên thời gian lưu trú và giá phòng.
- Tổng hợp tiền phòng, tiền dịch vụ và khoản giảm giá (nếu có).
- Lập và tra cứu hóa đơn.
- Thống kê doanh thu theo ngày hoặc tháng.
- Hiển thị các chỉ số cơ bản như số phòng đang sử dụng và tỷ lệ lấp đầy.

### 2.6. Tài khoản và phân quyền
- Đăng nhập và đăng xuất.
- Quản lý tài khoản người dùng.
- Phân quyền theo vai trò Admin, Receptionist và Manager.
- Hạn chế truy cập chức năng và dữ liệu theo quyền được cấp.

### 2.7. Lưu trữ và khai thác dữ liệu trên Cloud
- Lưu tập trung dữ liệu phòng, khách hàng, đặt phòng, dịch vụ và hóa đơn trên cơ sở dữ liệu Cloud.
- Cho phép người dùng được cấp quyền truy cập hệ thống qua Internet.
- Thử nghiệm sao lưu và khôi phục dữ liệu.
- Có thể lưu ảnh phòng, ảnh khách sạn hoặc tệp hóa đơn trên dịch vụ lưu trữ đối tượng.
- Đánh giá thời gian phản hồi, tính ổn định và giới hạn của gói Cloud sử dụng.

## 3. Điểm nhấn điện toán đám mây

Đề tài không chỉ triển khai website lên Internet mà còn cần trình bày và kiểm thử các đặc tính liên quan đến Cloud:

1. **Lưu trữ dữ liệu tập trung:** dữ liệu nằm trên dịch vụ cơ sở dữ liệu Cloud, không phụ thuộc vào việc trình duyệt của người dùng còn mở hay không.
2. **Truy cập qua mạng:** nhiều người dùng có thể truy cập hệ thống từ các thiết bị có Internet, theo quyền hạn được cấp.
3. **Quản lý truy cập và bảo mật:** xác thực người dùng, phân quyền và bảo vệ thông tin kết nối.
4. **Sao lưu và khôi phục:** thực hiện thử nghiệm sao lưu dữ liệu và khôi phục khi cần.
5. **Khả năng mở rộng:** mô tả hoặc kiểm thử cách tăng tài nguyên khi số lượng người dùng và dữ liệu tăng.
6. **Đo lường và đánh giá:** ghi nhận thời gian phản hồi, tình trạng hoạt động và giới hạn của gói dịch vụ đang sử dụng.

> Lưu ý: Các nội dung trên cần được kiểm chứng bằng cấu hình thực tế, ảnh chụp màn hình và kết quả thử nghiệm trong báo cáo. Không nên tuyên bố đã có sao lưu tự động, mở rộng tự động hoặc bảo mật ở mức cụ thể nếu chưa cấu hình và kiểm tra.

## 4. Kiến trúc Cloud dự kiến

Có thể cân nhắc hai hướng triển khai:

### Phương án A – Sử dụng hệ sinh thái Cloudflare
- **Cloudflare Pages:** triển khai giao diện web tĩnh.
- **Cloudflare Workers:** triển khai API/serverless backend.
- **Cloudflare D1:** lưu dữ liệu quan hệ bằng SQL.
- **Cloudflare R2 (tùy chọn):** lưu ảnh phòng và các tệp.

Phương án này phù hợp nếu nhóm chấp nhận xây dựng backend bằng JavaScript/TypeScript. D1 là cơ sở dữ liệu serverless dựa trên SQLite, không phải PostgreSQL/MySQL truyền thống.

### Phương án B – Giữ Java Spring Boot
- **Frontend:** React + Vite, có thể triển khai trên Cloudflare Pages.
- **Backend:** Java 21 + Spring Boot trên dịch vụ hỗ trợ chạy ứng dụng Java.
- **Database:** PostgreSQL hoặc MySQL được cung cấp bởi dịch vụ cơ sở dữ liệu Cloud.
- **Lưu trữ tệp:** có thể dùng Cloudflare R2 nếu cần.

Không nên coi Cloudflare Pages là nơi chạy trực tiếp ứng dụng Spring Boot. Trước khi chốt kiến trúc, nhóm cần xác nhận yêu cầu môn học, công nghệ mà các thành viên có thể sử dụng, giới hạn gói miễn phí và nguy cơ phát sinh chi phí.

## 5. Phân chia công việc tham khảo cho nhóm 4–5 người

| Thành viên | Công việc chính |
|---|---|
| Thành viên 1 | Phân tích yêu cầu, thiết kế cơ sở dữ liệu và tài liệu hệ thống |
| Thành viên 2 | Giao diện React: quản lý phòng, khách hàng và đặt phòng |
| Thành viên 3 | Backend/API: đặt phòng, check-in/check-out và quy tắc nghiệp vụ |
| Thành viên 4 | Hóa đơn, dịch vụ, báo cáo và kiểm thử tích hợp |
| Thành viên 5 (nếu có) | Triển khai Cloud, kiểm thử sao lưu/khôi phục, theo dõi chi phí, hỗ trợ báo cáo và demo |

Nếu nhóm chỉ có 4 người, có thể gộp phần triển khai Cloud với kiểm thử và phân chia thêm các chức năng giao diện/backend theo năng lực của từng thành viên.

## 6. Kế hoạch thực hiện tham khảo

1. **Giai đoạn 1 – Phân tích:** chốt yêu cầu, vai trò người dùng, sơ đồ use case và quy trình nghiệp vụ.
2. **Giai đoạn 2 – Thiết kế:** thiết kế cơ sở dữ liệu, API, giao diện và kiến trúc triển khai.
3. **Giai đoạn 3 – Xây dựng chức năng cốt lõi:** phòng, khách hàng, đặt phòng và kiểm tra phòng trống.
4. **Giai đoạn 4 – Hoàn thiện nghiệp vụ:** check-in/check-out, dịch vụ, hóa đơn và báo cáo.
5. **Giai đoạn 5 – Triển khai Cloud:** cấu hình frontend, backend, database và biến môi trường.
6. **Giai đoạn 6 – Kiểm thử:** kiểm thử quyền truy cập, đặt trùng phòng, dữ liệu, sao lưu/khôi phục và hiệu năng cơ bản.
7. **Giai đoạn 7 – Báo cáo và demo:** chụp ảnh triển khai, ghi kết quả kiểm thử, hoàn thiện hướng dẫn sử dụng.

## 7. Các chức năng ưu tiên

### Bắt buộc nên hoàn thành
- Đăng nhập và phân quyền.
- Quản lý phòng và loại phòng.
- Quản lý khách hàng.
- Đặt phòng và kiểm tra phòng trống.
- Check-in/check-out.
- Quản lý dịch vụ cơ bản.
- Hóa đơn và thống kê doanh thu cơ bản.
- Triển khai hệ thống và cơ sở dữ liệu trên Cloud.

### Có thể làm nếu còn thời gian
- Khách tự đặt phòng trực tuyến.
- Gửi email xác nhận đặt phòng.
- Lưu ảnh phòng trên Object Storage.
- Xuất hóa đơn hoặc báo cáo PDF.
- Biểu đồ doanh thu và tỷ lệ lấp đầy.
- Kiểm thử tải ở quy mô nhỏ.

## 8. Định hướng báo cáo và demo

Báo cáo có thể tổ chức theo các phần:
1. Bài toán, đầu vào, đầu ra và phạm vi.
2. Dịch vụ Cloud được lựa chọn và lý do.
3. Phân chia công việc nhóm.
4. Kế hoạch và tiến độ.
5. Các bước triển khai Cloud kèm ảnh chụp màn hình.
6. Giao diện, chức năng và hướng dẫn sử dụng.
7. Kết luận, hạn chế và hướng phát triển.

Trong buổi demo, nên trình bày một quy trình liền mạch: đăng nhập → tạo đặt phòng → nhận phòng → ghi nhận dịch vụ → trả phòng → lập hóa đơn → xem doanh thu. Sau đó minh họa dữ liệu được lưu trên Cloud và trình bày kết quả thử nghiệm sao lưu/khôi phục hoặc đánh giá thời gian phản hồi.

## 9. Những điểm cần chốt trước khi bắt đầu

- Nhóm sẽ dùng **Cloudflare Workers + D1** hay giữ **Spring Boot + PostgreSQL/MySQL Cloud**?
- Có bắt buộc phải dùng riêng Cloudflare không, hay được chọn nhiều nhà cung cấp Cloud?
- Thời gian thực hiện và hạn nộp là bao lâu?
- Giảng viên có yêu cầu minh họa sao lưu/khôi phục, mở rộng hoặc đo hiệu năng không?
- Ngân sách triển khai có yêu cầu tuyệt đối miễn phí không?

**Khuyến nghị:** Hoàn thành luồng quản lý phòng → đặt phòng → lưu trú → hóa đơn trước. Sau đó mới bổ sung chức năng mở rộng và thực nghiệm Cloud, để bảo đảm đề tài vừa có nghiệp vụ đầy đủ vừa có nội dung điện toán đám mây rõ ràng.

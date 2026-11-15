# MA TRẬN KỊCH BẢN KIỂM THỬ TÍCH HỢP (INTEGRATED TEST CASES MATRIX)
## Hệ Thống Quản Lý & Đặt Phòng Tự Học Thông Minh (Smart Campus)
**Phiên bản nhánh:** `fix/booking-validation-and-auth`  
**Môi trường kiểm thử:** Tích hợp Fullstack (Frontend React 18 + Backend Spring Boot 3 + MySQL / TiDB)  
**Tiêu chuẩn đặc tả:** Bám sát SRS ISO/IEC/IEEE 29148  

---

## 📌 1. Danh Sách Tài Khoản & Dữ Liệu Kiểm Thử Mẫu (Test Fixtures)

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Mục đích sử dụng trong Test Case |
|---|---|---|---|
| **Admin** | `admin@smartcampus.tdtu.edu.vn` | `Admin@2026` | Quản trị phòng, duyệt đơn phòng hội nghị, xem báo cáo thống kê, chuyển trạng thái bảo trì |
| **Staff Tầng 1-2** | `staff.tang12@lib.tdtu.edu.vn` | `Admin@2026` | Trực phòng, xác nhận sự cố thiết bị tại tầng 1 và tầng 2 |
| **Staff Tầng 3-5** | `staff.tang35@lib.tdtu.edu.vn` | `Admin@2026` | Trực phòng, xác nhận sự cố thiết bị tại tầng 3, 4, 5 |
| **Sinh viên 1 (Chủ phòng)** | Đăng ký mới (VD: `52100888@student.tdtu.edu.vn`) | `Student@123` | Thực hiện đặt phòng, xem mã QR cá nhân, báo cáo sự cố |
| **Sinh viên 2 (Thành viên)** | Đăng ký mới (VD: `52100999@student.tdtu.edu.vn`) | `Student@123` | Nhận mã QR thành viên, tham gia check-in |

---

## 📊 2. Ma Trận Kịch Bản Kiểm Thử Chi Tiết (Test Cases Matrix)

### Module 1: Xác Thực & Phân Quyền (Authentication & Authorization - FR-1.x)

| Mã TC | Tên Kịch Bản | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Thử Nghiệm (Test Data) | Kết Quả Mong Đợi (Expected Result) | Mức Độ | Trạng Thái |
|---|---|---|---|---|---|---|---|
| **TC_AUTH_01** | Đăng ký tài khoản Sinh viên thành công | Email chưa tồn tại trong hệ thống | 1. Vào `/register`<br>2. Nhập họ tên, MSSV, email TDTU, mật khẩu hợp lệ<br>3. Bấm "Đăng ký" | MSSV: `52100888`<br>Email: `52100888@student.tdtu.edu.vn`<br>Pass: `Student@123` | Đăng ký thành công, tự động chuyển hướng hoặc đăng nhập, có JWT token lưu trữ | High | Untested |
| **TC_AUTH_02** | Đăng ký thất bại do định dạng MSSV/Email sai | Đang ở trang `/register` | 1. Nhập MSSV không phải 8 chữ số hoặc email không đúng định dạng sinh viên<br>2. Bấm "Đăng ký" | MSSV: `1234`<br>Email: `abc@gmail.com` | Nút đăng ký bị vô hiệu hoặc báo lỗi validate cụ thể dưới input | Medium | Untested |
| **TC_AUTH_03** | Đăng nhập thành công với quyền Sinh viên | Tài khoản sinh viên đã kích hoạt | 1. Vào `/login`<br>2. Nhập email sinh viên và mật khẩu đúng<br>3. Bấm "Đăng nhập" | `52100888@student.tdtu.edu.vn` / `Student@123` | Đăng nhập thành công, điều hướng vào Dashboard/Sơ đồ phòng Sinh viên, hiển thị đúng họ tên | High | Untested |
| **TC_AUTH_04** | Đăng nhập thành công với quyền Admin | Tài khoản Admin seed có sẵn | 1. Vào `/login`<br>2. Nhập email admin và mật khẩu<br>3. Bấm "Đăng nhập" | `admin@smartcampus.tdtu.edu.vn` / `Admin@2026` | Điều hướng thẳng vào `/admin/dashboard`, thanh điều hướng hiển thị các tab Quản trị | High | Untested |
| **TC_AUTH_05** | Đăng nhập thất bại do sai mật khẩu | Tài khoản đã tồn tại | 1. Nhập đúng email nhưng sai mật khẩu<br>2. Bấm "Đăng nhập" | `admin@smartcampus.tdtu.edu.vn` / `WrongPass!` | Báo lỗi "Tài khoản hoặc mật khẩu không chính xác", không lưu token | High | Untested |
| **TC_AUTH_06** | Tự động làm mới Token (Refresh Token) khi Access Token hết hạn | Sinh viên đang đăng nhập, Access Token hết hạn | 1. Chờ Access Token hết hạn hoặc kích hoạt gọi API sau thời gian quy định<br>2. Thực hiện thao tác gọi API | API request bất kỳ | Axios Interceptor tự động gửi `refreshToken` lên `/api/auth/refresh-token`, nhận token mới trong nền mà không bắt người dùng đăng nhập lại | High | Untested |
| **TC_AUTH_07** | Đăng xuất người dùng (Logout) | Đang đăng nhập | 1. Bấm nút "Đăng xuất" trên Navbar | - | Xóa sạch Access Token và Refresh Token trong LocalStorage/Cookies, chuyển về trang `/login`, chặn nút Back trình duyệt truy cập trang riêng tư | High | Untested |
| **TC_AUTH_08** | Chặn người dùng chưa đăng nhập vào trang bảo vệ | Chưa đăng nhập | 1. Mở trực tiếp URL `/admin/dashboard` hoặc `/my-bookings` | - | Bị ProtectedRoute chặn lại và chuyển hướng về `/login` kèm thông báo | High | Untested |

---

### Module 2: Tra Cứu Phòng & Sơ Đồ Mặt Bằng Tầng (Floor & Room Discovery - FR-2.x)

| Mã TC | Tên Kịch Bản | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Thử Nghiệm (Test Data) | Kết Quả Mong Đợi (Expected Result) | Mức Độ | Trạng Thái |
|---|---|---|---|---|---|---|---|
| **TC_ROOM_01** | Tải danh sách phòng theo tầng | Đăng nhập Sinh viên, vào trang "Duyệt theo tầng" | 1. Vào `/floors`<br>2. Quan sát danh sách các tầng từ G đến 5 | - | Hiển thị đầy đủ các tầng, phân loại đúng 33 phòng theo đúng cấu trúc chuẩn toà L | High | Untested |
| **TC_ROOM_02** | Điều hướng thanh tầng cố định (FloorNavBar) | Đang ở `/floors` | 1. Bấm các nút G, 1, 2, 3, 4, 5 trên thanh bên trái (desktop) hoặc thanh dính (mobile) | Chọn Tầng 3 | Màn hình tự động cuộn mượt (smooth scroll) đến khối Tầng 3 (`id="floor-3"`), nút tầng active đổi màu | Medium | Untested |
| **TC_ROOM_03** | Lọc phòng theo Loại phòng (Room Type) | Đang ở `/search` hoặc `/floors` | 1. Chọn dropdown "Loại phòng" = "Phòng hội nghị"<br>2. Quan sát danh sách | `roomType = "Phòng hội nghị"` | Chỉ hiển thị các phòng hội nghị (L.106 và L.506); các phòng học nhóm/tự học bị ẩn | High | Untested |
| **TC_ROOM_04** | Tìm kiếm phòng theo từ khóa | Đang ở `/search` | 1. Nhập mã phòng vào ô tìm kiếm | Từ khóa: `L.001` | Chỉ hiển thị kết quả phòng `L.001`, phản hồi nhanh qua debounce | Medium | Untested |
| **TC_ROOM_05** | Tương tác Sơ Đồ Kiến Trúc (Interactive Floor Plan) | Vào `/architectural-map` | 1. Chọn tầng (ví dụ Tầng G hoặc Tầng 1)<br>2. Di chuột (hover) vào hình chữ nhật phòng L.001 | Tầng 0 (G), Phòng `L.001` | Sơ đồ SVG hiển thị khung chữ L chuẩn, hover hiện tooltip trạng thái, click mở popup thông tin đặt phòng | High | Untested |
| **TC_ROOM_06** | Hiển thị nhãn tầng không bị bẻ dòng trên Mobile | Mở DevTools chế độ màn hình di động (360px - 414px) | 1. Truy cập `/search`, `/floors`, `/architectural-map`<br>2. Kiểm tra nhãn `2nd - Floor` | Kích thước màn hình: 375x667 | Nhãn `2nd - Floor` giữ nguyên trên 1 dòng duy nhất, không bị ngắt thành `2nd -` xuống dòng `Floor` | Medium | Untested |

---

### Module 3: Đặt Phòng & Kiểm Tra Ràng Buộc Hợp Lệ (Booking Validation & Conflict Checking - FR-3.x)

| Mã TC | Tên Kịch Bản | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Thử Nghiệm (Test Data) | Kết Quả Mong Đợi (Expected Result) | Mức Độ | Trạng Thái |
|---|---|---|---|---|---|---|---|
| **TC_BOOK_01** | Đặt phòng học nhóm hợp lệ thành công | Sinh viên đăng nhập, phòng đang trống | 1. Chọn phòng `L.001` (Sức chứa: 5)<br>2. Chọn ngày mai, giờ: `08:00 - 10:00`<br>3. Thêm MSSV các thành viên đủ điều kiện<br>4. Nhập mục đích, bấm "Xác nhận đặt" | Phòng: `L.001`<br>Thời gian: 2 tiếng<br>Thành viên: 3 MSSV hợp lệ | Backend trả về `201 Created`, trạng thái booking là `CONFIRMED`, xuất hiện popup mã QR đặt phòng | Critical | Untested |
| **TC_BOOK_02** | Chặn đặt phòng do Trùng Lịch (Booking Conflict) | Phòng `L.001` đã có người đặt từ `08:00 - 10:00` | 1. Sinh viên khác vào chọn phòng `L.001` cùng ngày<br>2. Chọn khung giờ giao thoa: `09:00 - 11:00`<br>3. Bấm "Xác nhận đặt" | `09:00 - 11:00` | Backend từ chối với mã lỗi `409 Conflict`, Frontend hiện Toast đỏ: "Khung giờ đã có người đặt trước, vui lòng chọn giờ khác" | Critical | Untested |
| **TC_BOOK_03** | Chặn đặt phòng do Không đủ Sức chứa tối thiểu (Min Occupancy) | Đang ở form đặt phòng `L.001` (sức chứa 5, yêu cầu tối thiểu 3 người) | 1. Chỉ điền 1 người (chủ phòng), không thêm thành viên<br>2. Bấm "Xác nhận đặt" | Thành viên: 1 người / Sức chứa: 5 | Nút đặt bị vô hiệu hoặc báo lỗi: "Phòng này yêu cầu tối thiểu 3 người tham gia" | High | Untested |
| **TC_BOOK_04** | Chặn đặt phòng ngoài Khung giờ hoạt động Thư viện | Đang ở form đặt phòng | 1. Chọn thời gian bắt đầu trước 07:30 (VD: `06:30`) hoặc kết thúc sau 20:00 (VD: `21:00`)<br>2. Bấm đặt phòng | Giờ: `06:30 - 08:30` | Báo lỗi: "Thời gian đặt phòng phải nằm trong khung giờ mở cửa (07:30 - 20:00)" | High | Untested |
| **TC_BOOK_05** | Chặn đặt thời lượng không hợp lệ (< 30 phút hoặc > 180 phút) | Đang ở form đặt phòng | 1. Chọn thời lượng 15 phút (`08:00 - 08:15`) hoặc 4 tiếng (`08:00 - 12:00`)<br>2. Bấm đặt | Khung giờ: 15 phút hoặc 240 phút | Báo lỗi: "Thời lượng đặt phòng tối thiểu 30 phút và tối đa 3 tiếng (180 phút)" | High | Untested |
| **TC_BOOK_06** | Chặn đặt thời gian trong quá khứ | Đang ở form đặt phòng | 1. Chọn ngày hôm qua hoặc giờ sớm hơn giờ hiện tại trong ngày hôm nay | Ngày quá khứ | Hệ thống chặn chọn ngày cũ và báo lỗi: "Không thể đặt phòng cho thời điểm trong quá khứ" | High | Untested |
| **TC_BOOK_07** | Đặt Phòng Hội Nghị kích hoạt trạng thái Chờ Phê Duyệt | Phòng `L.106` hoặc `L.506` (Loại phòng: Phòng hội nghị) | 1. Chọn phòng hội nghị `L.106`<br>2. Điền thông tin và gửi đơn đặt | Phòng: `L.106`<br>Mục đích: "Hội thảo CLB Sinh viên" | Booking tạo với trạng thái `PENDING_APPROVAL`, hiện thông báo: "Đơn đặt đã được gửi, vui lòng chờ Quản trị viên duyệt" | Critical | Untested |
| **TC_BOOK_08** | Admin phê duyệt / từ chối Đơn đặt Phòng hội nghị | Admin đăng nhập, có đơn `PENDING_APPROVAL` | 1. Vào `/admin/dashboard` tab "Phê duyệt"<br>2. Bấm "Duyệt" hoặc "Từ chối" (kèm lý do) | Đơn của phòng `L.106` | - Khi duyệt: Đơn chuyển sang `CONFIRMED`, gửi thông báo đến sinh viên.<br>- Khi từ chối: Đơn chuyển `CANCELLED_ADMIN`, lưu lý do từ chối | Critical | Untested |

---

### Module 4: Điểm Danh & Quét Mã QR Check-In Từng Cá Nhân (QR Check-In - FR-5.x)

| Mã TC | Tên Kịch Bản | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Thử Nghiệm (Test Data) | Kết Quả Mong Đợi (Expected Result) | Mức Độ | Trạng Thái |
|---|---|---|---|---|---|---|---|
| **TC_CHECKIN_01** | Mã QR cá nhân hóa riêng biệt cho từng thành viên | Đơn đặt có 3 thành viên: Chủ phòng A, TV B, TV C | 1. A đăng nhập vào `/my-bookings` mở mã QR<br>2. B đăng nhập vào `/my-bookings` mở mã QR | Sinh viên A và Sinh viên B | - A chỉ thấy mã QR của A: `SMART-CAMPUS-<id>-<MSSV_A>`<br>- B chỉ thấy mã QR của B: `SMART-CAMPUS-<id>-<MSSV_B>` | High | Untested |
| **TC_CHECKIN_02** | Check-in nhận phòng thành công trong khung giờ hợp lệ | Đơn đặt đã CONFIRMED, thời gian hiện tại nằm trong khoảng [Giờ bắt đầu - 15 phút, Giờ bắt đầu + 15 phút] | 1. Mở trang Quét QR (`/qr-scanner`) bằng camera thiết bị<br>2. Quét mã QR của thành viên | Mã QR hợp lệ | Backend ghi nhận `checkedInAt`, chuyển trạng thái booking sang `IN_USE` khi đủ số lượng tối thiểu, hiển thị thông báo check-in thành công | Critical | Untested |
| **TC_CHECKIN_03** | Check-in thất bại do Quét quá sớm | Giờ bắt đầu là 10:00, thời điểm quét là 09:30 (> 15 phút trước giờ nhận) | 1. Mở trang quét QR<br>2. Quét mã | Quét lúc 09:30 | Báo lỗi: "Chưa đến thời gian nhận phòng (chỉ mở check-in trước 15 phút)" | High | Untested |
| **TC_CHECKIN_04** | Check-in thất bại do Quét quá muộn & Tự động hủy phòng (No-Show) | Quá 15 phút tính từ giờ bắt đầu mà không có ai check-in | 1. Hệ thống chạy batch check hoặc quét mã lúc 10:20 (giờ bắt đầu 10:00) | Quét lúc 10:20 | Báo lỗi: "Lượt đặt đã bị hủy do quá hạn nhận phòng (No-show)", trạng thái chuyển sang `CANCELLED_NO_SHOW` | Critical | Untested |
| **TC_CHECKIN_05** | Ngăn chặn Quét lại mã QR đã check-in | Thành viên đã check-in thành công | 1. Quét lại mã QR của thành viên đó lần thứ 2 | Mã QR đã dùng | Báo lỗi: "Mã QR này đã được check-in lúc [thời gian]" | Medium | Untested |

---

### Module 5: Báo Cáo Sự Cố & Quản Trị Trạng Thái Phòng (Incidents & Maintenance - FR-4.x & FR-6.x)

| Mã TC | Tên Kịch Bản | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Thử Nghiệm (Test Data) | Kết Quả Mong Đợi (Expected Result) | Mức Độ | Trạng Thái |
|---|---|---|---|---|---|---|---|
| **TC_INC_01** | Sinh viên gửi Báo cáo sự cố kèm hình ảnh | Đang sử dụng phòng `L.103` có thiết bị lỗi | 1. Vào `/incident-report`<br>2. Chọn phòng `L.103`, thiết bị: Bảng kính<br>3. Chụp ảnh / chọn ảnh dung lượng < 5MB<br>4. Nhập mô tả lỗi (>= 10 ký tự)<br>5. Bấm "Gửi báo cáo" | Phòng `L.103`, ảnh `.jpg` 2MB | Báo cáo gửi thành công, Backend lưu bản ghi sự cố kèm URL ảnh, Admin/Staff nhận được thông báo | High | Untested |
| **TC_INC_02** | Chặn tải file ảnh sự cố không hợp lệ (> 5MB hoặc sai định dạng) | Đang ở form báo cáo sự cố | 1. Chọn file `.pdf` hoặc file ảnh có dung lượng 6MB | File 6MB hoặc file `.txt` | Báo lỗi ngay dưới ô nhập: "Ảnh vượt quá giới hạn 5 MB" hoặc "Chỉ nhận file ảnh (JPG, PNG, WebP)", không cho gửi | Medium | Untested |
| **TC_MAINT_01** | Admin chuyển phòng sang trạng thái Bảo trì có lý do | Admin đăng nhập, vào `/admin/dashboard` tab ROOMS | 1. Tại phòng `L.103`, bấm "Bảo trì"<br>2. Nhập lý do: "Bảng kính vỡ cần thay mới" (bắt buộc >= 5 ký tự)<br>3. Bấm "Xác nhận bảo trì" | Lý do: "Bảng kính vỡ cần thay mới" | Phòng chuyển sang `MAINTENANCE`, các booking tương lai bị hủy tự động kèm lý do, sinh viên không thể đặt phòng này | High | Untested |
| **TC_MAINT_02** | Bắt buộc nhập lý do khi chuyển bảo trì | Admin đang ở modal chuyển bảo trì | 1. Để trống ô lý do bảo trì<br>2. Thử bấm nút xác nhận | Ô lý do để trống | Nút xác nhận bị vô hiệu hóa (disabled), không thể gọi API cập nhật | Medium | Untested |
| **TC_MAINT_03** | Khôi phục phòng bảo trì về Trạng thái Hoạt động | Phòng đang ở trạng thái `MAINTENANCE` | 1. Admin bấm "Kích hoạt hoạt động" tại phòng `L.103` | - | Trạng thái phòng chuyển về `AVAILABLE`, xóa `maintenanceReason`, cho phép sinh viên đặt phòng bình thường | High | Untested |
| **TC_ADMIN_01** | Thống kê tỷ lệ công suất phòng & tầng (Room & Floor Utilization) | Đã có các lượt đặt trong ngày tại các tầng | 1. Vào tab Thống kê/Analytics trên Admin Dashboard<br>2. Chọn ngày cần xem | Ngày có booking | Hiển thị biểu đồ & bảng tỷ lệ % sử dụng chính xác dựa trên tổng số phút đặt / tổng thời gian mở cửa (07:30 - 20:00) | Medium | Untested |

---

## 📋 3. Quy Trình Các Bước Thực Hiện Kiểm Thử Thực Tế

1. **Chuẩn bị môi trường (Pre-test Setup):**
   - Đảm bảo Backend Spring Boot đang chạy tại cổng `8088`.
   - Cơ sở dữ liệu đã nạp đủ seed rooms và accounts qua Flyway migration.
   - Frontend chạy tại cổng `3000` với `.env` trỏ về `http://localhost:8088/api`.
2. **Thực thi lần lượt từng kịch bản:**
   - Đi từ **Module 1 (Auth)** để có tài khoản kiểm thử.
   - Tiến hành **Module 2 (Discovery)** và **Module 3 (Booking Validation)** để tạo các lượt đặt.
   - Sử dụng điện thoại/camera để kiểm thử **Module 4 (QR Check-in)**.
   - Kiểm tra **Module 5 (Admin & Maintenance)** bằng tài khoản Admin.
3. **Ghi nhận kết quả (Test Run Log):**
   - Điền trạng thái `Pass` hoặc `Fail` vào cột **Trạng Thái**.
   - Nếu `Fail`: Ghi nhận thêm thông tin chi tiết (Lỗi Console, Network Tab Payload, mã lỗi HTTP).

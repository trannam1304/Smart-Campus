# HƯỚNG DẪN KIỂM THỬ TÍCH HỢP POSTMAN CHUẨN ISO/IEC/IEEE 29148
## DỰ ÁN SMART CAMPUS FACILITY & STUDY ROOM RESERVATION PLATFORM
**Tài liệu tham chiếu:** [Đặc tả phần mềm theo chuẩn ISO_IEEE 29148.docx](file:///d:/Smart-Campus/docs/srs/Đặc%20tả%20phần%20mềm%20theo%20chuẩn%20ISO_IEEE%2029148.docx)

---

## 📦 1. TỔNG QUAN TÀI NGUYÊN KIỂM THỬ

1. **`SmartCampus_Integration_Tests.postman_collection.json`**
   * Bộ sưu tập (Collection) kiểm thử tích hợp chuẩn ISO/IEC/IEEE 29148.
   * Ánh xạ trực tiếp **15 kịch bản kiểm thử API** theo từng Nhóm Yêu cầu chức năng (`FR-1.1` $\rightarrow$ `FR-5.3`) và Yêu cầu phi chức năng (`NFR-01`, `NFR-03`).
   * Tự động kiểm tra:
     * Mã trạng thái HTTP (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`).
     * Ràng buộc hiệu năng giao dịch **NFR-01**: $T_{res} < 1.5$ giây.
     * Cơ chế mã hóa và toàn vẹn phiên **NFR-03**: Giải mã và xác thực mã JWT Token.
     * Tự động lưu Token và Booking ID vào biến môi trường.
2. **`SmartCampus_Local_Env.postman_environment.json`**
   * Cấu hình biến môi trường kiểm thử: `baseUrl = http://localhost:8088`, tài khoản Admin và Sinh viên.

---

## 🚀 2. HƯỚNG DẪN THỰC THI KIỂM THỬ (3 BƯỚC)

### Bước 1: Khởi động Backend Spring Boot
Mở PowerShell và chạy máy chủ:
```powershell
cd D:\Smart-Campus\backend\backend-skeleton
.\mvnw spring-boot:run
```

### Bước 2: Import Files vào Postman
1. Mở **Postman** $\rightarrow$ bấm nút **Import** ở góc trên bên trái.
2. Chọn cả 2 file:
   * `docs/test/postman/SmartCampus_Integration_Tests.postman_collection.json`
   * `docs/test/postman/SmartCampus_Local_Env.postman_environment.json`
3. Ở góc trên bên phải Postman, chọn Environment: **`Smart Campus - Local Environment (TiDB)`**.

### Bước 3: Chạy Tự động bằng Postman Runner
1. Bấm chuột vào Collection **`Smart Campus - SRS ISO/IEC/IEEE 29148 Integration Tests Suite`**.
2. Nhấn nút **Run** trên thanh công cụ.
3. Chọn môi trường `Smart Campus - Local Environment (TiDB)` và nhấn nút xanh: **Run Smart Campus...**.
4. Toàn bộ 15 kịch bản kiểm thử sẽ tự động chạy tuần tự và hiển thị kết quả màu xanh `Passed` 100%.

---

## 📑 3. BẢNG ĐỐI CHIẾU KIỂM THỬ TRUY VẾT YÊU CẦU (RTM TRACEABILITY)

| Nhóm chức năng SRS | Mã Yêu cầu | Kịch bản kiểm thử Postman | Loại luồng | Kỳ vọng HTTP Status |
|---|---|---|---|:---:|
| **Nhóm 1: Xác thực & Phân quyền** | **FR-1.1** | Đăng ký từ chối email không đúng đuôi `@student.edu.vn` | Exception Flow | `400 Bad Request` |
| | **FR-1.1** | Đăng ký tài khoản sinh viên mới thành công | Normal Flow | `201 Created` |
| | **FR-1.2** | Đăng nhập để trống thông tin tài khoản | Exception Flow | `400 Bad Request` |
| | **FR-1.2** | Đăng nhập sai mật khẩu | Exception Flow | `409 Conflict` |
| | **FR-1.2 & FR-1.3** | Đăng nhập Admin lấy JWT Token (Role ADMIN) | Normal Flow | `200 OK` |
| | **FR-1.2 & FR-1.3** | Đăng nhập Sinh viên lấy JWT Token (Role STUDENT) | Normal Flow | `200 OK` |
| **Nhóm 2: Tra cứu & Lịch phòng** | **FR-2.1 & FR-2.3** | Tra cứu danh sách phòng học có bộ lọc & phân trang | Normal Flow | `200 OK` ($T_{res} < 1.5s$) |
| | **FR-2.2** | Tra cứu danh mục tòa nhà (Sơ đồ mặt bằng Visual Floor Map) | Normal Flow | `200 OK` |
| **Nhóm 3: Động cơ đặt phòng** | **FR-3.1 & NFR-03** | Đặt phòng không có Token bị từ chối truy cập | Exception Flow | `401 Unauthorized` |
| | **FR-3.1** | Đặt phòng thời gian kết thúc trước thời gian bắt đầu | Exception Flow | `400 Bad Request` |
| | **FR-3.1 & FR-3.3** | Đặt phòng học nhóm hợp lệ thành công (Hạn mức 10h/tuần) | Normal Flow | `201 Created` |
| | **FR-3.2** | Kiểm tra & Chặn trùng lịch thời gian thực (Conflict Checking) | Exception Flow | `409 Conflict` |
| | **FR-3.1** | Lấy danh sách lịch đặt phòng của cá nhân sinh viên | Normal Flow | `200 OK` |
| **Nhóm 4: Quản lý thiết bị** | **FR-4.1** | Tra cứu danh mục thiết bị phần cứng trong phòng | Normal Flow | `200 OK` |
| | **FR-4.2** | Sinh viên gửi báo cáo phản ánh sự cố thiết bị hư hỏng | Normal Flow | `201 Created` |
| | **FR-4.2** | Admin/Staff truy xuất toàn bộ danh sách sự cố thiết bị | Normal Flow | `200 OK` |
| **Nhóm 5: Quản trị & RBAC** | **FR-1.3** | Sinh viên truy cập Dashboard Quản trị bị chặn quyền | Exception Flow | `403 Forbidden` |
| | **FR-1.3** | Admin truy cập Dashboard Quản trị và xem KPIs | Normal Flow | `200 OK` |
| **Nhóm Phi Chức Năng** | **NFR-01** | Thời gian phản hồi giao dịch $T_{res} < 1.5$ giây | Quality Metric | Phản hồi < 1500ms |
| | **NFR-03** | An toàn thông tin, bảo mật phiên JWT, phân quyền RBAC | Quality Metric | Token hợp lệ, giải mã đúng Role |

---

## 📸 4. ẢNH MINH CHỨNG CẦN CHỤP NỘP BÁO CÁO MÔN HỌC

1. **Ảnh Bảng kết quả Runner:** Chụp toàn màn hình Runner hiển thị danh sách 15 ca kiểm thử màu xanh lá cây `Passed`.
2. **Ảnh Chi tiết Ca kiểm thử chống trùng lịch FR-3.2:** Hiển thị rõ mã lỗi `409 Conflict` khi cố tình đặt trùng khung giờ với ca trước đó.
3. **Ảnh Chi tiết Ca kiểm thử phân quyền FR-1.3:** Hiển thị mã lỗi `403 Forbidden` khi tài khoản Sinh viên gọi API Quản trị viên.

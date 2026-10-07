# Smart Campus Backend — Khung dự án (Spring Boot)

Khung thư mục chuẩn cho **backend** của dự án *Smart Campus Facility & Study Room Reservation
Platform*, dựng theo mô hình layer (Controller → Service → Repository → Entity/DTO), map trực
tiếp với 6 nhóm chức năng trong tài liệu SRS (ISO/IEC/IEEE 29148).

> Đây là khung sườn: các class đã có sẵn package, tên class, import cần thiết và TODO ghi rõ
> nghiệp vụ (mã FR) — thành viên chỉ cần code phần logic vào đúng file.

## Cấu trúc thư mục

```
backend/
├── pom.xml
├── src/main/java/com/smartcampus/backend/
│   ├── SmartCampusBackendApplication.java   # entry point
│   ├── config/            # CORS, Security, OpenAPI/Swagger
│   ├── controller/        # REST endpoints (1 controller / nhóm chức năng)
│   ├── service/           # interface nghiệp vụ
│   │   └── impl/          # implementation
│   ├── repository/        # Spring Data JPA repository
│   ├── entity/            # JPA entity map với bảng CSDL
│   ├── dto/
│   │   ├── request/       # DTO nhận dữ liệu từ FE
│   │   └── response/      # DTO trả dữ liệu cho FE
│   ├── exception/         # Xử lý lỗi tập trung (GlobalExceptionHandler)
│   ├── security/          # JWT provider, filter, UserDetailsService
│   └── util/              # Tiện ích dùng chung (QR code...)
└── src/main/resources/
    ├── application.yml         # cấu hình chung
    ├── application-dev.yml     # profile PostgreSQL (mặc định)
    └── application-mysql.yml   # profile MySQL (thay thế)
```

## Phân công theo nhóm chức năng (map với SRS)

| Nhóm SRS | Mã FR | File liên quan |
|---|---|---|
| 1. Xác thực & Phân quyền | FR-1.1 → FR-1.4 | `AuthController`, `AuthService(Impl)`, `User`, `security/*` |
| 2. Tra cứu & Lịch phòng | FR-2.1 → FR-2.4 | `RoomController`, `RoomService(Impl)`, `Room`, `RoomFilterRequest` |
| 3. Đặt phòng (Booking Engine) | FR-3.1 → FR-3.3 | `BookingController`, `BookingService(Impl)`, `Booking` |
| 4. Quản lý thiết bị | FR-4.1 → FR-4.3 | `DeviceController`, `DeviceService(Impl)`, `HardwareResource`, `IncidentReport` |
| 5. Check-in QR | FR-5.1 → FR-5.3 | `CheckinController`, `CheckinService(Impl)`, `util/QrCodeUtil` |
| 6. Thông báo | FR-6.1 → FR-6.3 | `NotificationController`, `NotificationService(Impl)`, `Notification` |

Chỉ số phi chức năng (NFR-01 → NFR-04: hiệu năng, độ sẵn sàng, bảo mật, responsive) áp dụng
xuyên suốt — xem comment trong `SecurityConfig`, `CorsConfig`, `application.yml`.

## Hướng dẫn chạy dự án (Getting Started)

### Yêu cầu môi trường (Prerequisites)
- **JDK 17** trở lên (`java -version`).
- **Docker Desktop** (khuyên dùng để chạy MySQL tự động chỉ với 1 câu lệnh).
- *(Lưu ý quan trọng)*: Đường dẫn thư mục chứa dự án **không được chứa dấu tiếng Việt hoặc khoảng trắng** (ví dụ tránh `D:\Đại học\...` vì Maven wrapper sẽ bị lỗi đường dẫn).

---

### Các bước khởi chạy chi tiết:

#### Bước 1: Khởi động cơ sở dữ liệu MySQL (bằng Docker)
Mở Terminal / PowerShell tại thư mục gốc `Smart-Campus`:
```bash
docker compose up -d mysql
```
* Lệnh trên sẽ tự động tải image MySQL 8.0 và tạo container `smart-campus-mysql` chạy tại cổng `3306`.
* Docker đã thiết lập sẵn thông số kết nối:
  - **Database:** `smart_campus_db`
  - **Username:** `root`
  - **Password:** `root`
* *(Tùy chọn)*: Bạn có thể dùng MySQL Workbench kết nối vào `localhost:3306` (user: `root`, pass: `root`) để quan sát cơ sở dữ liệu.
* *(Nếu máy không cài Docker)*: Bạn có thể cài MySQL 8.0 trực tiếp trên máy, tạo database `smart_campus_db`, rồi kiểm tra lại user/password trong `src/main/resources/application-mysql.yml`.

#### Bước 2: Khởi động Backend Spring Boot
Di chuyển vào thư mục backend và chạy lệnh:
* **Trên Windows (PowerShell / CMD):**
  ```powershell
  cd backend/backend-skeleton
  .\mvnw spring-boot:run
  ```
* **Trên Linux / macOS:**
  ```bash
  cd backend/backend-skeleton
  ./mvnw spring-boot:run
  ```

> **Lưu ý:** Khi Spring Boot khởi động, công cụ **Flyway** sẽ tự động chạy các script migration từ `V1` đến `V11` để tạo đầy đủ các bảng và chèn sẵn 65 phòng học, tòa nhà G, và tài khoản quản trị viên mẫu. Bạn **không cần** phải import file SQL thủ công.

#### Bước 3: Trải nghiệm & Kiểm tra API trên Swagger UI
Sau khi terminal báo `Started SmartCampusBackendApplication in ... seconds`, mở trình duyệt truy cập:
👉 **`http://localhost:8088/swagger-ui.html`**

*(Cổng server hiện tại được cấu hình trong `application.yml` là **8088**).*

#### Bước 4: Chạy kiểm thử tự động (Unit Test)
Để kiểm tra tính đúng đắn của các API mà không cần kết nối cơ sở dữ liệu:
```powershell
.\mvnw test -Dtest=RoomControllerTest
```

## Quy ước khi code thêm

- Mỗi FR nên có test tương ứng trong `src/test/java`.
- Không sửa `BaseEntity` trừ khi thống nhất cả team; response API tuân theo API Contract.
- Đặt tên nhánh git theo mã FR, ví dụ: `feature/fr-3.2-conflict-checking`.
- Trước khi merge vào `main`, đảm bảo `mvn clean install` chạy pass.

## API quản lý phòng, tòa nhà và thiết bị

Các API quản trị dùng prefix `/api/v1`, JSON và response envelope theo API Contract
(`success`, `code`, `message`, `data`, `timestamp`). Danh sách phòng hỗ trợ phân trang
với `page` bắt đầu từ 1 và `limit` tối đa 100. ID công khai có dạng `ROOM-{room_id}`
và `EQ-{equipment_id}`; ID tòa nhà giữ kiểu số như `building_id` trong CSDL.

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/v1/rooms?page=1&limit=10` | Danh sách phòng, phân trang |
| GET | `/api/v1/rooms/{roomId}` | Chi tiết phòng và thiết bị |
| POST | `/api/v1/rooms` | Thêm phòng |
| PUT | `/api/v1/rooms/{roomId}` | Sửa thông tin phòng |
| DELETE | `/api/v1/rooms/{roomId}` | Xóa phòng |
| GET | `/api/v1/buildings` | Danh sách tòa nhà |
| POST | `/api/v1/buildings` | Thêm tòa nhà |
| PUT | `/api/v1/buildings/{buildingId}` | Đổi tên tòa nhà |
| DELETE | `/api/v1/buildings/{buildingId}` | Xóa tòa nhà |
| GET | `/api/v1/rooms/{roomId}/equipments` | Danh mục thiết bị trong phòng |
| POST | `/api/v1/rooms/{roomId}/equipments` | Thêm thiết bị vào phòng |
| PUT | `/api/v1/equipments/{equipmentId}` | Sửa thiết bị |
| DELETE | `/api/v1/equipments/{equipmentId}` | Xóa thiết bị |

Ví dụ tạo phòng (tầng và loại phòng phải tồn tại trong danh mục):

```json
{
  "roomCode": "A3.01",
  "buildingId": 1,
  "floorNumber": 3,
  "roomTypeCode": "GROUP",
  "capacity": 8,
  "status": "AVAILABLE"
}
```

Ví dụ thêm thiết bị:

```json
{
  "name": "Máy chiếu Sony Full HD",
  "type": "PROJECTOR",
  "status": "GOOD"
}
```

API trả `201` khi tạo mới, `400` khi dữ liệu không hợp lệ, `404` khi không tìm thấy
tài nguyên và `409` khi dữ liệu bị trùng hoặc đang được tham chiếu (ví dụ xóa phòng
đang có lượt đặt). Không tự tạo tầng hoặc loại phòng khi tạo phòng.

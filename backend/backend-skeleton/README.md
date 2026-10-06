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

## Cách chạy (sau khi các nhóm code xong phần của mình)

1. Cài PostgreSQL (hoặc MySQL) và tạo database `smart_campus_db`.
2. Cập nhật username/password trong `application-dev.yml` (hoặc `application-mysql.yml`
   rồi đổi `spring.profiles.active: mysql` trong `application.yml`).
3. Chạy: Bắt buộc phải tải Docker vể máy
  `cd ...\repo\Smart-Campus`
  `docker compose up -d mysql`
  Sau khi chạy xong bạn vào Docker xem có container `smart-campus` đã chạy chưa.
  Sau đó, kiêm tra trong Mysql Workbench xem đã kết nối Mysql Connection chưa.
  Thấy có Connection thì bấm vào và nhập password:`root`. Tiếp tục kiểm tra xem có database `smart_campus_db` chưa. Nếu tất cả đầy đủ thì chạy lệnh sau.
  `cd ...\repo\Smart-Campus\backend\backend-skeleton`
  `.\mvnw spring-boot:run`
  (Lưu ý phần ... trước repo không được để Tiếng Việt có dấu )

4. Swagger UI: `http://localhost:8080/swagger-ui.html`

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

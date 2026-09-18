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
3. Chạy: `./mvnw spring-boot:run`
4. Swagger UI: `http://localhost:8080/swagger-ui.html`

## Quy ước khi code thêm

- Mỗi FR nên có test tương ứng trong `src/test/java`.
- Không sửa `BaseEntity`, `ApiResponse` trừ khi thống nhất cả team.
- Đặt tên nhánh git theo mã FR, ví dụ: `feature/fr-3.2-conflict-checking`.
- Trước khi merge vào `main`, đảm bảo `mvn clean install` chạy pass.

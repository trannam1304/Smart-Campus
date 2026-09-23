# Thiết kế UML — Smart Campus Facility & Study Room Reservation Platform

Tài liệu này bổ sung cho `Đặc_tả_phần_mềm_theo_chuẩn_ISO_IEEE_29148.pdf`, chuyển các yêu cầu
FR-1.x → FR-6.x và NFR-01 → NFR-04 thành các biểu đồ UML để đội dev dùng làm cơ sở implement.
Các diagram dùng cú pháp **Mermaid** — GitHub, GitLab và VS Code đều render trực tiếp trong `.md`.

---

## 1. Use Case Diagram

Tác nhân: **Sinh viên (Student)**, **Admin/Staff**, **System (Cron Job / Background Service)**.

```mermaid
flowchart LR
    Student([Sinh viên])
    Admin([Admin / Staff])
    Cron([System / Cron Job])

    subgraph AUTH["Nhóm 1: Xác thực & Phân quyền"]
        UC1((Đăng ký tài khoản))
        UC2((Đăng nhập hệ thống/SSO))
        UC3((Đổi/Khôi phục mật khẩu))
    end

    subgraph SEARCH["Nhóm 2: Tra cứu phòng"]
        UC4((Xem lịch trạng thái phòng))
        UC5((Xem sơ đồ mặt bằng tầng))
        UC6((Lọc tìm kiếm phòng))
    end

    subgraph BOOK["Nhóm 3: Đặt phòng"]
        UC7((Đặt phòng))
        UC8((Kiểm tra trùng lịch))
        UC9((Kiểm tra hạn mức tuần))
    end

    subgraph DEVICE["Nhóm 4: Thiết bị"]
        UC10((Xem danh mục thiết bị))
        UC11((Báo cáo sự cố thiết bị))
        UC12((Cập nhật trạng thái thiết bị))
    end

    subgraph CHECKIN["Nhóm 5: Check-in QR"]
        UC13((Quét QR nhận phòng))
        UC14((Tự động huỷ đặt phòng quá hạn))
    end

    subgraph NOTI["Nhóm 6: Thông báo"]
        UC15((Nhận thông báo xác nhận))
        UC16((Nhận nhắc lịch))
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7
    Student --> UC11
    Student --> UC13
    Student --> UC15
    Student --> UC16

    Admin --> UC2
    Admin --> UC4
    Admin --> UC12
    Admin --> UC11

    Cron --> UC8
    Cron --> UC9
    Cron --> UC14
    Cron --> UC16

    UC7 -. include .-> UC8
    UC7 -. include .-> UC9
    UC11 -. include .-> UC12
```

---

## 2. Class Diagram

Bám sát 6 entity đã dựng trong `entity/` của backend skeleton.

```mermaid
classDiagram
    class BaseEntity {
        +Long id
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class User {
        +String email
        +String studentCode
        +String fullName
        +String password
        +String faculty
        +Role role
        +AccountStatus status
    }
    class Role {
        <<enumeration>>
        STUDENT
        ADMIN_STAFF
    }
    class AccountStatus {
        <<enumeration>>
        ACTIVE
        LOCKED
        PENDING
    }

    class Room {
        +String roomCode
        +String building
        +Integer floor
        +Integer capacity
        +RoomStatus status
    }
    class RoomStatus {
        <<enumeration>>
        AVAILABLE
        BOOKED
        MAINTENANCE
        SELF_BOOKED
    }

    class Booking {
        +LocalDateTime startTime
        +LocalDateTime endTime
        +Integer numberOfPeople
        +String purpose
        +String qrCode
        +BookingStatus status
        +checkConflict() boolean
        +checkWeeklyQuota() boolean
    }
    class BookingStatus {
        <<enumeration>>
        CONFIRMED
        IN_USE
        CANCELLED_AUTO
        COMPLETED
    }

    class HardwareResource {
        +String deviceName
        +DeviceStatus status
    }
    class DeviceStatus {
        <<enumeration>>
        GOOD
        BROKEN
        REPAIRING
    }

    class IncidentReport {
        +String description
        +String imageUrl
        +TicketStatus status
    }
    class TicketStatus {
        <<enumeration>>
        OPEN
        IN_PROGRESS
        RESOLVED
    }

    class Notification {
        +String title
        +String content
        +NotificationType type
        +boolean isRead
    }
    class NotificationType {
        <<enumeration>>
        BOOKING_CONFIRMED
        REMINDER
        CANCEL_WARNING
    }

    BaseEntity <|-- User
    BaseEntity <|-- Room
    BaseEntity <|-- Booking
    BaseEntity <|-- HardwareResource
    BaseEntity <|-- IncidentReport
    BaseEntity <|-- Notification

    User "1" -- "0..*" Booking : đặt
    Room "1" -- "0..*" Booking : được đặt
    Room "1" -- "0..*" HardwareResource : có
    Room "1" -- "0..*" IncidentReport : ghi nhận tại
    HardwareResource "1" -- "0..*" IncidentReport : bị báo lỗi
    User "1" -- "0..*" IncidentReport : báo cáo
    User "1" -- "0..*" Notification : nhận
```

---

## 3. State Diagram

### 3.1 Trạng thái Booking (FR-3.1, FR-5.2, FR-5.3)

```mermaid
stateDiagram-v2
    [*] --> CONFIRMED : Đặt phòng thành công (FR-3.1)
    CONFIRMED --> IN_USE : Quét QR check-in đúng giờ (FR-5.2)
    CONFIRMED --> CANCELLED_AUTO : Quá 15–30 phút chưa check-in (FR-5.3)
    IN_USE --> COMPLETED : Hết khung giờ đặt
    CANCELLED_AUTO --> [*]
    COMPLETED --> [*]
```

### 3.2 Trạng thái Room (FR-2.4, FR-4.3)

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE
    AVAILABLE --> BOOKED : Có lượt đặt CONFIRMED
    AVAILABLE --> SELF_BOOKED : Sinh viên tự đặt (nhóm nhỏ)
    BOOKED --> AVAILABLE : Booking COMPLETED / CANCELLED_AUTO
    AVAILABLE --> MAINTENANCE : Thiết bị chính hỏng (FR-4.3) / Admin đổi trạng thái
    MAINTENANCE --> AVAILABLE : Thiết bị sửa xong, Admin mở lại
```

---

## 4. Sequence Diagrams — các luồng nghiệp vụ chính

### 4.1 Đăng ký & Đăng nhập (FR-1.1, FR-1.2, FR-1.3)

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant FE as Frontend (React)
    participant AuthC as AuthController
    participant AuthS as AuthService
    participant DB as Database

    SV->>FE: Nhập thông tin đăng ký
    FE->>AuthC: POST /api/auth/register
    AuthC->>AuthS: register(RegisterRequest)
    AuthS->>DB: kiểm tra email/MSSV tồn tại?
    alt Email/MSSV hợp lệ
        AuthS->>DB: lưu User (mã hoá mật khẩu)
        AuthS-->>AuthC: gửi email xác thực
        AuthC-->>FE: 200 OK - Đăng ký thành công
    else Trùng dữ liệu
        AuthS-->>AuthC: lỗi "Email/MSSV đã tồn tại"
        AuthC-->>FE: 400 Bad Request
    end

    SV->>FE: Đăng nhập (email/mật khẩu hoặc SSO)
    FE->>AuthC: POST /api/auth/login
    AuthC->>AuthS: login(LoginRequest)
    AuthS->>DB: xác thực thông tin
    alt Hợp lệ
        AuthS-->>AuthC: JWT Token + Role
        AuthC-->>FE: 200 OK (AuthResponse)
        FE->>FE: Điều hướng Dashboard theo Role (FR-1.3)
    else Sai mật khẩu / bị khoá
        AuthS-->>AuthC: lỗi xác thực
        AuthC-->>FE: 401 Unauthorized
    end
```

### 4.2 Đặt phòng + chống trùng lịch + hạn mức tuần (FR-3.1, FR-3.2, FR-3.3)

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant FE as Frontend
    participant BC as BookingController
    participant BS as BookingService
    participant DB as Database (Lock)
    participant Noti as NotificationService

    SV->>FE: Chọn phòng trống + khung giờ
    FE->>BC: POST /api/booking
    BC->>BS: createBooking(BookingRequest)
    BS->>DB: BEGIN TRANSACTION + lock room/time-slot
    BS->>DB: kiểm tra chồng lấp khung giờ (FR-3.2)
    alt Trùng lịch
        DB-->>BS: có xung đột
        BS-->>BC: ConflictException
        BC-->>FE: 409 "Phòng đã có người đặt trong khung giờ này"
    else Không trùng
        BS->>DB: tính tổng giờ đã đặt trong tuần (FR-3.3)
        alt Vượt hạn mức 10h/tuần
            BS-->>BC: ConflictException
            BC-->>FE: 409 "Đã dùng hết hạn mức tuần"
        else Trong hạn mức
            BS->>DB: lưu Booking (status=CONFIRMED)
            BS->>BS: generateQrCode() (FR-5.1)
            BS->>Noti: gửi thông báo xác nhận (FR-6.1)
            BS-->>BC: BookingResponse (kèm QR)
            BC-->>FE: 201 Created
        end
    end
    DB-->>BS: COMMIT
```

### 4.3 Check-in bằng QR (FR-5.2)

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant FE as Frontend / Thiết bị cửa
    participant CC as CheckinController
    participant CS as CheckinService
    participant DB as Database

    SV->>FE: Quét mã QR trước cửa phòng
    FE->>CC: POST /api/checkin/{qrCode}
    CC->>CS: checkIn(qrCode)
    CS->>DB: tìm Booking theo qrCode
    alt Không tìm thấy / mã sai
        CS-->>CC: lỗi "Mã QR không đúng"
        CC-->>FE: 400 Bad Request
    else Tìm thấy
        CS->>CS: kiểm tra thời điểm quét so với giờ hẹn
        alt Quét quá sớm (>15 phút trước giờ)
            CS-->>CC: lỗi "Chưa đến giờ check-in"
            CC-->>FE: 400 Bad Request
        else Hợp lệ
            CS->>DB: cập nhật Booking.status = IN_USE
            CS-->>CC: OK
            CC-->>FE: 200 "Check-in thành công, mở khoá cửa"
        end
    end
```

### 4.4 Tự động huỷ đặt phòng quá hạn — Auto-release (FR-5.3)

```mermaid
sequenceDiagram
    participant Cron as Scheduled Job (mỗi 5 phút)
    participant BS as BookingService
    participant DB as Database
    participant Noti as NotificationService

    loop mỗi 5 phút
        Cron->>BS: scanOverdueBookings()
        BS->>DB: SELECT booking WHERE status=CONFIRMED AND now - startTime > 15..30 phút
        alt Có booking quá hạn
            BS->>DB: UPDATE status = CANCELLED_AUTO
            BS->>DB: UPDATE room.status = AVAILABLE
            BS->>Noti: gửi cảnh báo huỷ lịch (FR-6.3)
        else Không có
            BS-->>Cron: không có gì cần xử lý
        end
    end
```

### 4.5 Báo cáo & xử lý sự cố thiết bị (FR-4.2, FR-4.3)

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    actor AD as Admin/Staff
    participant DC as DeviceController
    participant DS as DeviceService
    participant DB as Database

    SV->>DC: POST /api/device/incident (mô tả lỗi, ảnh)
    DC->>DS: reportIncident(IncidentReportRequest)
    DS->>DB: lưu IncidentReport (status=OPEN)
    DS-->>DC: OK
    DC-->>SV: "Đã ghi nhận sự cố"

    AD->>DC: xác nhận thiết bị hỏng
    DC->>DS: updateHardwareStatus(BROKEN)
    DS->>DB: UPDATE HardwareResource.status = BROKEN
    Note over DS,DB: FR-4.3: hệ thống tự động loại phòng<br/>này khỏi kết quả lọc có yêu cầu thiết bị đó

    AD->>DC: xác nhận đã sửa xong
    DC->>DS: updateHardwareStatus(GOOD)
    DS->>DB: UPDATE HardwareResource.status = GOOD
    Note over DS,DB: Phòng được mở lại trong gợi ý tìm kiếm
```

---

## 5. Ghi chú cho các nhóm

- **Class Diagram** ở mục 2 khớp 1:1 với entity đã có trong `backend/src/main/java/.../entity/`.
  Khi nhóm nào cần thêm field, hãy cập nhật lại diagram này để cả team không lệch ERD.
- **Sequence Diagram** ở mục 4 tương ứng đúng Normal Flow / Exception Flow trong SRS — dùng làm
  cơ sở viết method trong `Service` và test case (happy path + exception path).
- Diagram này **chưa** vẽ chi tiết luồng SSO Google, luồng OTP khôi phục mật khẩu, và luồng
  Notification queue khi email bị nghẽn — có thể bổ sung sau khi nhóm Auth/Notification chốt
  chi tiết kỹ thuật (OAuth2 provider, hàng đợi email dùng công nghệ gì).

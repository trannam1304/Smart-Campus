# Smart Campus Facility & Study Room Reservation Platform

Nền tảng Quản lý & Đặt phòng tự học, Cơ sở vật chất trường đại học thông minh (Smart Campus). Dự án được thiết kế và xây dựng theo kiến trúc Client-Server hoàn chỉnh, bám sát tài liệu đặc tả yêu cầu phần mềm tiêu chuẩn **SRS ISO/IEC/IEEE 29148**.

---

## 📑 Mục lục
1. [Kiến trúc & Công nghệ](#-kiến-trúc--công-nghệ)
2. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
3. [Yêu cầu môi trường (Prerequisites)](#-yêu-cầu-môi-trường-prerequisites)
4. [Hướng dẫn khởi chạy hệ thống (Fullstack)](#-hướng-dẫn-khởi-chạy-hệ-thống-fullstack)
   - [Bước 1: Khởi động cơ sở dữ liệu MySQL](#bước-1-khởi-động-cơ-sở-dữ-liệu-mysql)
   - [Bước 2: Khởi động Backend Spring Boot](#bước-2-khởi-động-backend-spring-boot)
   - [Bước 3: Khởi động Frontend React](#bước-3-khởi-động-frontend-react)
5. [Tài khoản đăng nhập mặc định (Seed Accounts)](#-tài-khoản-đăng-nhập-mặc-định-seed-accounts)
6. [Tài liệu API & Swagger UI](#-tài-liệu-api--swagger-ui)
7. [Chạy kiểm thử tự động (Testing)](#-chạy-kiểm-thử-tự-động-testing)
8. [Quy ước nhánh Git (Git Workflow)](#-quy-ước-nhánh-git-git-workflow)
9. [Tài liệu đặc tả (Documentation)](#-tài-liệu-đặc-tả-documentation)

---

## 🛠 Kiến trúc & Công nghệ

Hệ thống hoạt động ở chế độ kết nối trực tiếp Client-Server (100% API Backend thật, không dùng dữ liệu giả lập):

* **Backend:**
  - Ngôn ngữ & Framework: **Java 17+**, **Spring Boot 3.x**
  - CSDL & ORM: **MySQL 8.0** (có cấu hình profile PostgreSQL), **Spring Data JPA / Hibernate**
  - Quản lý Migration CSDL tự động: **Flyway** (tự động tạo schema, đánh index hiệu năng và nạp sẵn 65 phòng học cùng tài khoản ban đầu từ V1 → V13)
  - Bảo mật & Phân quyền: **Spring Security**, **JWT (JSON Web Token)**, mã hóa mật khẩu **BCrypt**
  - Tài liệu tương tác API: **OpenAPI 3 / Swagger UI** (cổng `8088`)
  - Quản lý build: **Maven Wrapper (`mvnw` / `mvnw.cmd`)**
* **Frontend:**
  - Nền tảng: **React 18**, **TypeScript**, **Vite** (cổng `3000`)
  - Giao diện: **Tailwind CSS**, icon **Lucide React**
  - Tiện ích: **React Router DOM v6**, **React Big Calendar**, **html5-qrcode** (quét mã QR qua camera)
  - HTTP Client: **Axios** kết nối trực tiếp đến REST API Backend
* **Hạ tầng & CI/CD:**
  - **Docker & Docker Compose** (khởi tạo MySQL 8.0 một chạm)
  - **GitHub Actions** (CI pipeline tự động kiểm thử cả Backend và Frontend)

---

## 📂 Cấu trúc thư mục dự án

```text
Smart-Campus/
├── .github/workflows/          # Kịch bản CI/CD (GitHub Actions)
├── backend/
│   └── backend-skeleton/       # Dự án Spring Boot Backend
│       ├── .mvn/wrapper/       # Maven Wrapper
│       ├── pom.xml             # Cấu hình Maven dependencies
│       ├── mvnw / mvnw.cmd     # Script thực thi Maven
│       └── src/
│           ├── main/java/com/smartcampus/backend/
│           │   ├── config/     # CORS, Security, Swagger
│           │   ├── controller/ # REST Controllers (Auth, Room, Booking, Checkin, ...)
│           │   ├── service/    # Xử lý nghiệp vụ & Service Implementations
│           │   ├── repository/ # Spring Data JPA Repositories
│           │   ├── entity/     # JPA Entities (User, Room, Booking, ...)
│           │   ├── dto/        # DTO Request / Response
│           │   └── security/   # JWT Token Provider & Filter
│           └── main/resources/
│               ├── application.yml        # Cấu hình chính (Cổng server: 8088)
│               ├── application-mysql.yml  # Cấu hình kết nối MySQL
│               └── db/migration/          # Script Flyway Migration (V1 → V13)
├── frontend/                   # Dự án React Frontend
│   ├── public/                 # Tài nguyên tĩnh
│   ├── src/
│   │   ├── api/                # Axios Client & các hàm gọi REST API Backend
│   │   ├── components/         # UI Components dùng chung (Modal, Toast, Calendar, ...)
│   │   ├── data/               # Sơ đồ toạ độ toà nhà & dữ liệu tĩnh tầng (floors, floorMaps)
│   │   ├── features/           # Module nghiệp vụ (Auth, Booking, Room Schedule, ...)
│   │   ├── pages/              # Màn hình giao diện (Student, Staff, Admin, Auth)
│   │   ├── routes/             # Định tuyến URL & Protected Routes
│   │   └── utils/              # Tiện ích (QR code, validate thời gian, format số liệu)
│   ├── package.json            # Quản lý dependencies
│   ├── vite.config.ts          # Cấu hình Vite & Reverse Proxy (Cổng: 3000)
│   ├── .env                    # Biến môi trường kết nối Backend
│   └── .env.example            # File mẫu cấu hình biến môi trường
├── docs/                       # Toàn bộ tài liệu đặc tả hệ thống
│   ├── srs/                    # Đặc tả yêu cầu phần mềm (SRS ISO 29148)
│   ├── erd/                    # Sơ đồ CSDL quan hệ ERD (PDF & SQL)
│   ├── api-spec/               # Đặc tả API endpoints
│   ├── UML/                    # Sơ đồ Use Case, Activity, Sequence
│   └── BRANCHING.md            # Quy ước nhánh Git
├── docker-compose.yml          # Container MySQL 8.0
└── README.md                   # Hướng dẫn dự án
```

---

## 💻 Yêu cầu môi trường (Prerequisites)

Hãy đảm bảo máy tính đã cài đặt đầy đủ:

| Công cụ | Phiên bản khuyến nghị | Kiểm tra |
|---|---|---|
| **JDK (Java Development Kit)** | Java 17 trở lên (khuyên dùng JDK 17 hoặc 21 LTS) | `java -version` |
| **Node.js & npm** | Node.js 18.x hoặc 20+ LTS | `node -v` và `npm -v` |
| **Docker Desktop** | Khuyến khích dùng để bật MySQL nhanh | `docker --version` |
| **Git** | Phiên bản bất kỳ | `git --version` |

> [!WARNING]
> **Lưu ý đối với hệ điều hành Windows:**
> Đường dẫn thư mục chứa dự án **không được chứa khoảng trắng hoặc ký tự tiếng Việt có dấu** (ví dụ tránh `D:\Học Tập\Dự án\...`). Hãy đặt ở đường dẫn tiêu chuẩn như `D:\Smart-Campus` để Maven Wrapper không bị lỗi classpath khi build.

---

## 🚀 Hướng dẫn khởi chạy hệ thống (Fullstack)

Toàn bộ hệ thống được khởi chạy qua 3 bước: Cơ sở dữ liệu → Backend Spring Boot → Frontend React.

### Bước 1: Khởi động cơ sở dữ liệu MySQL

Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục gốc dự án (`Smart-Campus`):

```bash
docker compose up -d mysql
```

* Lệnh sẽ tải image và tạo container `smart-campus-mysql` chạy tại cổng `3306`.
* Thông tin kết nối mặc định:
  - **Host:** `localhost`
  - **Port:** `3306`
  - **Database:** `smart_campus_db`
  - **Username:** `root`
  - **Password:** `root`

> [!NOTE]
> **Nếu máy tính không sử dụng Docker:**
> Bạn có thể cài MySQL 8.0 trực tiếp trên máy, tạo cơ sở dữ liệu `CREATE DATABASE smart_campus_db;`, rồi kiểm tra lại username/password trong file [application-mysql.yml](file:///d:/Smart-Campus/backend/backend-skeleton/src/main/resources/application-mysql.yml).

---

### Bước 2: Khởi động Backend Spring Boot

Mở một cửa sổ Terminal mới:

```bash
cd backend/backend-skeleton
```

* **Trên Windows (PowerShell / CMD):**
  ```powershell
  .\mvnw spring-boot:run
  ```
* **Trên macOS / Linux:**
  ```bash
  chmod +x ./mvnw
  ./mvnw spring-boot:run
  ```

> [!TIP]
> **Cơ chế nạp CSDL tự động qua Flyway:**
> Khi Backend khởi động, công cụ **Flyway** sẽ tự động chạy các script migration từ `V1` đến `V13`. Toàn bộ cấu trúc bảng, khóa ngoại, index hiệu năng, 65 phòng học toà L và các tài khoản quản trị/nhân viên mẫu sẽ được tạo tự động. Bạn **không cần phải import file SQL bằng tay**.

Khi màn hình xuất hiện thông báo:
```text
Started SmartCampusBackendApplication in ... seconds
```
Backend đã sẵn sàng hoạt động tại cổng **`8088`**.

---

### Bước 3: Khởi động Frontend React

Mở một cửa sổ Terminal khác:

1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Kiểm tra file cấu hình môi trường `.env`:
   *(File `.env` đã được cấu hình sẵn trỏ về Backend cổng 8088)*:
   ```env
   VITE_API_BASE_URL=http://localhost:8088/api
   ```

4. Khởi động giao diện người dùng:
   ```bash
   npm run dev
   ```

5. Mở trình duyệt và truy cập ứng dụng:
   👉 **`http://localhost:3000`**

---

## 👥 Tài khoản đăng nhập mặc định (Seed Accounts)

Hệ thống có sẵn các tài khoản quản trị và nhân viên được khởi tạo từ Flyway migration (`V11__seed_admin_staff.sql`):

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Phạm vi quyền hạn |
|---|---|---|---|
| **Admin (Quản trị viên)** | `admin@smartcampus.tdtu.edu.vn` | `Admin@2026` | Quản trị toàn hệ thống: Quản lý phòng học, tòa nhà, thiết bị, duyệt đặt phòng hội nghị, báo cáo thống kê |
| **Nhân viên (Staff)** | `staff.tang12@lib.tdtu.edu.vn` | `Admin@2026` | Phụ trách trực phòng & xử lý sự cố thiết bị tại tầng 1 - 2 |
| **Nhân viên (Staff)** | `staff.tang35@lib.tdtu.edu.vn` | `Admin@2026` | Phụ trách trực phòng & xử lý sự cố thiết bị tại tầng 3 - 5 |

> [!NOTE]
> **Tài khoản Sinh viên (Student):**
> Sinh viên có thể tạo tài khoản trực tiếp bằng cách bấm vào **"Đăng ký ngay"** trên màn hình Đăng nhập (`http://localhost:3000/register`). Hệ thống sẽ tạo tài khoản vào CSDL MySQL và tự động đăng nhập.

---

## 📖 Tài liệu API & Swagger UI

Sau khi Backend khởi động, bạn có thể tra cứu toàn bộ danh sách endpoint, request/response payload và thực thi gọi API trực tiếp trên Swagger UI:

👉 **`http://localhost:8088/swagger-ui.html`**

Các nhóm endpoint chính:
- **`/api/auth/**`** — Đăng ký, đăng nhập JWT, làm mới token, đổi mật khẩu (FR-1.1 → FR-1.4).
- **`/api/v1/rooms/**`** — Danh sách phòng phân trang, chi tiết phòng, bộ lọc tiện ích (FR-2.1 → FR-2.4).
- **`/api/v1/buildings/**`** — Quản lý tòa nhà và tầng.
- **`/api/v1/rooms/{id}/equipments/**`** — Quản lý danh mục thiết bị phòng (FR-4.1 → FR-4.3).
- **`/api/bookings/**`** — Đặt phòng, kiểm tra trùng lịch (Conflict Checking), hạn mức tuần (FR-3.1 → FR-3.3).
- **`/api/checkin/**`** — Check-in QR code điểm danh nhận phòng (FR-5.1 → FR-5.3).
- **`/api/incidents/**`** — Gửi báo cáo sự cố hư hỏng thiết bị kèm hình ảnh (FR-4.2).

---

## 🧪 Chạy kiểm thử tự động (Testing)

### Kiểm thử Backend (JUnit 5 & Mockito)
```bash
cd backend/backend-skeleton
.\mvnw test
```

### Kiểm thử Frontend (Vitest)
```bash
cd frontend
npm run test
```

---

## 🌿 Quy ước nhánh Git (Git Workflow)

Dự án áp dụng mô hình Git Flow. Chi tiết xem tại [`docs/BRANCHING.md`](docs/BRANCHING.md):

* `main`: Nhánh ổn định, dùng cho bản phát hành chính thức.
* `develop`: Nhánh tích hợp chính để ghép các chức năng.
* `feature/<tên-tính-năng>`: Nhánh làm tính năng mới, tạo từ `develop` và đặt tên theo mã FR:
  - Ví dụ: `feature/auth-register` (FR-1.1), `feature/booking-conflict-check` (FR-3.2).
* `hotfix/<mô-tả>`: Nhánh sửa lỗi khẩn cấp tạo trực tiếp từ `main`.

---

## 📚 Tài liệu đặc tả (Documentation)

- 📄 [Tài liệu Đặc tả Yêu cầu Phần mềm (SRS ISO 29148)](docs/srs/)
- 🗄️ [Sơ đồ CSDL Quan hệ ERD](docs/erd/)
- 📐 [Sơ đồ UML (Use Case, Sequence, Activity)](docs/UML/UML.md)
- 🔌 [Tài liệu API Contract](docs/api-spec/)
- 🤝 [Quy ước phân nhánh Git](docs/BRANCHING.md)

---

**© 2026 Smart Campus Team. All rights reserved.**

# Tài Liệu Đặc Tả API - Yêu Cầu Từ Phía Frontend (Frontend-Required Endpoints)

## 1. Endpoint `GET /api/rooms`

Tra cứu danh sách phòng học theo các bộ lọc tìm kiếm.

### Query Parameters hiện tại và ĐỀ XUẤT mới

| Tham số | Kiểu dữ liệu | Bắt buộc | Trạng thái | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `q` | `string` | Không | Hiện có | Tìm kiếm tương đối theo mã phòng (VD: `L.001`, `L.101`). |
| `date` | `string` (YYYY-MM-DD) | Không | Hiện có | Ngày cần tìm phòng trống. |
| `startTime` | `string` (HH:mm) | Không | Hiện có | Giờ bắt đầu khung thời gian tìm kiếm. |
| `endTime` | `string` (HH:mm) | Không | Hiện có | Giờ kết thúc khung thời gian tìm kiếm. |
| `capacity` | `number` | Không | Hiện có | Sức chứa tối thiểu của phòng. |
| `buildingId` | `string` | Không | Hiện có | Mã tòa nhà (hiện tại mặc định là `Tòa L`). Ẩn khỏi giao diện người dùng. |
| `hasProjector` | `boolean` | Không | Hiện có (Legacy) | Lọc phòng có máy chiếu. Giữ để tương thích ngược. |
| **`floor`** | `number` (0–5) | Không | **ĐỀ XUẤT CHỜ BE** | Lọc theo số tầng thư viện: `0` (Tầng G), `1` (Tầng 1), `2` (Tầng 2), `3` (Tầng 3), `4` (Tầng 4), `5` (Tầng 5). Thay thế bộ lọc Tòa nhà trên UI. |
| **`equipment`** | `string[]` hoặc lặp lại query param `equipment=PROJECTOR&equipment=AC` | Không | **ĐỀ XUẤT CHỜ BE** | Danh sách nhóm thiết bị phòng bắt buộc phải có đủ (AND logic). Các giá trị hợp lệ: `PROJECTOR`, `TV`, `WHITEBOARD`, `AC`, `SOCKET`, `AUDIO`. **Quy tắc (FR-4.3)**: Chỉ tính thiết bị có trạng thái `GOOD`, các thiết bị `BROKEN` hoặc `REPAIRING` không được tính là phòng có trang bị thiết bị đó. |

### Các nhóm thiết bị chuẩn hóa (`DeviceCategory`):
- `PROJECTOR`: Máy chiếu (HDMI, 4K, wifi)
- `TV`: Smart TV, Màn hình hiển thị, Màn hình tra cứu, Màn hình chiếu video, Đầu đọc đĩa CD/DVD
- `WHITEBOARD`: Bảng từ trắng, Bảng học nhóm, Bảng từ thuyết trình, Bảng tương tác
- `AC`: Điều hòa nhiệt độ
- `SOCKET`: Ổ cắm điện bàn học
- `AUDIO`: Loa thuyết trình, Loa hội thảo, Hệ thống âm thanh
- `OTHER`: Bàn đọc nhóm, Bàn đọc cá nhân, Đèn đọc sách, Màn chiếu lớn...

### Ví dụ Request (Đề xuất):
```http
GET /api/rooms?floor=1&equipment=PROJECTOR&equipment=WHITEBOARD&date=2026-10-15&startTime=09:00&endTime=11:00 HTTP/1.1
Host: campus.university.edu.vn
Authorization: Bearer <token>
```

### Ví dụ Response:
```json
{
  "success": true,
  "code": 200,
  "message": "Thành công",
  "data": {
    "items": [
      {
        "id": "r-101",
        "roomCode": "L.101",
        "roomType": "Phòng thuyết trình",
        "building": "Tòa L",
        "floor": 1,
        "floorCode": "1st - Floor",
        "capacity": 6,
        "status": "AVAILABLE",
        "devices": [
          { "id": "d7", "name": "Máy chiếu HDMI", "status": "GOOD", "category": "PROJECTOR" }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2026-10-14T15:00:00.000Z"
}
```

---

## 2. Endpoints Duyệt Đơn Đặt Phòng Hội Nghị (ĐỀ XUẤT CHỜ BE)

Thay thế chức năng duyệt tài khoản cũ (không có trong SRS; FR-1.1 quy định kích hoạt tài khoản sinh viên qua email). Thay vào đó, áp dụng cho quy trình phê duyệt đặt phòng hội nghị (`L.106`, `L.506` - `requiresApproval = true`).

### Quy tắc trạng thái `PENDING_APPROVAL` theo P-APPROVE-LAG:
1. **Khởi tạo**: Khi sinh viên đặt phòng có cờ `requiresApproval: true`, booking được tạo với trạng thái `PENDING_APPROVAL`.
2. **Khóa khung giờ (FR-3.2)**: Trong lúc chờ duyệt, khung giờ này vẫn được tính là đã chiếm giữ (không cho phép người khác đặt trùng lặp thời gian).
3. **Chưa cấp mã QR**: Booking ở trạng thái `PENDING_APPROVAL` chưa sinh mã QR (`qrCode: ""` / `null`), sinh viên chưa thể check-in.
4. **Phê duyệt**: Quản trị viên duyệt đơn -> chuyển sang `CONFIRMED`, hệ thống cấp mã QR và gửi thông báo xác nhận cho sinh viên.
5. **Từ chối**: Quản trị viên từ chối kèm lý do bắt buộc -> chuyển sang `CANCELLED_ADMIN`, lưu `cancelReason`, lập tức giải phóng khung giờ cho sinh viên khác đặt, và gửi thông báo lý do từ chối.

### A. Phê duyệt đơn đặt phòng: `PUT /api/admin/bookings/{id}/approve`

**Headers:**
```http
PUT /api/admin/bookings/BK-8907/approve HTTP/1.1
Host: campus.university.edu.vn
Authorization: Bearer <admin-token>
```

**Response thành công (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Đã duyệt đơn đặt phòng L.106 thành công. Mã QR đã được cấp cho sinh viên.",
  "data": {
    "bookingId": "BK-8907",
    "roomCode": "L.106",
    "status": "CONFIRMED",
    "qrCode": "SMART-CAMPUS-BK-8907",
    "approvedAt": "2026-10-14T15:50:00.000Z"
  },
  "timestamp": "2026-10-14T15:50:00.000Z"
}
```

### B. Từ chối đơn đặt phòng: `PUT /api/admin/bookings/{id}/reject`

**Request Body:**
```json
{
  "reason": "Phòng hội nghị trùng lịch hội thảo cấp trường của Ban Giám hiệu."
}
```

**Response thành công (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "message": "Đã từ chối đơn đặt phòng L.106. Khung giờ đã được giải phóng.",
  "data": {
    "bookingId": "BK-8907",
    "roomCode": "L.106",
    "status": "CANCELLED_ADMIN",
    "cancelReason": "Phòng hội nghị trùng lịch hội thảo cấp trường của Ban Giám hiệu.",
    "rejectedAt": "2026-10-14T15:50:00.000Z"
  },
  "timestamp": "2026-10-14T15:50:00.000Z"
}
```

---

## 3. Endpoint Cập Nhật Trạng Thái Bảo Trì Phòng (ĐỀ XUẤT CHỜ BE)

Cho phép Quản trị viên chuyển phòng sang trạng thái Bảo trì kèm lý do bắt buộc, hoặc Mở trống phòng sẵn sàng hoạt động.

### `PUT /api/admin/rooms/{id}/status`

**Khi chuyển sang Bảo trì (`status: MAINTENANCE`):**
```http
PUT /api/admin/rooms/r-103/status HTTP/1.1
Host: campus.university.edu.vn
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "MAINTENANCE",
  "reason": "Máy chiếu hỏng, chờ linh kiện thay thế"
}
```

**Khi mở trống phòng (`status: AVAILABLE`):**
```http
PUT /api/admin/rooms/r-103/status HTTP/1.1
Host: campus.university.edu.vn
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "AVAILABLE"
}
```

**Quy tắc nghiệp vụ:**
1. Khi chuyển sang `MAINTENANCE`:
   - `reason`: chuỗi ký tự bắt buộc (5 - 300 ký tự).
   - Hệ thống tự động hủy toàn bộ các lượt đặt sắp tới (`CONFIRMED` hoặc `PENDING_APPROVAL`) của phòng này thành `CANCELLED_ADMIN` với `cancelReason`: `Phòng bảo trì: ${reason}`.
   - Gửi thông báo lý do hủy kèm chi tiết đến sinh viên đã đặt phòng.
   - Lưu `maintenanceReason` vào bản ghi phòng để quản trị viên có thể xem lại bất kỳ lúc nào.
2. Khi chuyển sang `AVAILABLE`:
   - Phòng chuyển về trạng thái hoạt động bình thường, xuất hiện trở lại trong danh sách tìm kiếm của sinh viên.
   - Xóa `maintenanceReason` của phòng.

---

## 4. Endpoint `POST /api/incidents` - Nhận ảnh đính kèm (multipart/form-data) (ĐỀ XUẤT CHỜ BE)

Khi người dùng báo cáo sự cố có kèm tệp ảnh hiện trường (chụp camera hoặc tải từ máy tính/điện thoại, dung lượng tối đa 5 MB):

### Phương án đề xuất 1 (Khuyến nghị): Gửi `multipart/form-data` trực tiếp
- **Method:** `POST`
- **Path:** `/api/incidents`
- **Content-Type:** `multipart/form-data` (boundary do client tự động sinh)
- **Form Fields:**
  - `roomId` (`string`, bắt buộc): ID phòng học gặp sự cố.
  - `equipmentId` (`string`, tùy chọn): ID thiết bị hư hỏng.
  - `description` (`string`, bắt buộc): Mô tả chi tiết hiện trạng lỗi.
  - `image` (`File` / `binary`, tùy chọn): Tệp ảnh hiện trường (JPG, PNG, WebP, HEIC, tối đa 5 MB).

Nếu người dùng **không đính kèm ảnh**, client tiếp tục gửi body dạng `application/json` như cũ:
```json
{
  "roomId": "r-101",
  "equipmentId": "dev-01",
  "description": "Điều hòa không mát"
}
```

### Phương án đề xuất 2: Endpoint tải ảnh riêng `POST /api/upload`
- **Method:** `POST`
- **Path:** `/api/upload`
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (ảnh đính kèm)
- **Response:**
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Tải ảnh lên thành công",
    "data": {
      "imageUrl": "https://cdn.campus.university.edu.vn/incidents/img-123.jpg"
    }
  }
  ```
- Sau đó client gọi `POST /api/incidents` với body JSON có trường `imageUrl`.

---

## 5. Cấp Mã QR Điểm Danh Cá Nhân Cho Từng Thành Viên & Phản Hồi Check-in (ĐỀ XUẤT CHỜ BE)

### Bối cảnh và Mục tiêu:
- Backend đã có bảng/entity `BookingMember` lưu danh sách thành viên của từng lượt đặt phòng.
- Nhằm tránh gian lận điểm danh và đảm bảo từng sinh viên tự có trách nhiệm quét mã của chính mình: **Mỗi thành viên có MỘT mã QR riêng biệt** (`SMART-CAMPUS-<bookingId>-<MSSV>`). Ai đăng nhập chỉ thấy mã của mình.
- Sau khi quét mã tại kiosk/máy quét cửa phòng, phản hồi trả về cần có thông tin chi tiết của người vừa điểm danh kèm tiến độ tổng số thành viên đã điểm danh.

### 5.1. Định dạng mã QR cá nhân
- **Quy ước:** `SMART-CAMPUS-<mã lượt đặt>-<MSSV>`
  - Ví dụ: `SMART-CAMPUS-BK-8901-52100888`
- Đối với phòng hội nghị cần duyệt (`PENDING_APPROVAL`) hoặc lượt đặt bị hủy: mã của mọi thành viên là rỗng (`""` / `null`) cho đến khi quản trị viên phê duyệt.

### 5.2. Đề xuất cập nhật response `POST /api/bookings`
Khi tạo lượt đặt phòng thành công, ngoài `qrCodeData` của người đặt phòng, trả về thêm danh sách `memberQrCodes`:
```json
{
  "success": true,
  "code": 200,
  "message": "Đặt phòng thành công",
  "data": {
    "bookingId": "BK-8901",
    "roomCode": "L.102",
    "bookingStatus": "CONFIRMED",
    "qrCodeData": "SMART-CAMPUS-BK-8901-52100888",
    "checkInWindow": {
      "allowEarlyFrom": "08:45",
      "deadlineAt": "09:15"
    },
    "memberQrCodes": [
      { "studentCode": "52100888", "qrCodeData": "SMART-CAMPUS-BK-8901-52100888" },
      { "studentCode": "52100666", "qrCodeData": "SMART-CAMPUS-BK-8901-52100666" }
    ]
  }
}
```

### 5.3. Đề xuất cập nhật response `POST /api/checkin/qr`
- **Request Body:**
  ```json
  {
    "qrData": "SMART-CAMPUS-BK-8901-52100888",
    "scannedAt": "2026-11-02T08:55:00+07:00",
    "deviceLocation": "Door L.102"
  }
  ```
- **Quy tắc xử lý:**
  1. Phân tích `qrData` lấy `bookingId` và `studentCode`. Kiểm tra sinh viên có trong danh sách thành viên của lượt đặt và mã QR có khớp.
  2. Lần quét đầu tiên (lượt đặt đang `CONFIRMED`, trong khung `[start-15, start+15]`): chuyển trạng thái phòng sang `IN_USE`.
  3. Các thành viên quét tiếp theo khi phòng đã `IN_USE`: vẫn được chấp nhận đến hết giờ kết thúc phòng (`endTime`), không báo lỗi "đã check-in trước đó".
  4. Nếu cùng một MSSV quét lại lần thứ 2: trả về mã lỗi 400 kèm thông báo `"MSSV {MSSV} đã điểm danh lúc {HH:mm}"`.
  5. Ghi nhận thời gian `checkedInAt` cho từng thành viên.
- **Response thành công:**
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Điểm danh thành công",
    "data": {
      "bookingId": "BK-8901",
      "roomCode": "L.102",
      "status": "IN_USE",
      "checkInTime": "2026-11-02T08:55:00+07:00",
      "student": {
        "studentCode": "52100888",
        "studentName": "La Thái Thành"
      },
      "checkedInCount": 1,
      "totalMembers": 5
    }
  }
  ```




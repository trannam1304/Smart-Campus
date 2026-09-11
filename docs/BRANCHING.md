# Quy ước nhánh Git

| Nhánh | Vai trò |
|---|---|
| main | Code luôn chạy được, dùng để release/deploy |
| develop | Nhánh tích hợp các feature |
| feature/<module>-<mo-ta> | Mỗi tính năng 1 nhánh, tạo từ develop |
| release/x.x | Đóng băng để test trước khi lên main |
| hotfix/<mo-ta> | Sửa lỗi khẩn cấp trên main |

Ví dụ:
- feature/auth-register (FR-1.1)
- feature/auth-sso-login (FR-1.2)
- feature/booking-conflict-check (FR-3.2)
- feature/checkin-qr-generate (FR-5.1)
- feature/notification-reminder (FR-6.2)

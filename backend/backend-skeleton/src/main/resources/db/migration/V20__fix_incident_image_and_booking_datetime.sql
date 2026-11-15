-- Flyway migration: V20__fix_incident_image_and_booking_datetime.sql
-- 1. Cho phép lưu ảnh hiện trường Base64 dung lượng lớn trong báo cáo sự cố
ALTER TABLE incident_reports MODIFY COLUMN image_url MEDIUMTEXT NULL;

-- 2. Cho phép qr_code là NULL khi đơn đặt phòng ở trạng thái chờ duyệt (PENDING_APPROVAL)
ALTER TABLE bookings MODIFY COLUMN qr_code VARCHAR(255) NULL;

-- 3. Chuyển start_time và end_time sang DATETIME để so sánh chính xác mốc ngày giờ chống trùng lịch
ALTER TABLE bookings MODIFY COLUMN start_time DATETIME NOT NULL;
ALTER TABLE bookings MODIFY COLUMN end_time DATETIME NOT NULL;

-- 4. Đồng bộ lại dữ liệu ngày giờ cho các booking đã có
UPDATE bookings SET start_time = TIMESTAMP(booking_date, TIME(start_time));
UPDATE bookings SET end_time = TIMESTAMP(booking_date, TIME(end_time));

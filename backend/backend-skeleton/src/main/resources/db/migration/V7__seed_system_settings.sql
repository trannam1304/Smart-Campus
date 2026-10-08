-- Flyway migration: V7__seed_system_settings.sql
-- Source: SQL_migration1(1).sql

-- 6.2 Tham số hệ thống chuẩn (SYSTEM_SETTINGS)
INSERT INTO system_settings (setting_key, setting_value, unit, description) VALUES
('quota.hours_per_week', '10', 'hours', 'Hạn mức thời gian sử dụng phòng tối đa của mỗi sinh viên trong 1 tuần (P-QUOTA-WEEK)'),
('checkin.grace_minutes', '15', 'minutes', 'Thời gian khóa phòng chờ check-in trước khi hệ thống tự động hủy lượt và phạt no-show (P-GRACE)'),
('checkin.early_minutes', '15', 'minutes', 'Thời gian cho phép check-in sớm trước giờ bắt đầu (P-EARLY-IN)'),
('booking.slot_minutes', '30', 'minutes', 'Bước chia khung giờ đặt phòng (P-SLOT)'),
('booking.min_duration_minutes', '90', 'minutes', 'Thời lượng đặt tối thiểu cho mỗi lượt phòng tiêu chuẩn (P-MIN-DUR)'),
('booking.max_duration_minutes', '120', 'minutes', 'Thời lượng đặt tối đa cho mỗi lượt phòng tiêu chuẩn (P-MAX-DUR-STD)'),
('night.open_time', '19:30', 'time', 'Giờ mở cửa khu vực tự học qua đêm Hầm B1'),
('night.min_lead_minutes', '30', 'minutes', 'Hạn đăng ký ca đêm trước giờ mở cửa (P-NIGHT-LEAD: trước 19:00 cùng ngày)'),
('night.min_headcount', '30', 'person', 'Sĩ số tối thiểu cho mỗi nhóm đăng ký khu vực học qua đêm (P-NIGHT-MIN)'),
('discipline.max_no_show', '2', 'times', 'Số lần vi phạm no-show tối đa trong năm học trước khi bị khóa tài khoản (P-NOSHOW-LOCK)'),
('discipline.lock_days', '90', 'days', 'Thời gian khóa quyền đặt phòng khi vi phạm quy chế no-show (P-NOSHOW-LOCK 90 ngày)')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

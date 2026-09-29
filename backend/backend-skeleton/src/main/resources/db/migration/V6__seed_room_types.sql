-- Flyway migration: V6__seed_room_types.sql
-- Source: SQL_migration1(1).sql

-- 6.1 Danh mục loại phòng (ROOM_TYPES) theo đặc tả ERD và Quy chế TDTU
INSERT INTO room_types (
    type_code,
    type_name,
    default_duration_minutes,
    min_duration_minutes,
    max_duration_minutes,
    slot_minutes,
    occupancy_min_ratio,
    min_headcount,
    lead_time_days,
    requires_approval,
    allow_overlap_booking,
    fee_enabled,
    fee_per_hour
) VALUES 
('GROUP', 'Phòng học nhóm tiêu chuẩn', 120, 90, 120, 30, 0.50, NULL, 0, FALSE, FALSE, FALSE, NULL),
('GROUP_AREA', 'Khu vực học nhóm mở', 120, 90, 120, 30, 0.50, NULL, 0, FALSE, FALSE, FALSE, NULL),
('INDIVIDUAL', 'Phòng nghiên cứu cá nhân', 120, 90, NULL, 30, 0.00, 1, 0, FALSE, FALSE, FALSE, NULL),
('PRESENTATION', 'Phòng thuyết trình đa phương tiện', 120, 90, 120, 30, 0.50, NULL, 0, FALSE, FALSE, FALSE, NULL),
('VIDEO_ROOM', 'Phòng xem phim nhóm', 120, 90, 180, 30, 0.50, NULL, 0, FALSE, FALSE, FALSE, NULL),
('VIDEO_AREA', 'Khu vực xem phim chung', 120, 90, 180, 30, 0.00, NULL, 0, FALSE, FALSE, FALSE, NULL),
('NIGHT_AREA', 'Khu vực tự học qua đêm (Hầm B1)', 120, 90, NULL, 30, 0.00, 30, 0, FALSE, TRUE, FALSE, NULL),
('STUDIO', 'Studio quay phim & Podcast', 180, 60, 240, 30, 0.00, 1, 3, TRUE, FALSE, FALSE, NULL),
('CONFERENCE', 'Phòng hội thảo chuyên đề', 180, 60, 300, 30, 0.30, 10, 2, TRUE, FALSE, FALSE, NULL)
ON DUPLICATE KEY UPDATE 
    type_name = VALUES(type_name),
    default_duration_minutes = VALUES(default_duration_minutes),
    min_duration_minutes = VALUES(min_duration_minutes),
    max_duration_minutes = VALUES(max_duration_minutes),
    occupancy_min_ratio = VALUES(occupancy_min_ratio),
    min_headcount = VALUES(min_headcount),
    lead_time_days = VALUES(lead_time_days),
    requires_approval = VALUES(requires_approval),
    allow_overlap_booking = VALUES(allow_overlap_booking);

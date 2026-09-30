-- Flyway migration: V6__seed_room_types.sql

-- 6.1 Danh mục loại phòng (ROOM_TYPES) theo đặc tả ERD và Quy chế TDTU
INSERT INTO room_types (
    type_code,
    type_name,
    default_duration_minutes,
    min_duration_minutes,
    max_duration_minutes,
    slot_minutes,
    occupancy_min_ratio,
    min_headcount
) VALUES 
('GROUP', 'Phòng học nhóm tiêu chuẩn', 120, 90, 120, 30, 0.50, NULL),
('GROUP_AREA', 'Khu vực học nhóm mở', 120, 90, 120, 30, 0.50, NULL),
('INDIVIDUAL', 'Phòng nghiên cứu cá nhân', 120, 90, NULL, 30, 0.00, 1),
('PRESENTATION', 'Phòng thuyết trình đa phương tiện', 120, 90, 120, 30, 0.50, NULL),
('VIDEO_ROOM', 'Phòng xem phim nhóm', 120, 90, 180, 30, 0.50, NULL),
('VIDEO_AREA', 'Khu vực xem phim chung', 120, 90, 180, 30, 0.00, NULL),
('NIGHT_AREA', 'Khu vực tự học qua đêm (Hầm B1)', 120, 90, NULL, 30, 0.00, 30),
('STUDIO', 'Studio quay phim & Podcast', 180, 60, 240, 30, 0.00, 1),
('CONFERENCE', 'Phòng hội thảo chuyên đề', 180, 60, 300, 30, 0.30, 10)
ON DUPLICATE KEY UPDATE 
    type_name = VALUES(type_name),
    default_duration_minutes = VALUES(default_duration_minutes),
    min_duration_minutes = VALUES(min_duration_minutes),
    max_duration_minutes = VALUES(max_duration_minutes),
    occupancy_min_ratio = VALUES(occupancy_min_ratio),
    min_headcount = VALUES(min_headcount);
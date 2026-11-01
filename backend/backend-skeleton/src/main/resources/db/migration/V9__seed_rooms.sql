-- Flyway migration: V9__seed_rooms.sql
-- Source: SQL_migration1(1).sql

-- 6.4 PHÒNG / KHU VỰC TỰ HỌC (ROOMS)
-- Số lượng và sức chứa lấy đúng theo catalog khảo sát mục 3.3:
-- GROUP 3, GROUP_AREA 8+24, INDIVIDUAL 8, PRESENTATION 9 (8 phòng 5-9 + 1 phòng 30),
-- VIDEO_ROOM 2, VIDEO_AREA 8 (4 khu 12 chỗ + 4 khu 2 chỗ), NIGHT_AREA 1 (1.000 chỗ),
-- STUDIO 1, CONFERENCE 1 (40 chỗ). Tổng 65 phòng/khu vực cần đặt chỗ.
-- =====================================================================

SET @rt_group        = (SELECT room_type_id FROM room_types WHERE type_code = 'GROUP');
SET @rt_group_area   = (SELECT room_type_id FROM room_types WHERE type_code = 'GROUP_AREA');
SET @rt_individual   = (SELECT room_type_id FROM room_types WHERE type_code = 'INDIVIDUAL');
SET @rt_presentation = (SELECT room_type_id FROM room_types WHERE type_code = 'PRESENTATION');
SET @rt_video_room   = (SELECT room_type_id FROM room_types WHERE type_code = 'VIDEO_ROOM');
SET @rt_video_area   = (SELECT room_type_id FROM room_types WHERE type_code = 'VIDEO_AREA');
SET @rt_night_area   = (SELECT room_type_id FROM room_types WHERE type_code = 'NIGHT_AREA');
SET @rt_studio       = (SELECT room_type_id FROM room_types WHERE type_code = 'STUDIO');
SET @rt_conference   = (SELECT room_type_id FROM room_types WHERE type_code = 'CONFERENCE');

SET @building_g_id = (SELECT building_id FROM buildings WHERE building_name = 'Thư viện TDTU - Tòa nhà G' LIMIT 1);
SET @floor_b1 = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = -1);
SET @floor_2 = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 2);
SET @floor_3 = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 3);
SET @floor_4 = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 4);
SET @floor_5 = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 5);

INSERT INTO rooms (floor_id, room_type_id, room_code, capacity, base_status, map_pos_x, map_pos_y) VALUES
    -- Lầu 2: Phòng học nhóm (GROUP, 5-9 người)
    (@floor_2, @rt_group, 'N2.01', 6, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_group, 'N2.02', 8, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_group, 'N2.03', 9, 'AVAILABLE', NULL, NULL),
    -- Lầu 2: Phòng xem phim (VIDEO_ROOM, 5-8 chỗ)
    (@floor_2, @rt_video_room, 'V2.01', 6, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_room, 'V2.02', 8, 'AVAILABLE', NULL, NULL),
    -- Lầu 2: Khu vực xem phim (VIDEO_AREA) - 4 khu 12 chỗ + 4 khu 2 chỗ (có headphone)
    (@floor_2, @rt_video_area, 'X2.01', 12, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.02', 12, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.03', 12, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.04', 12, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.05', 2, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.06', 2, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.07', 2, 'AVAILABLE', NULL, NULL),
    (@floor_2, @rt_video_area, 'X2.08', 2, 'AVAILABLE', NULL, NULL),
    -- Lầu 3: Khu vực học nhóm (GROUP_AREA) - 8 cụm
    (@floor_3, @rt_group_area, 'K3.01', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.02', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.03', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.04', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.05', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.06', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.07', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_group_area, 'K3.08', 6, 'AVAILABLE', NULL, NULL),
    -- Lầu 3: Phòng thuyết trình (PRESENTATION) - phần đặt tại L3 (5/9 phòng)
    (@floor_3, @rt_presentation, 'P3.01', 6, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_presentation, 'P3.02', 7, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_presentation, 'P3.03', 8, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_presentation, 'P3.04', 9, 'AVAILABLE', NULL, NULL),
    (@floor_3, @rt_presentation, 'P3.05', 6, 'AVAILABLE', NULL, NULL),
    -- Lầu 4: Phòng nghiên cứu cá nhân (INDIVIDUAL) - 8 phòng, 1 người, ưu tiên GV/NCV
    (@floor_4, @rt_individual, 'C4.01', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.02', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.03', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.04', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.05', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.06', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.07', 1, 'AVAILABLE', NULL, NULL),
    (@floor_4, @rt_individual, 'C4.08', 1, 'AVAILABLE', NULL, NULL),
    -- Lầu 5: Khu vực học nhóm (GROUP_AREA) - 24 cụm
    (@floor_5, @rt_group_area, 'K5.01', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.02', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.03', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.04', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.05', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.06', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.07', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.08', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.09', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.10', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.11', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.12', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.13', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.14', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.15', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.16', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.17', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.18', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.19', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.20', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.21', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.22', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.23', 6, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_group_area, 'K5.24', 6, 'AVAILABLE', NULL, NULL),
    -- Lầu 5: Phòng thuyết trình (PRESENTATION) - phần đặt tại L5 (4/9 phòng, gồm 1 phòng 30 chỗ)
    (@floor_5, @rt_presentation, 'P5.01', 7, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_presentation, 'P5.02', 8, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_presentation, 'P5.03', 9, 'AVAILABLE', NULL, NULL),
    (@floor_5, @rt_presentation, 'P5.04', 30, 'AVAILABLE', NULL, NULL),
    -- Lầu 5: Phòng Studio quay phim & Podcast (lead time >= 3 ngày, Pending_Approval)
    (@floor_5, @rt_studio, 'S5.01', 6, 'AVAILABLE', NULL, NULL),
    -- Lầu 5: Phòng hội thảo trực tuyến (cần duyệt lãnh đạo, 40 chỗ)
    (@floor_5, @rt_conference, 'H5.01', 40, 'AVAILABLE', NULL, NULL),
    -- Hầm lửng B1: Khu vực tự học qua đêm (1.000 chỗ, tối thiểu 30 người/lượt, cho phép trùng nhóm)
    (@floor_b1, @rt_night_area, 'D-B1.01', 1000, 'AVAILABLE', NULL, NULL)
ON DUPLICATE KEY UPDATE
    floor_id = VALUES(floor_id),
    room_type_id = VALUES(room_type_id),
    capacity = VALUES(capacity),
    base_status = VALUES(base_status);

-- =====================================================================

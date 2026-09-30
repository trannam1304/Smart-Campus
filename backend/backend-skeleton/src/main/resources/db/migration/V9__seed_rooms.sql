-- Flyway migration: V9__seed_rooms.sql

-- 6.4 PHÒNG / KHU VỰC TỰ HỌC (ROOMS)
-- Số lượng và sức chứa lấy đúng theo catalog khảo sát mục 3.3
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

INSERT INTO rooms (
    floor_id, room_type_id, room_code, capacity, base_status, map_pos_x, map_pos_y,
    lead_time_days, requires_approval, allow_overlap_booking, fee_enabled, fee_per_hour
) VALUES
    -- Lầu 2: Phòng học nhóm (GROUP, 5-9 người)
    (@floor_2, @rt_group, 'N2.01', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_group, 'N2.02', 8, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_group, 'N2.03', 9, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 2: Phòng xem phim (VIDEO_ROOM, 5-8 chỗ)
    (@floor_2, @rt_video_room, 'V2.01', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_room, 'V2.02', 8, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 2: Khu vực xem phim (VIDEO_AREA)
    (@floor_2, @rt_video_area, 'X2.01', 12, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.02', 12, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.03', 12, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.04', 12, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.05', 2, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.06', 2, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.07', 2, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_2, @rt_video_area, 'X2.08', 2, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 3: Khu vực học nhóm (GROUP_AREA)
    (@floor_3, @rt_group_area, 'K3.01', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.02', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.03', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.04', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.05', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.06', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.07', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_group_area, 'K3.08', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 3: Phòng thuyết trình (PRESENTATION)
    (@floor_3, @rt_presentation, 'P3.01', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_presentation, 'P3.02', 7, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_presentation, 'P3.03', 8, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_presentation, 'P3.04', 9, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_3, @rt_presentation, 'P3.05', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 4: Phòng nghiên cứu cá nhân (INDIVIDUAL)
    (@floor_4, @rt_individual, 'C4.01', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.02', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.03', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.04', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.05', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.06', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.07', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_4, @rt_individual, 'C4.08', 1, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 5: Khu vực học nhóm (GROUP_AREA)
    (@floor_5, @rt_group_area, 'K5.01', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.02', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.03', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.04', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.05', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.06', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.07', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.08', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.09', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.10', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.11', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.12', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.13', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.14', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.15', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.16', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.17', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.18', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.19', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.20', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.21', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.22', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.23', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_group_area, 'K5.24', 6, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 5: Phòng thuyết trình (PRESENTATION)
    (@floor_5, @rt_presentation, 'P5.01', 7, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_presentation, 'P5.02', 8, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_presentation, 'P5.03', 9, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    (@floor_5, @rt_presentation, 'P5.04', 30, 'AVAILABLE', NULL, NULL, 0, FALSE, FALSE, FALSE, NULL),
    -- Lầu 5: Phòng Studio quay phim & Podcast (lead time >= 3 ngày, Requires_Approval = TRUE)
    (@floor_5, @rt_studio, 'S5.01', 6, 'AVAILABLE', NULL, NULL, 3, TRUE, FALSE, FALSE, NULL),
    -- Lầu 5: Phòng hội thảo trực tuyến (lead time >= 2 ngày, Requires_Approval = TRUE)
    (@floor_5, @rt_conference, 'H5.01', 40, 'AVAILABLE', NULL, NULL, 2, TRUE, FALSE, FALSE, NULL),
    -- Hầm lửng B1: Khu vực tự học qua đêm (Cho phép trùng nhóm: allow_overlap_booking = TRUE)
    (@floor_b1, @rt_night_area, 'D-B1.01', 1000, 'AVAILABLE', NULL, NULL, 0, FALSE, TRUE, FALSE, NULL)
ON DUPLICATE KEY UPDATE
    floor_id = VALUES(floor_id),
    room_type_id = VALUES(room_type_id),
    capacity = VALUES(capacity),
    base_status = VALUES(base_status),
    lead_time_days = VALUES(lead_time_days),
    requires_approval = VALUES(requires_approval),
    allow_overlap_booking = VALUES(allow_overlap_booking),
    fee_enabled = VALUES(fee_enabled),
    fee_per_hour = VALUES(fee_per_hour);

-- =====================================================================
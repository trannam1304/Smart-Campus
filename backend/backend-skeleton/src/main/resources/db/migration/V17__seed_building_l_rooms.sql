-- Flyway migration: V17__seed_building_l_rooms.sql
-- Đồng bộ toàn bộ dữ liệu Tòa L và các phòng L.001 - L.506 khớp với Bản vẽ kiến trúc Frontend

-- 1. Đổi tên hoặc thêm tòa nhà Thư viện Tòa L
UPDATE buildings SET building_name = 'Thư viện Tòa L' WHERE building_id = 1;
INSERT INTO buildings (building_name) VALUES ('Thư viện Tòa L')
ON DUPLICATE KEY UPDATE building_name = VALUES(building_name);

SET @b_id = (SELECT building_id FROM buildings WHERE building_name = 'Thư viện Tòa L' LIMIT 1);

-- 2. Đảm bảo đầy đủ các tầng từ Tầng G (0) đến Tầng 5 cho Tòa L
INSERT INTO floors (building_id, floor_number, floor_map_svg_url, open_time, close_time) VALUES
(@b_id, 0, '/assets/floors/image3.png', '07:30:00', '20:00:00'),
(@b_id, 1, '/assets/floors/image4.png', '07:30:00', '20:00:00'),
(@b_id, 2, '/assets/floors/image5.png', '07:30:00', '20:00:00'),
(@b_id, 3, '/assets/floors/image6.png', '07:30:00', '17:00:00'),
(@b_id, 4, '/assets/floors/image7.png', '07:30:00', '17:00:00'),
(@b_id, 5, '/assets/floors/image8.png', '07:30:00', '17:00:00')
ON DUPLICATE KEY UPDATE
    floor_map_svg_url = VALUES(floor_map_svg_url),
    open_time = VALUES(open_time),
    close_time = VALUES(close_time);

-- 3. Xoá các phòng mẫu khảo sát cũ không thuộc Tòa L để tránh xung đột mã phòng
DELETE FROM equipment WHERE room_id IN (SELECT room_id FROM rooms WHERE room_code NOT LIKE 'L.%');
DELETE FROM rooms WHERE room_code NOT LIKE 'L.%';

-- 4. Lấy ID các tầng và ID các loại phòng
SET @floor_0 = (SELECT floor_id FROM floors WHERE building_id = @b_id AND floor_number = 0 LIMIT 1);
SET @floor_1 = (SELECT floor_id FROM floors WHERE building_id = @b_id AND floor_number = 1 LIMIT 1);
SET @floor_2 = (SELECT floor_id FROM floors WHERE building_id = @b_id AND floor_number = 2 LIMIT 1);
SET @floor_3 = (SELECT floor_id FROM floors WHERE building_id = @b_id AND floor_number = 3 LIMIT 1);
SET @floor_4 = (SELECT floor_id FROM floors WHERE building_id = @b_id AND floor_number = 4 LIMIT 1);
SET @floor_5 = (SELECT floor_id FROM floors WHERE building_id = @b_id AND floor_number = 5 LIMIT 1);

SET @rt_group        = (SELECT room_type_id FROM room_types WHERE type_code = 'GROUP');
SET @rt_individual   = (SELECT room_type_id FROM room_types WHERE type_code = 'INDIVIDUAL');
SET @rt_presentation = (SELECT room_type_id FROM room_types WHERE type_code = 'PRESENTATION');
SET @rt_video_room   = (SELECT room_type_id FROM room_types WHERE type_code = 'VIDEO_ROOM');
SET @rt_conference   = (SELECT room_type_id FROM room_types WHERE type_code = 'CONFERENCE');

-- 5. Nạp danh sách 33 phòng chuẩn Tòa L (L.001 -> L.506)
INSERT INTO rooms (floor_id, room_type_id, room_code, capacity, base_status) VALUES
-- Tầng G (G - Floor)
(@floor_0, @rt_group,        'L.001', 5,  'AVAILABLE'),
(@floor_0, @rt_group,        'L.002', 5,  'AVAILABLE'),
(@floor_0, @rt_presentation, 'L.003', 9,  'AVAILABLE'),
(@floor_0, @rt_video_room,   'L.004', 5,  'AVAILABLE'),
(@floor_0, @rt_presentation, 'L.005', 6,  'AVAILABLE'),

-- Tầng 1 (1st - Floor)
(@floor_1, @rt_group,        'L.101', 5,  'AVAILABLE'),
(@floor_1, @rt_group,        'L.102', 5,  'AVAILABLE'),
(@floor_1, @rt_group,        'L.103', 8,  'AVAILABLE'),
(@floor_1, @rt_presentation, 'L.104', 8,  'AVAILABLE'),
(@floor_1, @rt_presentation, 'L.105', 8,  'AVAILABLE'),
(@floor_1, @rt_conference,   'L.106', 20, 'AVAILABLE'),

-- Tầng 2 (2nd - Floor)
(@floor_2, @rt_group,        'L.201', 6,  'AVAILABLE'),
(@floor_2, @rt_group,        'L.202', 8,  'AVAILABLE'),
(@floor_2, @rt_video_room,   'L.203', 10, 'AVAILABLE'),
(@floor_2, @rt_presentation, 'L.204', 9,  'AVAILABLE'),

-- Tầng 3 (3rd - Floor)
(@floor_3, @rt_individual,   'L.301', 1,  'AVAILABLE'),
(@floor_3, @rt_individual,   'L.302', 1,  'AVAILABLE'),
(@floor_3, @rt_individual,   'L.303', 1,  'AVAILABLE'),
(@floor_3, @rt_video_room,   'L.304', 6,  'AVAILABLE'),
(@floor_3, @rt_presentation, 'L.305', 8,  'AVAILABLE'),
(@floor_3, @rt_group,        'L.306', 8,  'AVAILABLE'),

-- Tầng 4 (4th - Floor)
(@floor_4, @rt_individual,   'L.401', 1,  'AVAILABLE'),
(@floor_4, @rt_individual,   'L.402', 1,  'AVAILABLE'),
(@floor_4, @rt_individual,   'L.403', 1,  'AVAILABLE'),
(@floor_4, @rt_presentation, 'L.404', 8,  'AVAILABLE'),
(@floor_4, @rt_video_room,   'L.405', 8,  'AVAILABLE'),
(@floor_4, @rt_presentation, 'L.406', 10, 'AVAILABLE'),

-- Tầng 5 (5th - Floor)
(@floor_5, @rt_group,        'L.501', 6,  'AVAILABLE'),
(@floor_5, @rt_group,        'L.502', 8,  'AVAILABLE'),
(@floor_5, @rt_video_room,   'L.503', 10, 'AVAILABLE'),
(@floor_5, @rt_presentation, 'L.504', 8,  'AVAILABLE'),
(@floor_5, @rt_presentation, 'L.505', 8,  'AVAILABLE'),
(@floor_5, @rt_conference,   'L.506', 20, 'AVAILABLE')
ON DUPLICATE KEY UPDATE
    floor_id = VALUES(floor_id),
    room_type_id = VALUES(room_type_id),
    capacity = VALUES(capacity),
    base_status = VALUES(base_status);

-- 6. Nạp thiết bị chuẩn cho các phòng Tòa L
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony Full HD', 'PROJECTOR', 'GOOD' FROM rooms r
JOIN room_types rt ON rt.room_type_id = r.room_type_id WHERE rt.type_code IN ('GROUP', 'PRESENTATION')
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Máy chiếu Sony Full HD');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AIRCON', 'GOOD' FROM rooms r
WHERE NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Điều hòa Daikin');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng viết bút lông', 'WHITEBOARD', 'GOOD' FROM rooms r
JOIN room_types rt ON rt.room_type_id = r.room_type_id WHERE rt.type_code IN ('GROUP', 'PRESENTATION', 'CONFERENCE')
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Bảng viết bút lông');


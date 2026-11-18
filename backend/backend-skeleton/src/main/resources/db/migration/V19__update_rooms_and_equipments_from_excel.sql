-- Flyway migration: V19__update_rooms_and_equipments_from_excel.sql
-- Cập nhật toàn bộ loại phòng, sức chứa và thiết bị theo cấu trúc bảng Excel

-- 1. Lấy ID các loại phòng
SET @rt_group        = (SELECT room_type_id FROM room_types WHERE type_code = 'GROUP' LIMIT 1);
SET @rt_individual   = (SELECT room_type_id FROM room_types WHERE type_code = 'INDIVIDUAL' LIMIT 1);
SET @rt_presentation = (SELECT room_type_id FROM room_types WHERE type_code = 'PRESENTATION' LIMIT 1);
SET @rt_video_room   = (SELECT room_type_id FROM room_types WHERE type_code = 'VIDEO_ROOM' LIMIT 1);
SET @rt_conference   = (SELECT room_type_id FROM room_types WHERE type_code = 'CONFERENCE' LIMIT 1);

-- 2. Cập nhật loại phòng và sức chứa cho 33 phòng Tòa L
-- Tầng G (G - Floor)
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.001';
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.002';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 9 WHERE room_code = 'L.003';
UPDATE rooms SET room_type_id = @rt_video_room, capacity = 8 WHERE room_code = 'L.004';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 9 WHERE room_code = 'L.005';

-- Tầng 1 (1st - Floor)
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.101';
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.102';
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.103';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 7 WHERE room_code = 'L.104';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 7 WHERE room_code = 'L.105';
UPDATE rooms SET room_type_id = @rt_conference, capacity = 20 WHERE room_code = 'L.106';

-- Tầng 2 (2nd - Floor)
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.201';
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.202';
UPDATE rooms SET room_type_id = @rt_video_room, capacity = 10 WHERE room_code = 'L.203';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 10 WHERE room_code = 'L.204';

-- Tầng 3 (3rd - Floor)
UPDATE rooms SET room_type_id = @rt_individual, capacity = 4 WHERE room_code = 'L.301';
UPDATE rooms SET room_type_id = @rt_individual, capacity = 4 WHERE room_code = 'L.302';
UPDATE rooms SET room_type_id = @rt_individual, capacity = 4 WHERE room_code = 'L.303';
UPDATE rooms SET room_type_id = @rt_video_room, capacity = 8 WHERE room_code = 'L.304';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 9 WHERE room_code = 'L.305';
UPDATE rooms SET room_type_id = @rt_group, capacity = 6 WHERE room_code = 'L.306';

-- Tầng 4 (4th - Floor)
UPDATE rooms SET room_type_id = @rt_individual, capacity = 4 WHERE room_code = 'L.401';
UPDATE rooms SET room_type_id = @rt_individual, capacity = 4 WHERE room_code = 'L.402';
UPDATE rooms SET room_type_id = @rt_individual, capacity = 4 WHERE room_code = 'L.403';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 9 WHERE room_code = 'L.404';
UPDATE rooms SET room_type_id = @rt_video_room, capacity = 8 WHERE room_code = 'L.405';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 9 WHERE room_code = 'L.406';

-- Tầng 5 (5th - Floor)
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.501';
UPDATE rooms SET room_type_id = @rt_group, capacity = 5 WHERE room_code = 'L.502';
UPDATE rooms SET room_type_id = @rt_video_room, capacity = 8 WHERE room_code = 'L.503';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 7 WHERE room_code = 'L.504';
UPDATE rooms SET room_type_id = @rt_presentation, capacity = 7 WHERE room_code = 'L.505';
UPDATE rooms SET room_type_id = @rt_conference, capacity = 20 WHERE room_code = 'L.506';

-- 3. Xoá thiết bị cũ của Tòa L (trừ những thiết bị đang liên kết với báo cáo sự cố)
DELETE FROM equipment
WHERE room_id IN (SELECT room_id FROM rooms WHERE room_code LIKE 'L.%')
  AND equipment_id NOT IN (SELECT equipment_id FROM incident_reports WHERE equipment_id IS NOT NULL);

-- 4. Thêm thiết bị chuẩn theo bảng Excel cho từng phòng

-- 4.1 Nhóm "Bàn, ghế, bảng kính" (L.001, L.002, L.101, L.102, L.103, L.201, L.202, L.306, L.501, L.502)
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn ghế học tập', 'OTHER', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.001', 'L.002', 'L.101', 'L.102', 'L.103', 'L.201', 'L.202', 'L.306', 'L.501', 'L.502');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng kính', 'WHITEBOARD', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.001', 'L.002', 'L.101', 'L.102', 'L.103', 'L.201', 'L.202', 'L.306', 'L.501', 'L.502');

-- 4.2 Nhóm "Bàn, ghế" (L.003, L.005, L.104, L.105, L.204, L.301, L.302, L.303, L.305, L.401, L.402, L.403, L.404, L.406, L.504, L.505)
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn ghế học tập', 'OTHER', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.003', 'L.005', 'L.104', 'L.105', 'L.204', 'L.301', 'L.302', 'L.303', 'L.305', 'L.401', 'L.402', 'L.403', 'L.404', 'L.406', 'L.504', 'L.505');

-- 4.3 Nhóm "Bàn, ghế, Smart Tivi, ghế sofa" (L.004, L.203, L.304, L.405, L.503)
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn ghế học tập', 'OTHER', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.004', 'L.203', 'L.304', 'L.405', 'L.503');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ghế sofa', 'OTHER', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.004', 'L.203', 'L.304', 'L.405', 'L.503');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Smart Tivi', 'TV', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.004', 'L.203', 'L.304', 'L.405', 'L.503');

-- 4.4 Nhóm "Bàn, ghế, Smart Tivi, máy chiếu" (L.106, L.506)
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn ghế học tập', 'OTHER', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.106', 'L.506');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Smart Tivi', 'TV', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.106', 'L.506');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu', 'PROJECTOR', 'GOOD' FROM rooms r 
WHERE r.room_code IN ('L.106', 'L.506');

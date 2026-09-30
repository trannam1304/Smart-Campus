-- Flyway migration: V10__seed_equipment.sql
-- Source: SQL_migration1(1).sql

-- 6.5 THIẾT BỊ MẪU (EQUIPMENT) - dữ liệu minh họa cho FR-4.1/FR-4.3
-- Ghi chú: bảng equipment trong ERD không có UNIQUE nghiệp vụ (chỉ có equipment_id PK),
-- nên không dùng được ON DUPLICATE KEY UPDATE. Khối này dùng INSERT ... WHERE NOT EXISTS
-- để chạy lại nhiều lần vẫn an toàn (không tạo thiết bị trùng cho cùng 1 phòng).
-- =====================================================================

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony Full HD', 'PROJECTOR', 'GOOD' FROM rooms r
WHERE r.room_code = 'N2.01'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Máy chiếu Sony Full HD');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AIRCON', 'GOOD' FROM rooms r
WHERE r.room_code = 'N2.01'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Điều hòa Daikin');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony Full HD', 'PROJECTOR', 'GOOD' FROM rooms r
WHERE r.room_code = 'N2.02'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Máy chiếu Sony Full HD');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AIRCON', 'GOOD' FROM rooms r
WHERE r.room_code = 'N2.02'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Điều hòa Daikin');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Epson Laser', 'PROJECTOR', 'GOOD' FROM rooms r
WHERE r.room_code = 'P5.04'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Máy chiếu Epson Laser');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Hệ thống âm thanh hội trường', 'SOUND_SYSTEM', 'GOOD' FROM rooms r
WHERE r.room_code = 'P5.04'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Hệ thống âm thanh hội trường');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình họp trực tuyến', 'DISPLAY', 'GOOD' FROM rooms r
WHERE r.room_code = 'H5.01'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Màn hình họp trực tuyến');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Camera hội nghị', 'CAMERA', 'GOOD' FROM rooms r
WHERE r.room_code = 'H5.01'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Camera hội nghị');

INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Micro thu âm', 'MICROPHONE', 'GOOD' FROM rooms r
WHERE r.room_code = 'S5.01'
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.room_id = r.room_id AND e.equipment_name = 'Micro thu âm');

-- =====================================================================

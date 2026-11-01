-- Flyway migration: V8__seed_buildings_and_floors.sql
-- Source: SQL_migration1(1).sql

-- 6.3 TÒA NHÀ & TẦNG (BUILDINGS & FLOORS)
-- Nguồn: Khao_sat_quy_che_muon_phong_tu_hoc_TDTU (Mục 2.1, 3.3, 3.4, Phụ lục B)
-- Phạm vi khảo sát là Thư viện TDTU cơ sở TP.HCM, Tòa nhà G.
-- =====================================================================

INSERT INTO buildings (building_name) VALUES
('Thư viện TDTU - Tòa nhà G')
ON DUPLICATE KEY UPDATE building_name = VALUES(building_name);

SET @building_g_id = (SELECT building_id FROM buildings WHERE building_name = 'Thư viện TDTU - Tòa nhà G' LIMIT 1);

-- Giờ mở cửa theo tầng (P-OPEN-F12 / P-OPEN-F345): Lầu 1-2: 07:30-20:00, Lầu 3-5: 07:30-17:00
-- Hầm lửng B1 (floor_number = -1): khu tự học qua đêm, mở từ 19:30 (night.open_time).
-- Lưu ý: phiên học đêm kéo dài qua nửa đêm nên close_time chỉ là mốc tham chiếu trong
-- ngày; ứng dụng cần tự xử lý logic "qua đêm" (không đối chiếu end_time như phòng thường).
INSERT INTO floors (building_id, floor_number, floor_map_svg_url, open_time, close_time) VALUES
(@building_g_id, -1, NULL,                                            '19:30:00', '23:59:59'),
(@building_g_id,  1, NULL,                                            '07:30:00', '20:00:00'),
(@building_g_id,  2, 'https://cdn.smartcampus.edu.vn/maps/floor-g2.svg', '07:30:00', '20:00:00'),
(@building_g_id,  3, 'https://cdn.smartcampus.edu.vn/maps/floor-g3.svg', '07:30:00', '17:00:00'),
(@building_g_id,  4, 'https://cdn.smartcampus.edu.vn/maps/floor-g4.svg', '07:30:00', '17:00:00'),
(@building_g_id,  5, 'https://cdn.smartcampus.edu.vn/maps/floor-g5.svg', '07:30:00', '17:00:00')
ON DUPLICATE KEY UPDATE
    floor_map_svg_url = VALUES(floor_map_svg_url),
    open_time = VALUES(open_time),
    close_time = VALUES(close_time);

SET @floor_b1 = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = -1);
SET @floor_1  = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 1);
SET @floor_2  = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 2);
SET @floor_3  = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 3);
SET @floor_4  = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 4);
SET @floor_5  = (SELECT floor_id FROM floors WHERE building_id = @building_g_id AND floor_number = 5);

-- =====================================================================

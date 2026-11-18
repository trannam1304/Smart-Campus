-- Flyway migration: V18__seed_mockup_equipments_for_building_l.sql
-- Cập nhật danh sách trang thiết bị chuẩn xác cho từng phòng Tòa L theo Mockup

-- 1. Xóa các thiết bị cũ của Tòa L (chỉ xóa những thiết bị không bị ràng buộc bởi báo cáo sự cố)
DELETE FROM equipment
WHERE room_id IN (SELECT room_id FROM rooms WHERE room_code LIKE 'L.%')
  AND equipment_id NOT IN (SELECT equipment_id FROM incident_reports WHERE equipment_id IS NOT NULL);

-- 2. Tầng G (G - Floor)
-- L.001: Ổ cắm điện âm sàn, Điều hòa Daikin, Bàn đọc nhóm
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện âm sàn', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.001';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.001';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn đọc nhóm', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code = 'L.001';

-- L.002: Màn hình tra cứu 43 inch, Ổ cắm điện, Bảng từ trắng
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình tra cứu 43 inch', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.002';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.002';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.002';

-- L.003: Máy chiếu Sony Full HD, Bảng từ trắng, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony Full HD', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.003';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.003';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.003';

-- L.004: Màn hình chiếu Video, Loa hội thảo, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình chiếu Video', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.004';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa hội thảo', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.004';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.004';

-- L.005: Màn hình hiển thị, Máy chiếu HDMI, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình hiển thị', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.005';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu HDMI', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.005';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.005';

-- 3. Tầng 1 (1st - Floor)
-- L.101: Máy chiếu HDMI, Bảng viết bút lông, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu HDMI', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.101';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng viết bút lông', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.101';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.101';

-- L.102: Smart TV 65 inch, Ổ cắm điện, Bảng từ trắng
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Smart TV 65 inch', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.102';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.102';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.102';

-- L.103: Máy chiếu HDMI, Bảng từ trắng, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu HDMI', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.103';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.103';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.103';

-- L.104: Máy chiếu Sony Full HD, Bảng từ trắng, Loa thuyết trình
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony Full HD', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.104';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.104';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa thuyết trình', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.104';

-- L.105: Loa thuyết trình, Máy chiếu Epson Laser, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa thuyết trình', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.105';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Epson Laser', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.105';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.105';

-- L.106: Màn chiếu lớn, Hệ thống âm thanh hội trường, Camera hội nghị, Bảng viết bút lông
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn chiếu lớn', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.106';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Hệ thống âm thanh hội trường', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.106';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Camera hội nghị', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code = 'L.106';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng viết bút lông', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.106';

-- 4. Tầng 2 (2nd - Floor)
-- L.201: Màn hình chiếu Video, Loa chuyên dụng, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình chiếu Video', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.201';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa chuyên dụng', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.201';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.201';

-- L.202: Màn hình hiển thị, Đầu đọc đĩa CD/DVD, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình hiển thị', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.202';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Đầu đọc đĩa CD/DVD', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code = 'L.202';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.202';

-- L.203: Bảng học nhóm, Ổ cắm điện, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng học nhóm', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.203';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.203';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.203';

-- L.204: Máy chiếu HDMI, Bảng từ trắng, Loa thuyết trình
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu HDMI', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.204';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.204';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa thuyết trình', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.204';

-- 5. Tầng 3 (3rd - Floor)
-- L.301, L.302, L.303: Bàn đọc cá nhân, Ổ cắm điện, Đèn đọc sách
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn đọc cá nhân', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code IN ('L.301', 'L.302', 'L.303');
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code IN ('L.301', 'L.302', 'L.303');
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Đèn đọc sách', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code IN ('L.301', 'L.302', 'L.303');

-- L.304: Máy chiếu Sony, Màn hình chiếu Video, Loa hội thảo
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.304';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình chiếu Video', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.304';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa hội thảo', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.304';

-- L.305: Smart TV 65 inch, Máy chiếu HDMI, Bảng từ
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Smart TV 65 inch', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.305';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu HDMI', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.305';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.305';

-- L.306: Bảng từ trắng, Ổ cắm điện, Máy chiếu
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.306';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.306';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.306';

-- 6. Tầng 4 (4th - Floor)
-- L.401, L.402, L.403: Bàn đọc cá nhân, Ổ cắm điện, Đèn đọc sách
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bàn đọc cá nhân', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code IN ('L.401', 'L.402', 'L.403');
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code IN ('L.401', 'L.402', 'L.403');
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Đèn đọc sách', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code IN ('L.401', 'L.402', 'L.403');

-- L.404: Máy chiếu 4K, Hệ thống âm thanh, Bảng từ
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu 4K', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.404';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Hệ thống âm thanh', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.404';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.404';

-- L.405: Màn hình chiếu Video, Loa hội thảo, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình chiếu Video', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.405';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa hội thảo', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.405';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.405';

-- L.406: Hệ thống âm thanh, Máy chiếu Epson Laser, Bảng từ thuyết trình
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Hệ thống âm thanh', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.406';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Epson Laser', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.406';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ thuyết trình', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.406';

-- 7. Tầng 5 (5th - Floor)
-- L.501: Bảng học nhóm, Ổ cắm điện, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng học nhóm', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.501';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.501';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.501';

-- L.502: Máy chiếu wifi, Bảng viết bút lông, Ổ cắm điện
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu wifi', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.502';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng viết bút lông', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.502';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Ổ cắm điện', 'SOCKET', 'GOOD' FROM rooms r WHERE r.room_code = 'L.502';

-- L.503: Smart TV 75 inch, Hệ thống loa vòm, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Smart TV 75 inch', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.503';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Hệ thống loa vòm', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.503';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.503';

-- L.504: Bảng tương tác thông minh, Máy chiếu 4K, Loa thuyết trình
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng tương tác thông minh', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.504';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu 4K', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.504';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa thuyết trình', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.504';

-- L.505: Máy chiếu Sony Full HD, Bảng từ trắng, Điều hòa Daikin
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Máy chiếu Sony Full HD', 'PROJECTOR', 'GOOD' FROM rooms r WHERE r.room_code = 'L.505';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng từ trắng', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.505';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Điều hòa Daikin', 'AC', 'GOOD' FROM rooms r WHERE r.room_code = 'L.505';

-- L.506: Màn hình họp trực tuyến 85 inch, Loa hội trường, Micro thu âm, Camera hội nghị, Bảng viết bút lông
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Màn hình họp trực tuyến 85 inch', 'TV', 'GOOD' FROM rooms r WHERE r.room_code = 'L.506';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Loa hội trường', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.506';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Micro thu âm', 'AUDIO', 'GOOD' FROM rooms r WHERE r.room_code = 'L.506';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Camera hội nghị', 'OTHER', 'GOOD' FROM rooms r WHERE r.room_code = 'L.506';
INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
SELECT r.room_id, 'Bảng viết bút lông', 'WHITEBOARD', 'GOOD' FROM rooms r WHERE r.room_code = 'L.506';

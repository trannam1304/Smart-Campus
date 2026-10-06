import { Room, Booking, FloorData } from '../../types/booking';

export const mockExactRooms: Room[] = [
  // G - Floor
  { id: 'r-g01', roomCode: 'L.001', roomType: 'Phòng tự học', building: 'Tòa L', floor: 0, floorCode: 'G - Floor', capacity: 4, status: 'AVAILABLE', devices: [{ id: 'd1', name: 'Bàn đọc nhóm', status: 'GOOD' }, { id: 'd2', name: 'Ổ cắm điện', status: 'GOOD' }] },
  { id: 'r-g02', roomCode: 'L.002', roomType: 'Phòng tự học', building: 'Tòa L', floor: 0, floorCode: 'G - Floor', capacity: 4, status: 'AVAILABLE', devices: [{ id: 'd3', name: 'Màn hình tra cứu', status: 'GOOD' }] },
  { id: 'r-g03', roomCode: 'L.003', roomType: 'Phòng tự học', building: 'Tòa L', floor: 0, floorCode: 'G - Floor', capacity: 6, status: 'AVAILABLE', devices: [{ id: 'd4', name: 'Bảng từ trắng', status: 'GOOD' }] },
  { id: 'r-g04', roomCode: 'L.004', roomType: 'Phòng tự học', building: 'Tòa L', floor: 0, floorCode: 'G - Floor', capacity: 6, status: 'AVAILABLE', devices: [{ id: 'd5', name: 'Điều hòa', status: 'GOOD' }] },
  { id: 'r-g05', roomCode: 'L.005', roomType: 'Phòng tự học', building: 'Tòa L', floor: 0, floorCode: 'G - Floor', capacity: 8, status: 'AVAILABLE', devices: [{ id: 'd6', name: 'Màn hình hiển thị', status: 'GOOD' }] },

  // 1st - Floor
  { id: 'r-101', roomCode: 'L.101', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', capacity: 8, status: 'AVAILABLE', devices: [{ id: 'd7', name: 'Máy chiếu HDMI', status: 'GOOD' }] },
  { id: 'r-102', roomCode: 'L.102', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', capacity: 8, status: 'AVAILABLE', devices: [{ id: 'd8', name: 'Smart TV 65 inch', status: 'GOOD' }] },
  { id: 'r-103', roomCode: 'L.103', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', capacity: 10, status: 'MAINTENANCE', devices: [{ id: 'd9', name: 'Máy chiếu', status: 'BROKEN' }] },
  { id: 'r-104', roomCode: 'L.104', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', capacity: 10, status: 'AVAILABLE', devices: [{ id: 'd10', name: 'Bảng từ trắng', status: 'GOOD' }] },
  { id: 'r-105', roomCode: 'L.105', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', capacity: 12, status: 'AVAILABLE', devices: [{ id: 'd11', name: 'Loa thuyết trình', status: 'GOOD' }] },
  { id: 'r-106', roomCode: 'L.106', roomType: 'Phòng hội nghị', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', capacity: 25, status: 'AVAILABLE', devices: [{ id: 'd12', name: 'Màn chiếu lớn', status: 'GOOD' }] },

  // 2nd - Floor
  { id: 'r-201', roomCode: 'L.201', roomType: 'Phòng Video', building: 'Tòa L', floor: 2, floorCode: '2nd - Floor', capacity: 6, status: 'AVAILABLE', devices: [{ id: 'd13', name: 'Màn hình chiếu Video', status: 'GOOD' }] },
  { id: 'r-202', roomCode: 'L.202', roomType: 'Phòng Video', building: 'Tòa L', floor: 2, floorCode: '2nd - Floor', capacity: 6, status: 'AVAILABLE', devices: [{ id: 'd14', name: 'Đầu đọc đĩa CD/DVD', status: 'GOOD' }] },
  { id: 'r-203', roomCode: 'L.203', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 2, floorCode: '2nd - Floor', capacity: 10, status: 'AVAILABLE', devices: [{ id: 'd15', name: 'Bảng học nhóm', status: 'GOOD' }] },
  { id: 'r-204', roomCode: 'L.204', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 2, floorCode: '2nd - Floor', capacity: 12, status: 'AVAILABLE', devices: [{ id: 'd16', name: 'Máy chiếu HDMI', status: 'GOOD' }] },

  // 3rd - Floor
  { id: 'r-301', roomCode: 'L.301', roomType: 'Phòng tự học', building: 'Tòa L', floor: 3, floorCode: '3rd - Floor', capacity: 4, status: 'AVAILABLE', devices: [{ id: 'd17', name: 'Bàn đọc cá nhân', status: 'GOOD' }] },
  { id: 'r-302', roomCode: 'L.302', roomType: 'Phòng tự học', building: 'Tòa L', floor: 3, floorCode: '3rd - Floor', capacity: 4, status: 'AVAILABLE', devices: [{ id: 'd18', name: 'Ổ cắm điện', status: 'GOOD' }] },
  { id: 'r-303', roomCode: 'L.303', roomType: 'Phòng tự học', building: 'Tòa L', floor: 3, floorCode: '3rd - Floor', capacity: 4, status: 'AVAILABLE', devices: [{ id: 'd19', name: 'Đèn đọc sách', status: 'GOOD' }] },
  { id: 'r-304', roomCode: 'L.304', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 3, floorCode: '3rd - Floor', capacity: 10, status: 'AVAILABLE', devices: [{ id: 'd20', name: 'Máy chiếu', status: 'GOOD' }] },
  { id: 'r-305', roomCode: 'L.305', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 3, floorCode: '3rd - Floor', capacity: 12, status: 'AVAILABLE', devices: [{ id: 'd21', name: 'Smart TV', status: 'GOOD' }] },
  { id: 'r-306', roomCode: 'L.306', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 3, floorCode: '3rd - Floor', capacity: 14, status: 'AVAILABLE', devices: [{ id: 'd22', name: 'Bảng từ', status: 'GOOD' }] },

  // 4th - Floor
  { id: 'r-401', roomCode: 'L.401', roomType: 'Phòng video', building: 'Tòa L', floor: 4, floorCode: '4th - Floor', capacity: 6, status: 'AVAILABLE', devices: [{ id: 'd23', name: 'Màn hình chiếu Video', status: 'GOOD' }] },
  { id: 'r-402', roomCode: 'L.402', roomType: 'Phòng video', building: 'Tòa L', floor: 4, floorCode: '4th - Floor', capacity: 6, status: 'AVAILABLE', devices: [{ id: 'd24', name: 'Loa hội thảo', status: 'GOOD' }] },
  { id: 'r-403', roomCode: 'L.403', roomType: 'Phòng video', building: 'Tòa L', floor: 4, floorCode: '4th - Floor', capacity: 8, status: 'AVAILABLE', devices: [{ id: 'd25', name: 'Màn hình tra cứu', status: 'GOOD' }] },
  { id: 'r-404', roomCode: 'L.404', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 4, floorCode: '4th - Floor', capacity: 10, status: 'AVAILABLE', devices: [{ id: 'd26', name: 'Máy chiếu 4K', status: 'GOOD' }] },
  { id: 'r-405', roomCode: 'L.405', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 4, floorCode: '4th - Floor', capacity: 12, status: 'AVAILABLE', devices: [{ id: 'd27', name: 'Bảng từ thuyết trình', status: 'GOOD' }] },
  { id: 'r-406', roomCode: 'L.406', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 4, floorCode: '4th - Floor', capacity: 15, status: 'AVAILABLE', devices: [{ id: 'd28', name: 'Hệ thống âm thanh', status: 'GOOD' }] },

  // 5th - Floor
  { id: 'r-501', roomCode: 'L.501', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 5, floorCode: '5th - Floor', capacity: 8, status: 'AVAILABLE', devices: [{ id: 'd29', name: 'Bảng học nhóm', status: 'GOOD' }] },
  { id: 'r-502', roomCode: 'L.502', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 5, floorCode: '5th - Floor', capacity: 8, status: 'AVAILABLE', devices: [{ id: 'd30', name: 'Máy chiếu wifi', status: 'GOOD' }] },
  { id: 'r-503', roomCode: 'L.503', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 5, floorCode: '5th - Floor', capacity: 10, status: 'AVAILABLE', devices: [{ id: 'd31', name: 'Smart TV', status: 'GOOD' }] },
  { id: 'r-504', roomCode: 'L.504', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 5, floorCode: '5th - Floor', capacity: 10, status: 'AVAILABLE', devices: [{ id: 'd32', name: 'Bảng tương tác', status: 'GOOD' }] },
  { id: 'r-505', roomCode: 'L.505', roomType: 'Phòng học nhóm', building: 'Tòa L', floor: 5, floorCode: '5th - Floor', capacity: 12, status: 'AVAILABLE', devices: [{ id: 'd33', name: 'Máy chiếu', status: 'GOOD' }] },
  { id: 'r-506', roomCode: 'L.506', roomType: 'Phòng hội nghị', building: 'Tòa L', floor: 5, floorCode: '5th - Floor', capacity: 30, status: 'AVAILABLE', devices: [{ id: 'd34', name: 'Hội nghị lớn', status: 'GOOD' }] },
];

export const mockInitialFloors: FloorData[] = [
  { floorNumber: 0, floorCode: 'G - Floor', description: 'Tầng G Sảnh Đọc & Phòng tự học L.001 - L.005', mapImage: '/assets/floors/image3.png', otherZones: ['Khu Báo thường thức', 'Quầy tiếp tân', 'Thang máy', 'Thang bộ', 'WC'], totalRooms: 5, availableRooms: 5, rooms: mockExactRooms.filter(r => r.floor === 0) },
  { floorNumber: 1, floorCode: '1st - Floor', description: 'Tầng 1 Phòng thuyết trình L.101 - L.105 & Phòng hội nghị L.106', mapImage: '/assets/floors/image4.png', otherZones: ['Khu tài liệu tham khảo, tạp chí khoa học', 'Thang máy', 'Thang bộ', 'WC'], totalRooms: 6, availableRooms: 6, rooms: mockExactRooms.filter(r => r.floor === 1) },
  { floorNumber: 2, floorCode: '2nd - Floor', description: 'Tầng 2 Phòng Video L.201 - L.202 & Phòng học nhóm L.203 - L.204', mapImage: '/assets/floors/image5.png', otherZones: ['Khu tài liệu học ngôn ngữ', 'Đĩa CD/ DVD', 'Thang máy', 'Thang bộ', 'WC'], totalRooms: 4, availableRooms: 4, rooms: mockExactRooms.filter(r => r.floor === 2) },
  { floorNumber: 3, floorCode: '3rd - Floor', description: 'Tầng 3 Phòng tự học L.301 - L.303 & Phòng học nhóm L.304 - L.306', mapImage: '/assets/floors/image6.png', otherZones: ['Khu tài liệu tiếng Việt, Ngoại văn', 'Thang máy', 'Thang bộ', 'WC'], totalRooms: 6, availableRooms: 6, rooms: mockExactRooms.filter(r => r.floor === 3) },
  { floorNumber: 4, floorCode: '4th - Floor', description: 'Tầng 4 Phòng video L.401 - L.403 & Phòng thuyết trình L.404 - L.406', mapImage: '/assets/floors/image7.png', otherZones: ['Khu tài liệu môn học, khóa luận, đồ án, luận án', 'Thang máy', 'Thang bộ', 'WC'], totalRooms: 6, availableRooms: 6, rooms: mockExactRooms.filter(r => r.floor === 4) },
  { floorNumber: 5, floorCode: '5th - Floor', description: 'Tầng 5 Phòng học nhóm L.501 - L.505 & Phòng hội nghị L.506', mapImage: '/assets/floors/image8.png', otherZones: ['Khu vật liệu mẫu', 'Khu bản đồ', 'Thang máy', 'Thang bộ', 'WC'], totalRooms: 6, availableRooms: 6, rooms: mockExactRooms.filter(r => r.floor === 5) }
];

export const mockBookings: Booking[] = [
  { id: 'BK-8921', roomId: 'r-102', roomCode: 'L.102', roomType: 'Phòng thuyết trình', building: 'Tòa L', floor: 1, floorCode: '1st - Floor', studentId: 'u-student-01', studentName: 'La Thái Thành', studentCode: '52100888', date: '2026-10-03', startTime: '09:00', endTime: '11:00', numberOfPeople: 6, purpose: 'Học nhóm', qrCode: 'SMART-CAMPUS-BK-8921', status: 'CONFIRMED', createdAt: '2026-10-01T14:30:00Z' }
];

export const mockIncidents: any[] = [
  { id: 'INC-01', roomId: 'r-103', roomCode: 'L.103', deviceName: 'Máy chiếu HDMI', reporterName: 'Trần Thành Phát', reporterCode: '52100777', description: 'Máy chiếu chớp tắt không lên hình', status: 'OPEN', createdAt: '2026-09-25 10:15' }
];

export const mockRegistrations: any[] = [
  { id: 'REG-01', fullName: 'Đặng Văn Minh', email: '52100555@student.edu.vn', studentCode: '52100555', faculty: 'Khoa Điện - Điện Tử', createdAt: '2026-09-26 08:30', status: 'PENDING' },
  { id: 'REG-02', fullName: 'Nguyễn Hoàng Nam', email: '52100666@student.edu.vn', studentCode: '52100666', faculty: 'Khoa Kế Toán', createdAt: '2026-09-26 09:15', status: 'PENDING' }
];

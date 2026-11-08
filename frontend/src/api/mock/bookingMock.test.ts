import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore, getRelativeDate } from './mockStore';
import { mockCreateBooking, mockGetMyBookings } from './bookingMock';
import { mockApproveBooking } from './adminMock';
import { parseMemberQrCode } from '../../utils/qrCode';

// Polyfill for localStorage in test environment
const storageStore: Record<string, string> = {};
const localStoragePolyfill = {
  getItem: (key: string) => storageStore[key] || null,
  setItem: (key: string, value: string) => {
    storageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete storageStore[key];
  },
  clear: () => {
    Object.keys(storageStore).forEach((k) => delete storageStore[k]);
  },
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStoragePolyfill });
} else {
  Object.defineProperty(global, 'localStorage', { value: localStoragePolyfill });
}

describe('bookingMock - Member QR Codes and Group Bookings', () => {
  beforeEach(() => {
    localStoragePolyfill.clear();
    mockStore.reset();
  });

  it('1. mockCreateBooking cho 5 người sinh ra 5 mã khác nhau, chủ phòng đứng đầu', async () => {
    // Đăng nhập tài khoản sinh viên chủ phòng
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-student-test',
        fullName: 'La Thái Thành',
        studentCode: '52100888',
        role: 'STUDENT',
      })
    );

    const today = getRelativeDate(0);
    const room001 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.001')!;

    const memberCodes = ['52100666', '52100555', '52100777', '52100444'];
    const res = await mockCreateBooking({
      roomId: room001.id,
      bookingDate: today,
      startTime: '10:00',
      endTime: '12:00',
      occupancy: 5,
      purpose: 'Học nhóm 5 người',
      memberStudentCodes: memberCodes,
    });

    expect(res.success).toBe(true);
    expect(res.data!.bookingStatus).toBe('CONFIRMED');
    expect(res.data!.memberQrCodes).toHaveLength(5);

    // Chủ phòng đứng đầu danh sách mã
    expect(res.data!.memberQrCodes![0].studentCode).toBe('52100888');
    expect(res.data!.qrCodeData).toBe(res.data!.memberQrCodes![0].qrCodeData);

    // 5 người sinh ra 5 mã QR khác nhau
    const qrSet = new Set(res.data!.memberQrCodes!.map((m) => m.qrCodeData));
    expect(qrSet.size).toBe(5);

    // Mọi mã đều đúng định dạng mới SMART-CAMPUS-<bookingId>-<MSSV>
    res.data!.memberQrCodes!.forEach((m) => {
      const parsed = parseMemberQrCode(m.qrCodeData);
      expect(parsed).not.toBeNull();
      expect(parsed?.bookingId).toBe(res.data!.bookingId);
      expect(parsed?.studentCode).toBe(m.studentCode);
    });

    // Mock không trả ảnh base64 giả
    expect(res.data!.qrCodeImageBase64).toBe('');

    // Kiểm tra lưu trong mockStore
    const saved = mockStore.getState().bookings.find((b) => b.id === res.data!.bookingId);
    expect(saved).toBeDefined();
    expect(saved?.members).toHaveLength(5);
    expect(saved?.members![0].studentCode).toBe('52100888');
    expect(saved?.members![0].studentName).toBe('La Thái Thành');
  });

  it('2. Phòng cần duyệt (requiresApproval=true) thì mã QR của mọi thành viên là rỗng; mockApproveBooking sinh đủ mã', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-student-test',
        fullName: 'La Thái Thành',
        studentCode: '52100888',
        role: 'STUDENT',
      })
    );

    const tomorrow = getRelativeDate(1);
    const room106 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.106')!;
    expect(room106.requiresApproval).toBe(true);

    const res = await mockCreateBooking({
      roomId: room106.id,
      bookingDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      occupancy: 3,
      purpose: 'Hội thảo khoa học',
      memberStudentCodes: ['52100666', '52100555'],
    });

    expect(res.success).toBe(true);
    expect(res.data!.bookingStatus).toBe('PENDING_APPROVAL');
    expect(res.data!.qrCodeData).toBe('');
    expect(res.data!.memberQrCodes).toBeDefined();
    // Mã của mọi thành viên đều là rỗng
    res.data!.memberQrCodes!.forEach((m) => {
      expect(m.qrCodeData).toBe('');
    });

    // Duyệt đặt phòng bởi admin -> sinh đủ mã cho tất cả thành viên
    const approveRes = await mockApproveBooking(res.data!.bookingId);
    expect(approveRes.success).toBe(true);
    expect(approveRes.data!.status).toBe('CONFIRMED');

    const updated = mockStore.getState().bookings.find((b) => b.id === res.data!.bookingId)!;
    expect(updated.status).toBe('CONFIRMED');
    expect(updated.members).toHaveLength(3);

    updated.members!.forEach((m) => {
      expect(m.qrCode).not.toBe('');
      const parsed = parseMemberQrCode(m.qrCode);
      expect(parsed).not.toBeNull();
      expect(parsed?.bookingId).toBe(res.data!.bookingId);
      expect(parsed?.studentCode).toBe(m.studentCode);
    });
  });

  it('3. mockGetMyBookings: thành viên (không chỉ chủ phòng) cũng thấy lượt đặt của nhóm', async () => {
    // Tạo lượt đặt với chủ phòng là 52100888 và thành viên 52100666
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-student-01',
        fullName: 'La Thái Thành',
        studentCode: '52100888',
        role: 'STUDENT',
      })
    );

    const room001 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.001')!;
    const createRes = await mockCreateBooking({
      roomId: room001.id,
      bookingDate: getRelativeDate(0),
      startTime: '15:00',
      endTime: '17:00',
      occupancy: 2,
      purpose: 'Thảo luận nhóm',
      memberStudentCodes: ['52100666'],
    });

    // Đăng nhập với tư cách thành viên (52100666 - Nguyễn Hoàng Nam)
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-student-02',
        fullName: 'Nguyễn Hoàng Nam',
        studentCode: '52100666',
        role: 'STUDENT',
      })
    );

    const myBookingsRes = await mockGetMyBookings();
    expect(myBookingsRes.success).toBe(true);
    const found = myBookingsRes.data!.find((b) => b.id === createRes.data!.bookingId);
    expect(found).toBeDefined();
    expect(found?.studentCode).toBe('52100888'); // Chủ phòng là 52100888
    expect(found?.members?.some((m) => m.studentCode === '52100666')).toBe(true);
  });
});

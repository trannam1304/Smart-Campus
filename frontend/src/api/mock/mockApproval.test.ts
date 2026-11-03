import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore, getRoomStatusAt, getRelativeDate } from './mockStore';
import { mockCreateBooking } from './bookingMock';
import { mockApproveBooking, mockRejectBooking } from './adminMock';

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

describe('Conference Room Booking Approval Workflow (P-APPROVE-LAG)', () => {
  beforeEach(() => {
    localStoragePolyfill.clear();
    mockStore.reset();
  });

  it('1. Đặt phòng hội nghị (requiresApproval=true) tạo booking PENDING_APPROVAL, KHÔNG có QR, và vẫn chiếm khung giờ', async () => {
    const tomorrow = getRelativeDate(1);

    // L.106 is a conference room with requiresApproval = true
    const room106 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.106');
    expect(room106).toBeDefined();
    expect(room106?.requiresApproval).toBe(true);

    const bookingRes = await mockCreateBooking({
      roomId: room106!.id,
      bookingDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      occupancy: 20,
      purpose: 'Hội thảo khoa học công nghệ',
      memberStudentCodes: ['52100888', '52100666'],
    });

    expect(bookingRes.success).toBe(true);
    expect(bookingRes.data!.bookingStatus).toBe('PENDING_APPROVAL');
    // KHÔNG sinh mã QR khi đang chờ duyệt
    expect(bookingRes.data!.qrCodeData).toBe('');
    expect(bookingRes.data!.qrCodeImageBase64).toBe('');

    // Booking saved in mockStore
    const savedBooking = mockStore.getState().bookings.find((b) => b.id === bookingRes.data!.bookingId);
    expect(savedBooking).toBeDefined();
    expect(savedBooking?.status).toBe('PENDING_APPROVAL');
    expect(savedBooking?.qrCode).toBe('');

    // Khung giờ vẫn tính là chiếm chỗ (FR-3.2: getRoomStatusAt coi PENDING_APPROVAL là BOOKED)
    const statusAtTime = getRoomStatusAt(room106!, tomorrow, '14:30');
    expect(statusAtTime).toBe('BOOKED');
  });

  it('2. Duyệt đơn đặt phòng (Approve) -> chuyển sang CONFIRMED và sinh mã QR', async () => {
    const tomorrow = getRelativeDate(1);
    const room106 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.106')!;

    // Create a pending booking
    const bookingRes = await mockCreateBooking({
      roomId: room106.id,
      bookingDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      occupancy: 20,
      purpose: 'Hội thảo',
      memberStudentCodes: ['52100888'],
    });

    const bookingId = bookingRes.data!.bookingId;

    // Admin approves the booking
    const approveRes = await mockApproveBooking(bookingId);
    expect(approveRes.success).toBe(true);
    expect(approveRes.data!.status).toBe('CONFIRMED');
    // Sinh mã QR hợp lệ
    expect(approveRes.data!.qrCode).toContain(`SMART-CAMPUS-${bookingId}`);

    // Verify state in store
    const updated = mockStore.getState().bookings.find((b) => b.id === bookingId);
    expect(updated?.status).toBe('CONFIRMED');
    expect(updated?.qrCode).toContain(`SMART-CAMPUS-${bookingId}`);
    expect(updated?.qrCode).toBe(`SMART-CAMPUS-${bookingId}-${updated?.studentCode}`);

    // Khung giờ vẫn là BOOKED
    expect(getRoomStatusAt(room106, tomorrow, '15:00')).toBe('BOOKED');
  });

  it('3. Từ chối đơn đặt phòng (Reject) -> chuyển sang CANCELLED_ADMIN có lý do, và khung giờ được giải phóng', async () => {
    const tomorrow = getRelativeDate(1);
    const room506 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.506')!;
    expect(room506.requiresApproval).toBe(true);

    // Create a pending booking for L.506
    const bookingRes = await mockCreateBooking({
      roomId: room506.id,
      bookingDate: tomorrow,
      startTime: '08:00',
      endTime: '10:00',
      occupancy: 30,
      purpose: 'Sự kiện câu lạc bộ',
      memberStudentCodes: ['52100888'],
    });

    const bookingId = bookingRes.data!.bookingId;

    // While pending, the room is BOOKED
    expect(getRoomStatusAt(room506, tomorrow, '08:30')).toBe('BOOKED');

    // Admin rejects the booking with required reason
    const rejectReason = 'Trùng lịch họp toàn thể cán bộ giảng viên khoa CNTT';
    const rejectRes = await mockRejectBooking(bookingId, rejectReason);
    expect(rejectRes.success).toBe(true);
    expect(rejectRes.data!.status).toBe('CANCELLED_ADMIN');
    expect(rejectRes.data!.cancelReason).toBe(rejectReason);
    expect(rejectRes.data!.qrCode).toBe('');

    // Verify state in store
    const updated = mockStore.getState().bookings.find((b) => b.id === bookingId);
    expect(updated?.status).toBe('CANCELLED_ADMIN');
    expect(updated?.cancelReason).toBe(rejectReason);

    // Khung giờ đã được giải phóng -> AVAILABLE
    const statusAfterReject = getRoomStatusAt(room506, tomorrow, '08:30');
    expect(statusAfterReject).toBe('AVAILABLE');
  });

  it('4. Phòng tự học / thuyết trình thông thường tự xác nhận (CONFIRMED + QR)', async () => {
    const today = getRelativeDate(0);
    const room001 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.001')!;
    expect(room001.requiresApproval).toBeFalsy();

    const bookingRes = await mockCreateBooking({
      roomId: room001.id,
      bookingDate: today,
      startTime: '10:00',
      endTime: '12:00',
      occupancy: 5,
      purpose: 'Học nhóm ôn thi',
      memberStudentCodes: ['52100888'],
    });

    expect(bookingRes.success).toBe(true);
    expect(bookingRes.data!.bookingStatus).toBe('CONFIRMED');
    expect(bookingRes.data!.qrCodeData).toContain('SMART-CAMPUS-BK-');
    expect(bookingRes.data!.qrCodeImageBase64).toBe('');
  });
});

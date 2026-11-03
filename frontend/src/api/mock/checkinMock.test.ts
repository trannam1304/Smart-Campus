import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore, getRelativeDate } from './mockStore';
import { mockCheckinQr } from './checkinMock';
import { buildMemberQrCode } from '../../utils/qrCode';

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

describe('checkinMock - Individual Member QR Check-in', () => {
  const today = getRelativeDate(0);

  beforeEach(() => {
    localStoragePolyfill.clear();
    mockStore.reset();
  });

  it('1. Mã đúng định dạng và đúng khung giờ -> check-in thành công, chuyển sang IN_USE, trả về thông tin sinh viên và bộ đếm', async () => {
    // BK-8901: CONFIRMED today, startTime 09:00, endTime 11:00, owner: 52100888 (La Thái Thành)
    const qrCode = buildMemberQrCode('BK-8901', '52100888');
    const scannedAt = `${today}T09:05:00+07:00`; // Trong khung [08:45, 09:15]

    const res = await mockCheckinQr({
      qrData: qrCode,
      scannedAt,
    });

    expect(res.success).toBe(true);
    expect(res.data!.status).toBe('IN_USE');
    expect(res.data!.roomCode).toBe('L.102');
    expect(res.data!.student.studentCode).toBe('52100888');
    expect(res.data!.student.studentName).toBe('La Thái Thành');
    expect(res.data!.checkedInCount).toBe(1);
    expect(res.data!.totalMembers).toBe(6);

    // Kiểm tra đã cập nhật trong mockStore
    const b = mockStore.getState().bookings.find((item) => item.id === 'BK-8901')!;
    expect(b.status).toBe('IN_USE');
    const member = b.members?.find((m) => m.studentCode === '52100888')!;
    expect(member.checkedInAt).toBe(scannedAt);
  });

  it('2. Sai định dạng hoặc mã cũ dạng SMART-CAMPUS-BK-8901 -> bị từ chối với thông báo "Mã QR không hợp lệ"', async () => {
    const scannedAt = `${today}T09:05:00+07:00`;

    // Mã cũ không có MSSV
    const oldCodeRes = await mockCheckinQr({
      qrData: 'SMART-CAMPUS-BK-8901',
      scannedAt,
    });
    expect(oldCodeRes.success).toBe(false);
    expect(oldCodeRes.message).toBe('Mã QR không hợp lệ');

    // Nhập b.id thay cho QR cá nhân
    const idRes = await mockCheckinQr({
      qrData: 'BK-8901',
      scannedAt,
    });
    expect(idRes.success).toBe(false);
    expect(idRes.message).toBe('Mã QR không hợp lệ');

    // Sai MSSV 7 chữ số
    const shortCodeRes = await mockCheckinQr({
      qrData: 'SMART-CAMPUS-BK-8901-5210088',
      scannedAt,
    });
    expect(shortCodeRes.success).toBe(false);
    expect(shortCodeRes.message).toBe('Mã QR không hợp lệ');
  });

  it('3. Quét ngoài khung giờ cho phép (-15 đến +15 phút so với startTime) -> bị từ chối với ERR_OUTSIDE_GRACE_PERIOD', async () => {
    const qrCode = buildMemberQrCode('BK-8901', '52100888');

    // Quá sớm: 08:30 (sớm hơn 30 phút, vượt quá 15 phút)
    const earlyScannedAt = `${today}T08:30:00+07:00`;
    const earlyRes = await mockCheckinQr({
      qrData: qrCode,
      scannedAt: earlyScannedAt,
    });
    expect(earlyRes.success).toBe(false);
    expect((earlyRes as any).errorCode).toBe('ERR_OUTSIDE_GRACE_PERIOD');

    // Quá muộn: 09:20 (muộn hơn 20 phút)
    const lateScannedAt = `${today}T09:20:00+07:00`;
    const lateRes = await mockCheckinQr({
      qrData: qrCode,
      scannedAt: lateScannedAt,
    });
    expect(lateRes.success).toBe(false);
    expect((lateRes as any).errorCode).toBe('ERR_OUTSIDE_GRACE_PERIOD');
  });

  it('4. Cùng một MSSV quét lần hai -> báo lỗi "MSSV {x} đã điểm danh lúc HH:mm"', async () => {
    const qrCode = buildMemberQrCode('BK-8901', '52100888');
    const firstScannedAt = `${today}T09:02:00+07:00`;

    // Quét lần 1
    const firstRes = await mockCheckinQr({
      qrData: qrCode,
      scannedAt: firstScannedAt,
    });
    expect(firstRes.success).toBe(true);

    // Quét lần 2 với cùng mã QR
    const secondScannedAt = `${today}T09:05:00+07:00`;
    const secondRes = await mockCheckinQr({
      qrData: qrCode,
      scannedAt: secondScannedAt,
    });
    expect(secondRes.success).toBe(false);
    expect(secondRes.message).toContain('MSSV 52100888 đã điểm danh lúc 09:02');
  });

  it('5. Người thứ hai quét sau khi phòng đã IN_USE -> được ghi nhận thành công, tăng số lượng điểm danh', async () => {
    // Thành viên 1 điểm danh trước lúc 09:01
    const member1Qr = buildMemberQrCode('BK-8901', '52100888');
    const res1 = await mockCheckinQr({
      qrData: member1Qr,
      scannedAt: `${today}T09:01:00+07:00`,
    });
    expect(res1.success).toBe(true);
    expect(res1.data!.checkedInCount).toBe(1);

    // Thành viên 2 (52100666) đến sau lúc 09:30 (ngoài khung 15 phút đầu nhưng phòng đã IN_USE và chưa hết 11:00)
    const member2Qr = buildMemberQrCode('BK-8901', '52100666');
    const res2 = await mockCheckinQr({
      qrData: member2Qr,
      scannedAt: `${today}T09:30:00+07:00`,
    });
    expect(res2.success).toBe(true);
    expect(res2.data!.status).toBe('IN_USE');
    expect(res2.data!.student.studentCode).toBe('52100666');
    expect(res2.data!.checkedInCount).toBe(2);
    expect(res2.data!.totalMembers).toBe(6);
  });

  it('6. Lượt đặt phòng chưa duyệt (PENDING_APPROVAL) -> không thể điểm danh', async () => {
    // BK-8907: PENDING_APPROVAL, qrCode của mọi thành viên là rỗng
    const res = await mockCheckinQr({
      qrData: 'SMART-CAMPUS-BK-8907-52100888',
      scannedAt: `${today}T08:35:00+07:00`,
    });
    expect(res.success).toBe(false);
    // Mã trong booking rỗng nên báo không hợp lệ hoặc chưa có hiệu lực / đang chờ duyệt
    expect(res.message).toMatch(/(chưa có hiệu lực|đang chờ duyệt|không hợp lệ)/i);
  });
});

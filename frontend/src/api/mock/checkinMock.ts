import { ApiEnvelope } from '../types';
import { CheckinQrRequest, CheckinQrResponse, CheckoutRequest, CheckoutResponse } from '../checkinApi';
import { Booking } from '../../types/booking';
import { mockStore } from './mockStore';
import { parseMemberQrCode } from '../../utils/qrCode';

export const mockCheckinQr = async (
  data: CheckinQrRequest
): Promise<ApiEnvelope<CheckinQrResponse>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Phân tích mã QR theo quy ước cá nhân mới
      const parsed = parseMemberQrCode(data.qrData);
      if (!parsed) {
        return resolve({
          success: false,
          code: 400,
          message: 'Mã QR không hợp lệ',
          timestamp: new Date().toISOString(),
        } as any);
      }

      const state = mockStore.getState();
      const target = state.bookings.find((b) => b.id === parsed.bookingId);

      // 2. Kiểm tra tồn tại của lượt đặt phòng
      if (!target) {
        return resolve({
          success: false,
          code: 404,
          message: 'Mã QR không hợp lệ',
          timestamp: new Date().toISOString(),
        } as any);
      }

      // 3. Kiểm tra thành viên trong lượt đặt
      const member = target.members?.find((m) => m.studentCode === parsed.studentCode);
      if (!member) {
        return resolve({
          success: false,
          code: 404,
          message: 'Mã QR không hợp lệ',
          timestamp: new Date().toISOString(),
        } as any);
      }

      // 4. Kiểm tra mã QR khớp với member và không rỗng (chưa được cấp)
      if (!member.qrCode || member.qrCode !== data.qrData.trim()) {
        return resolve({
          success: false,
          code: 400,
          message: 'Mã QR không hợp lệ hoặc chưa có hiệu lực',
          timestamp: new Date().toISOString(),
        } as any);
      }

      // 5. Kiểm tra trạng thái lượt đặt phòng
      if (target.status === 'PENDING_APPROVAL') {
        return resolve({
          success: false,
          code: 400,
          message: 'Lượt đặt phòng đang chờ duyệt, chưa thể điểm danh.',
          timestamp: new Date().toISOString(),
        } as any);
      }

      if (target.status.startsWith('CANCELLED')) {
        return resolve({
          success: false,
          code: 400,
          message: 'Lượt đặt phòng đã bị hủy, không thể điểm danh.',
          timestamp: new Date().toISOString(),
        } as any);
      }

      if (target.status === 'COMPLETED') {
        return resolve({
          success: false,
          code: 400,
          message: 'Lượt đặt phòng đã hoàn thành.',
          timestamp: new Date().toISOString(),
        } as any);
      }

      // 6. Kiểm tra xem thành viên này đã điểm danh trước đó chưa
      if (member.checkedInAt) {
        const timePart = member.checkedInAt.includes('T')
          ? member.checkedInAt.split('T')[1].slice(0, 5)
          : member.checkedInAt.slice(0, 5);
        return resolve({
          success: false,
          code: 400,
          message: `MSSV ${member.studentCode} đã điểm danh lúc ${timePart}`,
          timestamp: new Date().toISOString(),
        } as any);
      }

      // 7. Kiểm tra khung giờ điểm danh
      const now = new Date(data.scannedAt);
      const [sh, sm] = target.startTime.split(':').map(Number);
      const [eh, em] = target.endTime.split(':').map(Number);

      const startDateTime = new Date(`${target.date}T00:00:00`);
      startDateTime.setHours(sh, sm, 0, 0);

      const endDateTime = new Date(`${target.date}T00:00:00`);
      endDateTime.setHours(eh, em, 0, 0);

      if (target.status === 'CONFIRMED') {
        // Lần quét đầu tiên: khung giờ [start - 15, start + 15]
        const diffMins = (now.getTime() - startDateTime.getTime()) / (1000 * 60);
        if (diffMins < -15 || diffMins > 15) {
          return resolve({
            success: false,
            code: 422,
            errorCode: 'ERR_OUTSIDE_GRACE_PERIOD',
            message: 'Chưa đến giờ check-in hoặc đã hết hạn.',
            timestamp: new Date().toISOString(),
          } as any);
        }
      } else if (target.status === 'IN_USE') {
        // Các thành viên quét sau khi phòng đã IN_USE: cho phép đến hết endTime
        if (now.getTime() > endDateTime.getTime()) {
          return resolve({
            success: false,
            code: 422,
            errorCode: 'ERR_OUTSIDE_GRACE_PERIOD',
            message: 'Lượt đặt phòng đã quá giờ kết thúc.',
            timestamp: new Date().toISOString(),
          } as any);
        }
      }

      // 8. Cập nhật trạng thái và điểm danh thành viên trong mockStore
      mockStore.update((s) => {
        const b = s.bookings.find((item) => item.id === target.id);
        if (b) {
          if (b.status === 'CONFIRMED') {
            b.status = 'IN_USE';
            b.checkInTime = data.scannedAt;
          }
          const targetMember = b.members?.find((m) => m.studentCode === parsed.studentCode);
          if (targetMember) {
            targetMember.checkedInAt = data.scannedAt;
          }
        }
      });

      const updatedBooking = mockStore.getState().bookings.find((item) => item.id === target.id);
      const checkedInCount =
        updatedBooking?.members?.filter((m) => !!m.checkedInAt).length ?? 1;
      const totalMembers =
        updatedBooking?.members?.length || target.numberOfPeople;

      resolve({
        success: true,
        code: 200,
        message: 'Điểm danh thành công',
        data: {
          bookingId: target.id,
          roomCode: target.roomCode,
          status: 'IN_USE',
          checkInTime: data.scannedAt,
          student: {
            studentCode: member.studentCode,
            studentName: member.studentName,
          },
          checkedInCount,
          totalMembers,
        },
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockCheckout = async (
  data: CheckoutRequest
): Promise<ApiEnvelope<CheckoutResponse>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const state = mockStore.getState();
      const target = state.bookings.find((b) => b.id === data.bookingId);
      if (!target) {
        return resolve({
          success: false,
          code: 404,
          message: 'Không tìm thấy booking!',
          timestamp: new Date().toISOString(),
        } as any);
      }

      mockStore.update((s) => {
        const b = s.bookings.find((item) => item.id === target.id);
        if (b) {
          b.status = 'COMPLETED';
        }
      });

      resolve({
        success: true,
        code: 200,
        message: 'Trả phòng thành công',
        data: { status: 'COMPLETED' },
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

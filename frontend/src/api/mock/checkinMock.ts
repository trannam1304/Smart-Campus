import { ApiEnvelope } from '../types';
import { CheckinQrRequest, CheckoutRequest } from '../checkinApi';
import { mockBookings, mockInitialFloors } from './mockData';

export const mockCheckinQr = async (data: CheckinQrRequest): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const target = mockBookings.find(b => b.qrCode === data.qrData || b.id === data.qrData);
      
      if (!target) {
        return resolve({
          success: false,
          code: 404,
          message: 'Mã QR hoặc Mã đặt phòng không hợp lệ!',
          timestamp: new Date().toISOString()
        } as any);
      }

      if (target.status === 'IN_USE') {
        return resolve({
          success: false,
          code: 400,
          message: 'Lịch đặt phòng này đã được check-in trước đó.',
          timestamp: new Date().toISOString()
        } as any);
      }

      // Check time grace period logic for mock
      const now = new Date(data.scannedAt);
      const [sh, sm] = target.startTime.split(':').map(Number);
      
      const startDateTime = new Date(`${target.date}T00:00:00`);
      startDateTime.setHours(sh, sm, 0, 0);

      const diffMins = (now.getTime() - startDateTime.getTime()) / (1000 * 60);

      // grace window: -15 to +15 mins
      if (diffMins < -15 || diffMins > 15) {
        return resolve({
          success: false,
          code: 422,
          errorCode: 'ERR_OUTSIDE_GRACE_PERIOD',
          message: 'Chưa đến giờ check-in hoặc đã hết hạn.',
          timestamp: new Date().toISOString()
        } as any);
      }

      target.status = 'IN_USE';
      target.checkInTime = data.scannedAt;

      // Cập nhật trạng thái phòng thành SELF_BOOKED
      const f = mockInitialFloors.find(fl => fl.floorNumber === target.floor);
      if (f) {
        const r = f.rooms.find(rm => rm.id === target.roomId);
        if (r) r.status = 'SELF_BOOKED';
      }

      resolve({
        success: true,
        code: 200,
        message: 'Check-in thành công',
        data: { status: 'IN_USE', checkInTime: data.scannedAt },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

export const mockCheckout = async (data: CheckoutRequest): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const target = mockBookings.find(b => b.id === data.bookingId);
      if (!target) {
        return resolve({
          success: false,
          code: 404,
          message: 'Không tìm thấy booking!',
          timestamp: new Date().toISOString()
        } as any);
      }
      
      target.status = 'COMPLETED'; // Hoặc AVAILABLE cho phòng

      // Cập nhật trạng thái phòng thành AVAILABLE
      const f = mockInitialFloors.find(fl => fl.floorNumber === target.floor);
      if (f) {
        const r = f.rooms.find(rm => rm.id === target.roomId);
        if (r) r.status = 'AVAILABLE';
      }

      resolve({
        success: true,
        code: 200,
        message: 'Trả phòng thành công',
        data: { status: 'COMPLETED' },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';
import { BookingStatus } from '../types/booking';

export interface CheckinQrRequest {
  qrData: string;
  scannedAt: string;
  deviceLocation?: string;
}

export interface CheckoutRequest {
  bookingId: string;
}

export interface CheckinStudentInfo {
  studentCode: string;
  studentName: string;
}

export interface CheckinQrResponse {
  bookingId: string;
  roomCode: string;
  status: BookingStatus;
  checkInTime: string;
  student: CheckinStudentInfo;
  checkedInCount: number;
  totalMembers: number;
}

export interface CheckoutResponse {
  status: BookingStatus;
}

export const checkinQrApi = async (
  data: CheckinQrRequest
): Promise<ApiEnvelope<CheckinQrResponse>> => {
  try {
    // Gọi endpoint chuẩn Backend Spring Boot: POST /api/bookings/check-in
    const res: any = await axiosClient.post('/bookings/check-in', {
      qrCode: data.qrData,
    });
    const d = res.data;
    const normalized: CheckinQrResponse = {
      bookingId: String(d?.bookingId || ''),
      roomCode: d?.roomCode || '',
      status: (d?.status || 'IN_USE') as BookingStatus,
      checkInTime: d?.checkinTime ? new Date(d.checkinTime).toLocaleTimeString('vi-VN') : new Date().toLocaleTimeString('vi-VN'),
      student: {
        studentCode: d?.studentCode || '',
        studentName: d?.studentName || 'Sinh viên',
      },
      checkedInCount: d?.checkedInCount || 1,
      totalMembers: d?.totalMembers || 1,
    };
    return {
      success: true,
      code: 200,
      message: d?.message || res.message || 'Điểm danh nhận phòng thành công.',
      data: normalized,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    throw err;
  }
};

export const checkoutApi = async (
  data: CheckoutRequest
): Promise<ApiEnvelope<CheckoutResponse>> => {
  const numericId = String(data.bookingId || '').replace(/[^0-9]/g, '');
  const payload = {
    bookingId: numericId || data.bookingId,
    id: numericId || data.bookingId,
  };

  try {
    // 1. Gọi endpoint chuẩn Spring Boot: POST /api/bookings/checkout
    const res: any = await axiosClient.post('/bookings/checkout', payload);

    // Đồng bộ session local nếu có lưu booking
    try {
      const stored = localStorage.getItem('user_session_bookings');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((b: any) =>
          String(b.id) === String(data.bookingId) ? { ...b, status: 'COMPLETED' } : b
        );
        localStorage.setItem('user_session_bookings', JSON.stringify(updated));
      }
    } catch {}

    return {
      success: true,
      code: res.code || 200,
      message: res.message || res.data?.message || 'Trả phòng thành công. Cảm ơn bạn đã sử dụng dịch vụ!',
      data: {
        status: 'COMPLETED' as BookingStatus,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    // 2. Thử endpoint fallback: POST /api/checkin/checkout
    try {
      const fallbackRes: any = await axiosClient.post('/checkin/checkout', payload);
      try {
        const stored = localStorage.getItem('user_session_bookings');
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((b: any) =>
            String(b.id) === String(data.bookingId) ? { ...b, status: 'COMPLETED' } : b
          );
          localStorage.setItem('user_session_bookings', JSON.stringify(updated));
        }
      } catch {}

      return {
        success: true,
        code: fallbackRes.code || 200,
        message: fallbackRes.message || fallbackRes.data?.message || 'Trả phòng thành công.',
        data: {
          status: 'COMPLETED' as BookingStatus,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw err;
    }
  }
};

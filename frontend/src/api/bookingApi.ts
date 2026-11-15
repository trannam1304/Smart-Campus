import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';
import { BookingStatus } from '../types/booking';

export interface CreateBookingRequest {
  roomId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  occupancy: number;
  purpose: string;
  memberStudentCodes: string[];
}

export interface CreateBookingResponse {
  bookingId: string;
  roomCode: string;
  bookingStatus: BookingStatus;
  status?: BookingStatus;
  qrCodeData: string;
  qrCodeImageBase64: string;
  checkInWindow: {
    allowEarlyFrom: string;
    deadlineAt: string;
  };
  memberQrCodes?: { studentCode: string; qrCodeData: string }[];
}

export const createBookingApi = async (data: CreateBookingRequest): Promise<ApiEnvelope<CreateBookingResponse>> => {
  const startTime = data.startTime.includes('T') ? data.startTime : `${data.bookingDate}T${data.startTime}:00`;
  const endTime = data.endTime.includes('T') ? data.endTime : `${data.bookingDate}T${data.endTime}:00`;

  const rawRoomId = String(data.roomId || '');
  const parsedRoomId = Number(rawRoomId.replace(/^ROOM-/i, ''));
  const roomId = !isNaN(parsedRoomId) && parsedRoomId > 0 ? parsedRoomId : rawRoomId;

  const payload = {
    roomId,
    bookingDate: data.bookingDate,
    startTime,
    endTime,
    numberOfPeople: data.occupancy,
    occupancy: data.occupancy,
    purpose: data.purpose,
    memberCodes: data.memberStudentCodes,
    memberStudentCodes: data.memberStudentCodes,
  };

  const res: any = await axiosClient.post('/bookings', payload);
  const d = res.data;

  // Chuẩn hóa dữ liệu trả về phù hợp với giao diện modal
  const bookingStatus = (d?.bookingStatus || d?.status || 'CONFIRMED') as BookingStatus;
  const normalizedData: CreateBookingResponse = {
    bookingId: String(d?.bookingId || d?.id || ''),
    roomCode: d?.roomCode || '',
    bookingStatus,
    status: bookingStatus,
    qrCodeData: d?.qrCodeData || d?.qrCode || d?.qrCodeUrl || '',
    qrCodeImageBase64: d?.qrCodeImageBase64 || '',
    checkInWindow: d?.checkInWindow || {
      allowEarlyFrom: startTime,
      deadlineAt: endTime,
    },
    memberQrCodes: d?.memberQrCodes,
  };

  // Lưu lại booking vào session để trang MyBookings hiển thị nếu backend chưa có API getMyBookings
  try {
    const bookingItem = {
      id: normalizedData.bookingId,
      roomCode: normalizedData.roomCode,
      roomId: String(data.roomId),
      date: data.bookingDate,
      startTime: data.startTime.includes('T') ? data.startTime.split('T')[1].slice(0, 5) : data.startTime,
      endTime: data.endTime.includes('T') ? data.endTime.split('T')[1].slice(0, 5) : data.endTime,
      status: normalizedData.bookingStatus,
      qrCode: normalizedData.qrCodeData,
      purpose: data.purpose,
      occupancy: data.occupancy,
      studentCode: data.memberStudentCodes?.[0] || '',
      studentName: 'Tôi',
      building: 'Tòa L',
      floorCode: 'G - Floor',
      roomType: 'Phòng tự học',
      createdAt: new Date().toISOString(),
      members: (data.memberStudentCodes || []).map((code) => ({
        studentCode: code,
        studentName: code,
        qrCode: `SMART-CAMPUS-${normalizedData.bookingId}-${code}`,
      })),
    };

    const existing = JSON.parse(localStorage.getItem('user_session_bookings') || '[]');
    const updated = [bookingItem, ...existing.filter((b: any) => b.id !== normalizedData.bookingId)];
    localStorage.setItem('user_session_bookings', JSON.stringify(updated));
  } catch (err) {
    console.warn('Không thể lưu booking vào localStorage', err);
  }

  return {
    ...res,
    data: normalizedData,
  };
};

export const getMyBookingsApi = async (): Promise<ApiEnvelope<any[]>> => {
  try {
    return await axiosClient.get('/bookings/my-bookings');
  } catch {
    // Dự phòng an toàn nếu Backend chưa triển khai endpoint /api/bookings/my-bookings
    try {
      const stored = localStorage.getItem('user_session_bookings');
      const list = stored ? JSON.parse(stored) : [];
      return {
        success: true,
        code: 200,
        message: 'OK',
        data: list,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: true,
        code: 200,
        message: 'OK',
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  }
};

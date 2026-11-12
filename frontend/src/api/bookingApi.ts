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
  const normalizedData: CreateBookingResponse = {
    bookingId: String(d?.bookingId || d?.id || ''),
    roomCode: d?.roomCode || '',
    bookingStatus: (d?.bookingStatus || d?.status || 'CONFIRMED') as BookingStatus,
    qrCodeData: d?.qrCodeData || d?.qrCode || d?.qrCodeUrl || '',
    qrCodeImageBase64: d?.qrCodeImageBase64 || '',
    checkInWindow: d?.checkInWindow || {
      allowEarlyFrom: startTime,
      deadlineAt: endTime,
    },
    memberQrCodes: d?.memberQrCodes,
  };

  return {
    ...res,
    data: normalizedData,
  };
};

export const getMyBookingsApi = async (): Promise<ApiEnvelope<any[]>> => {
  return axiosClient.get('/bookings/my-bookings');
};

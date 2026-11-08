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
  return axiosClient.post('/bookings', data);
};

export const getMyBookingsApi = async (): Promise<ApiEnvelope<any[]>> => {
  return axiosClient.get('/bookings/my-bookings');
};

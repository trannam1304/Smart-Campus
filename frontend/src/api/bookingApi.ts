import { USE_MOCK } from '../config/env';
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
}

export const createBookingApi = async (data: CreateBookingRequest): Promise<ApiEnvelope<CreateBookingResponse>> => {
  if (USE_MOCK) {
    const { mockCreateBooking } = await import('./mock/bookingMock');
    return mockCreateBooking(data);
  }
  return axiosClient.post('/bookings', data);
};

export const getMyBookingsApi = async (): Promise<ApiEnvelope<any[]>> => {
  if (USE_MOCK) {
    const { mockGetMyBookings } = await import('./mock/bookingMock');
    return mockGetMyBookings();
  }
  // TODO: Implement real backend call when endpoint is ready
  return axiosClient.get('/bookings/my-bookings');
};


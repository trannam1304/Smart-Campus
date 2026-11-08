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
  return axiosClient.post('/checkin/qr', data);
};

export const checkoutApi = async (
  data: CheckoutRequest
): Promise<ApiEnvelope<CheckoutResponse>> => {
  return axiosClient.post('/checkin/checkout', data);
};

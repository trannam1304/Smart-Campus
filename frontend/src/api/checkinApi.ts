import { USE_MOCK } from '../config/env';
import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export interface CheckinQrRequest {
  qrData: string;
  scannedAt: string;
  deviceLocation?: string;
}

export interface CheckoutRequest {
  bookingId: string;
}

export const checkinQrApi = async (data: CheckinQrRequest): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockCheckinQr } = await import('./mock/checkinMock');
    return mockCheckinQr(data);
  }
  return axiosClient.post('/checkin/qr', data);
};

export const checkoutApi = async (data: CheckoutRequest): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockCheckout } = await import('./mock/checkinMock');
    return mockCheckout(data);
  }
  return axiosClient.post('/checkin/checkout', data);
};


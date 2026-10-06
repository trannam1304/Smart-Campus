import { ApiEnvelope } from '../types';
import { CreateBookingRequest, CreateBookingResponse } from '../bookingApi';

export const mockCreateBooking = async (data: CreateBookingRequest): Promise<ApiEnvelope<CreateBookingResponse>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          bookingId: 'b-1',
          roomCode: 'A101',
          bookingStatus: 'CONFIRMED',
          qrCodeData: 'mock-qr-data',
          qrCodeImageBase64: 'mock-base64',
          checkInWindow: {
            allowEarlyFrom: '07:15',
            deadlineAt: '07:45'
          }
        },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

export const mockGetMyBookings = async (): Promise<ApiEnvelope<any[]>> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { mockBookings } = await import('./mockData');
      
      // Sort newest first
      const sorted = [...mockBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: sorted,
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

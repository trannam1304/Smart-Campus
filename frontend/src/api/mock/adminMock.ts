import { ApiEnvelope } from '../types';
import { Booking, Room } from '../../types/booking';

export const mockGetAdminDashboardData = async (): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { mockBookings, mockIncidents, mockRegistrations } = await import('./mockData');
      
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          bookings: mockBookings,
          incidents: mockIncidents,
          registrations: mockRegistrations,
        },
        timestamp: new Date().toISOString()
      });
    }, 300);
  });
};

export const mockUpdateRoomStatus = async (roomId: string, status: string): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        code: 200,
        message: 'Cập nhật trạng thái thành công',
        data: null,
        timestamp: new Date().toISOString()
      });
    }, 300);
  });
};

export const mockResolveIncident = async (incidentId: string): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { mockIncidents } = await import('./mockData');
      const inc = mockIncidents.find((i: any) => i.id === incidentId);
      if (inc) inc.status = 'RESOLVED';
      resolve({
        success: true,
        code: 200,
        message: 'Đã xử lý sự cố',
        data: null,
        timestamp: new Date().toISOString()
      });
    }, 300);
  });
};

export const mockHandleRegistration = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { mockRegistrations } = await import('./mockData');
      const reg = mockRegistrations.find((r: any) => r.id === id);
      if (reg) reg.status = status;
      resolve({
        success: true,
        code: 200,
        message: status === 'APPROVED' ? 'Đã duyệt đăng ký' : 'Đã từ chối đăng ký',
        data: null,
        timestamp: new Date().toISOString()
      });
    }, 300);
  });
};

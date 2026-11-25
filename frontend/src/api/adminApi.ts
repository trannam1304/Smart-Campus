import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export const getAdminDashboardDataApi = async (): Promise<ApiEnvelope<any>> => {
  try {
    return await axiosClient.get('/admin/dashboard');
  } catch (err: any) {
    if (err?.status === 404) {
      return {
        success: true,
        data: {
          bookings: [],
          incidents: [],
          kpis: {
            totalBookings: 0,
            pendingApprovals: 0,
            openIncidents: 0,
            utilizationRate: 0,
          },
          hourlyStats: [],
        },
        message: 'OK',
      } as any;
    }
    throw err;
  }
};

export const updateRoomStatusApi = async (roomId: string, status: string, reason?: string): Promise<ApiEnvelope<any>> => {
  try {
    return await axiosClient.put(`/admin/rooms/${roomId}/status`, { status, reason });
  } catch (adminErr) {
    try {
      // Fallback sang endpoint chuẩn của Backend Spring Boot: PUT /rooms/{roomId}
      const roomRes: any = await axiosClient.get(`/rooms/${roomId}`);
      const r = roomRes.data;
      if (r) {
        const putRes: any = await axiosClient.put(`/rooms/${roomId}`, {
          roomCode: r.roomCode,
          buildingId: r.buildingId || 1,
          floorNumber: r.floorNumber ?? 0,
          roomTypeCode: r.roomTypeCode || 'GROUP',
          capacity: r.capacity || 5,
          status: status,
        });
        return {
          success: true,
          code: 200,
          message: status === 'MAINTENANCE' ? 'Đã chuyển phòng sang trạng thái bảo trì.' : 'Đã khôi phục phòng về trạng thái hoạt động.',
          data: putRes.data || r,
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // Tiếp tục ném lỗi gốc nếu fallback cũng lỗi
    }
    throw adminErr;
  }
};

export const resolveIncidentApi = async (incidentId: string): Promise<ApiEnvelope<any>> => {
  return axiosClient.put(`/admin/incidents/${incidentId}/resolve`);
};

export const handleRegistrationApi = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<ApiEnvelope<any>> => {
  return axiosClient.put(`/admin/registrations/${id}`, { status });
};

export const approveBookingApi = async (bookingId: string): Promise<ApiEnvelope<any>> => {
  return axiosClient.put(`/admin/bookings/${bookingId}/approve`);
};

export const rejectBookingApi = async (bookingId: string, reason: string): Promise<ApiEnvelope<any>> => {
  return axiosClient.put(`/admin/bookings/${bookingId}/reject`, { reason });
};

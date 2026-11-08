import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export const getAdminDashboardDataApi = async (): Promise<ApiEnvelope<any>> => {
  return axiosClient.get('/admin/dashboard');
};

export const updateRoomStatusApi = async (roomId: string, status: string, reason?: string): Promise<ApiEnvelope<any>> => {
  return axiosClient.put(`/admin/rooms/${roomId}/status`, { status, reason });
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

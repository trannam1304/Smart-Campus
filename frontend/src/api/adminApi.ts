import { USE_MOCK } from '../config/env';
import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export const getAdminDashboardDataApi = async (): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockGetAdminDashboardData } = await import('./mock/adminMock');
    return mockGetAdminDashboardData();
  }
  return axiosClient.get('/admin/dashboard');
};

export const updateRoomStatusApi = async (roomId: string, status: string, reason?: string): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockUpdateRoomStatus } = await import('./mock/adminMock');
    return mockUpdateRoomStatus(roomId, status, reason);
  }
  return axiosClient.put(`/admin/rooms/${roomId}/status`, { status, reason });
};

export const resolveIncidentApi = async (incidentId: string): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockResolveIncident } = await import('./mock/adminMock');
    return mockResolveIncident(incidentId);
  }
  return axiosClient.put(`/admin/incidents/${incidentId}/resolve`);
};

export const handleRegistrationApi = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockHandleRegistration } = await import('./mock/adminMock');
    return mockHandleRegistration(id, status);
  }
  return axiosClient.put(`/admin/registrations/${id}`, { status });
};

export const approveBookingApi = async (bookingId: string): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockApproveBooking } = await import('./mock/adminMock');
    return mockApproveBooking(bookingId);
  }
  return axiosClient.put(`/admin/bookings/${bookingId}/approve`);
};

export const rejectBookingApi = async (bookingId: string, reason: string): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockRejectBooking } = await import('./mock/adminMock');
    return mockRejectBooking(bookingId, reason);
  }
  return axiosClient.put(`/admin/bookings/${bookingId}/reject`, { reason });
};



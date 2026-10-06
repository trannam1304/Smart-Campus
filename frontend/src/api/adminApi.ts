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

export const updateRoomStatusApi = async (roomId: string, status: string): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockUpdateRoomStatus } = await import('./mock/adminMock');
    return mockUpdateRoomStatus(roomId, status);
  }
  return axiosClient.put(`/admin/rooms/${roomId}/status`, { status });
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


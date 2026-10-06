import { USE_MOCK } from '../config/env';
import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export interface CreateIncidentRequest {
  roomId: string;
  equipmentId?: string;
  description: string;
  imageUrl?: string;
}

export const createIncidentApi = async (data: CreateIncidentRequest): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockCreateIncident } = await import('./mock/incidentMock');
    return mockCreateIncident(data);
  }
  return axiosClient.post('/incidents', data);
};


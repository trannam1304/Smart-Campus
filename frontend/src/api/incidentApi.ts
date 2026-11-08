import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export interface CreateIncidentRequest {
  roomId: string;
  equipmentId?: string;
  description: string;
  imageFile?: File;
  imageUrl?: string;
}

export const createIncidentApi = async (
  data: CreateIncidentRequest
): Promise<ApiEnvelope<{ incidentId: string }>> => {
  if (data.imageFile) {
    const formData = new FormData();
    formData.append('roomId', data.roomId);
    if (data.equipmentId) {
      formData.append('equipmentId', data.equipmentId);
    }
    formData.append('description', data.description);
    formData.append('image', data.imageFile);

    return axiosClient.post('/incidents', formData);
  }

  return axiosClient.post('/incidents', {
    roomId: data.roomId,
    equipmentId: data.equipmentId,
    description: data.description,
  });
};

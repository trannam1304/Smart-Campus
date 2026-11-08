import { USE_MOCK } from '../config/env';
import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export interface CreateIncidentRequest {
  roomId: string;
  equipmentId?: string;
  description: string;
  imageFile?: File;
  imageUrl?: string; // Kết quả phía server hoặc hỗ trợ tương thích ngược
}

export const createIncidentApi = async (
  data: CreateIncidentRequest
): Promise<ApiEnvelope<{ incidentId: string }>> => {
  if (USE_MOCK) {
    const { mockCreateIncident } = await import('./mock/incidentMock');
    return mockCreateIncident(data);
  }

  // Chế độ thật: nếu có ảnh thì gửi multipart/form-data qua FormData
  if (data.imageFile) {
    const formData = new FormData();
    formData.append('roomId', data.roomId);
    if (data.equipmentId) {
      formData.append('equipmentId', data.equipmentId);
    }
    formData.append('description', data.description);
    formData.append('image', data.imageFile);

    // Không tự đặt header Content-Type thủ công, axios/browser sẽ tự động gắn boundary
    return axiosClient.post('/incidents', formData);
  }

  // Ngược lại gửi JSON như cũ
  return axiosClient.post('/incidents', {
    roomId: data.roomId,
    equipmentId: data.equipmentId,
    description: data.description,
  });
};

import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export interface CreateIncidentRequest {
  roomId: string;
  roomCode?: string;
  equipmentId?: string;
  equipmentName?: string;
  description: string;
  imageFile?: File;
  imageUrl?: string;
}

export const createIncidentApi = async (
  data: CreateIncidentRequest
): Promise<ApiEnvelope<{ incidentId: string }>> => {
  const effectiveRoomId = data.roomCode || data.roomId;

  // Ưu tiên gửi JSON gọn nhẹ khi ảnh đã được nén sang Data URL để tránh payload multipart cồng kềnh
  if (data.imageUrl || !data.imageFile) {
    return await axiosClient.post('/incidents', {
      roomId: effectiveRoomId,
      roomCode: data.roomCode,
      equipmentId: data.equipmentId,
      equipmentName: data.equipmentName,
      description: data.description,
      imageUrl: data.imageUrl,
    });
  }

  const formData = new FormData();
  formData.append('roomId', effectiveRoomId);
  if (data.roomCode) {
    formData.append('roomCode', data.roomCode);
  }
  if (data.equipmentId) {
    formData.append('equipmentId', data.equipmentId);
  }
  if (data.equipmentName) {
    formData.append('equipmentName', data.equipmentName);
  }
  formData.append('description', data.description);
  formData.append('image', data.imageFile);

  return await axiosClient.post('/incidents', formData);
};

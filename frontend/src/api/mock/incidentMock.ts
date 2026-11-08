import { ApiEnvelope } from '../types';
import { CreateIncidentRequest } from '../incidentApi';
import { mockStore, getCurrentMockUser } from './mockStore';
import { IncidentReport } from '../../types/incident';
import { compressImageToDataUrl } from '../../utils/imageUtils';

export const mockCreateIncident = async (
  data: CreateIncidentRequest
): Promise<ApiEnvelope<{ incidentId: string }>> => {
  // Nén ảnh bằng Canvas nếu có imageFile để tránh tràn dung lượng localStorage 5 MB
  let processedImageUrl: string | undefined = undefined;

  if (data.imageFile) {
    try {
      processedImageUrl = await compressImageToDataUrl(data.imageFile, 1024, 0.7);
    } catch (compressError) {
      console.warn(
        'Không thể nén ảnh trong môi trường demo/mock, hệ thống tiếp tục lưu sự cố mà không kèm ảnh:',
        compressError
      );
      // Vẫn tiếp tục tạo sự cố không kèm ảnh
    }
  } else if (data.imageUrl) {
    processedImageUrl = data.imageUrl;
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const user = getCurrentMockUser();
      const state = mockStore.getState();
      const room = state.rooms.find((r) => r.id === data.roomId || r.roomCode === data.roomId);
      const roomCode = room ? room.roomCode : data.roomId;
      const device = room?.devices.find((d) => d.id === data.equipmentId);
      const deviceName = device ? device.name : 'Thiết bị';
      const newId = `INC-${Date.now().toString().slice(-4)}`;

      const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
      let reporterName = '';
      let reporterCode = '';

      if (isAdminOrStaff) {
        reporterName = user?.fullName || 'Quản trị viên';
        reporterCode = user?.staffCode || user?.studentCode || '';
      } else if (user) {
        reporterName = user.fullName || 'Sinh viên';
        reporterCode = user.studentCode || '';
      } else {
        reporterName = 'Khách';
        reporterCode = '';
      }

      const newIncident: IncidentReport = {
        id: newId,
        roomId: room ? room.id : data.roomId,
        roomCode,
        deviceName,
        reporterName,
        reporterCode,
        description: data.description,
        imageUrl: processedImageUrl,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };

      mockStore.update((s) => {
        s.incidents.unshift(newIncident);
      });

      resolve({
        success: true,
        code: 200,
        message: 'Báo cáo sự cố thành công',
        data: { incidentId: newId },
        timestamp: new Date().toISOString(),
      });
    }, 400);
  });
};

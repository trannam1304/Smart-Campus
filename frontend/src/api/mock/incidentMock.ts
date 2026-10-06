import { ApiEnvelope } from '../types';
import { CreateIncidentRequest } from '../incidentApi';

export const mockCreateIncident = async (data: CreateIncidentRequest): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        code: 200,
        message: 'Báo cáo sự cố thành công',
        data: { incidentId: 'inc-1' },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

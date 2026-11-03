import { ApiEnvelope } from '../types';
import { Booking } from '../../types/booking';
import { mockStore, isUpcomingBooking } from './mockStore';
import { buildMemberQrCode } from '../../utils/qrCode';

export const mockGetAdminDashboardData = async (): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { bookings, incidents, registrations } = mockStore.getState();

      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          bookings,
          incidents,
          registrations,
        },
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockUpdateRoomStatus = async (
  roomId: string,
  status: string,
  reason?: string
): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isMaintenance = status === 'MAINTENANCE';
      const trimmedReason = reason?.trim() || '';
      let cancelledCount = 0;
      let roomCode = roomId;

      mockStore.update((state) => {
        const room = state.rooms.find((r) => r.id === roomId || r.roomCode === roomId);
        if (!room) return;

        roomCode = room.roomCode;
        room.maintenance = isMaintenance;
        room.status = isMaintenance ? 'MAINTENANCE' : 'AVAILABLE';

        if (isMaintenance) {
          room.maintenanceReason = trimmedReason;
          const cancelReasonStr = trimmedReason ? `Phòng bảo trì: ${trimmedReason}` : 'Phòng bảo trì';
          // Khi chuyển sang bảo trì: hủy tất cả booking CONFIRMED / PENDING_APPROVAL sắp tới
          state.bookings.forEach((b) => {
            if ((b.roomId === room.id || b.roomCode === room.roomCode) && isUpcomingBooking(b)) {
              b.status = 'CANCELLED_ADMIN';
              b.cancelReason = cancelReasonStr;
              b.qrCode = '';
              if (b.members) {
                b.members.forEach((m) => {
                  m.qrCode = '';
                });
              }
              cancelledCount++;
            }
          });
        } else {
          delete room.maintenanceReason;
        }
      });

      const message = isMaintenance
        ? `Đã chuyển phòng ${roomCode} sang trạng thái Bảo trì.${
            cancelledCount > 0 ? ` Đã tự động hủy ${cancelledCount} lượt đặt sắp tới.` : ''
          }`
        : `Đã mở trống phòng ${roomCode} thành công.`;

      resolve({
        success: true,
        code: 200,
        message,
        data: {
          roomId,
          status: isMaintenance ? 'MAINTENANCE' : 'AVAILABLE',
          maintenanceReason: isMaintenance ? trimmedReason : undefined,
          cancelledCount,
        },
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockResolveIncident = async (incidentId: string): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockStore.update((state) => {
        const inc = state.incidents.find((i: any) => i.id === incidentId);
        if (inc) inc.status = 'RESOLVED';
      });

      resolve({
        success: true,
        code: 200,
        message: 'Đã xử lý sự cố thành công',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockHandleRegistration = async (
  id: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockStore.update((state) => {
        const reg = state.registrations.find((r: any) => r.id === id);
        if (reg) reg.status = status;
      });

      resolve({
        success: true,
        code: 200,
        message: status === 'APPROVED' ? 'Đã duyệt đơn đăng ký' : 'Đã từ chối đơn đăng ký',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockApproveBooking = async (bookingId: string): Promise<ApiEnvelope<Booking>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let approved: Booking | null = null;
      mockStore.update((state) => {
        const b = state.bookings.find((item) => item.id === bookingId);
        if (b) {
          b.status = 'CONFIRMED';
          b.qrCode = buildMemberQrCode(b.id, b.studentCode);
          if (b.members) {
            b.members.forEach((m) => {
              m.qrCode = buildMemberQrCode(b.id, m.studentCode);
            });
          }
          approved = { ...b, members: b.members ? b.members.map((m) => ({ ...m })) : [] };
        }
      });

      if (!approved) {
        return resolve({
          success: false,
          code: 404,
          message: 'Không tìm thấy đơn đặt phòng',
          timestamp: new Date().toISOString(),
        } as any);
      }

      resolve({
        success: true,
        code: 200,
        message: `Đã duyệt đơn đặt phòng ${(approved as Booking).roomCode} thành công. Mã QR đã được cấp cho sinh viên.`,
        data: approved,
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockRejectBooking = async (
  bookingId: string,
  reason: string
): Promise<ApiEnvelope<Booking>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let rejected: Booking | null = null;
      mockStore.update((state) => {
        const b = state.bookings.find((item) => item.id === bookingId);
        if (b) {
          b.status = 'CANCELLED_ADMIN';
          b.cancelReason = reason || 'Quản trị viên từ chối';
          b.qrCode = '';
          if (b.members) {
            b.members.forEach((m) => {
              m.qrCode = '';
            });
          }
          rejected = { ...b, members: b.members ? b.members.map((m) => ({ ...m })) : [] };
        }
      });

      if (!rejected) {
        return resolve({
          success: false,
          code: 404,
          message: 'Không tìm thấy đơn đặt phòng',
          timestamp: new Date().toISOString(),
        } as any);
      }

      resolve({
        success: true,
        code: 200,
        message: `Đã từ chối đơn đặt phòng ${(rejected as Booking).roomCode}. Khung giờ đã được giải phóng.`,
        data: rejected,
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};


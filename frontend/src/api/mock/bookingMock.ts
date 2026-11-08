import { ApiEnvelope } from '../types';
import { CreateBookingRequest, CreateBookingResponse } from '../bookingApi';
import { Booking, BookingMember, BookingStatus } from '../../types/booking';
import { mockStore, getCurrentMockUser } from './mockStore';
import { buildMemberQrCode } from '../../utils/qrCode';
import { findMockStudentName } from './authMock';

export const mockCreateBooking = async (data: CreateBookingRequest): Promise<ApiEnvelope<CreateBookingResponse>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = getCurrentMockUser();
      const state = mockStore.getState();
      const room = state.rooms.find((r) => r.id === data.roomId || r.roomCode === data.roomId);

      const requiresApproval = room?.requiresApproval ?? false;
      const bookingStatus: BookingStatus = requiresApproval ? 'PENDING_APPROVAL' : 'CONFIRMED';
      const bookingId = `BK-${Date.now().toString().slice(-4)}`;

      const bookerCode = user?.studentCode || '52100888';
      const bookerName = user?.fullName || findMockStudentName(bookerCode);

      // Đọc data.memberStudentCodes, loại trùng, đảm bảo chủ phòng đứng đầu
      const rawCodes = (data.memberStudentCodes || []).map((c) => (c || '').trim()).filter(Boolean);
      const codeList = [bookerCode, ...rawCodes.filter((c) => c !== bookerCode)];
      const uniqueCodes = Array.from(new Set(codeList));

      // Đảm bảo đủ số lượng người đăng ký
      while (uniqueCodes.length < (data.occupancy || 1)) {
        const padCode = `52100${String(100 + uniqueCodes.length).slice(-3)}`;
        if (!uniqueCodes.includes(padCode)) {
          uniqueCodes.push(padCode);
        }
      }

      // Xây dựng danh sách thành viên kèm QR riêng biệt
      const members: BookingMember[] = uniqueCodes.map((code) => {
        const name = code === bookerCode ? bookerName : findMockStudentName(code);
        const qrCode = requiresApproval ? '' : buildMemberQrCode(bookingId, code);
        return {
          studentCode: code,
          studentName: name,
          qrCode,
        };
      });

      const bookerMember = members.find((m) => m.studentCode === bookerCode) || members[0];
      const primaryQrCode = bookerMember?.qrCode || '';

      const newBooking: Booking = {
        id: bookingId,
        roomId: room ? room.id : data.roomId,
        roomCode: room ? room.roomCode : data.roomId,
        roomType: room ? room.roomType : 'Phòng tự học',
        building: room ? room.building : 'Tòa L',
        floor: room ? room.floor : 0,
        floorCode: room ? room.floorCode : 'G - Floor',
        studentId: user?.id || 'u-student-current',
        studentName: bookerName,
        studentCode: bookerCode,
        members,
        startTime: data.startTime,
        endTime: data.endTime,
        date: data.bookingDate,
        numberOfPeople: data.occupancy || members.length,
        purpose: data.purpose || 'Học nhóm',
        qrCode: primaryQrCode,
        status: bookingStatus,
        createdAt: new Date().toISOString(),
      };

      mockStore.update((s) => {
        s.bookings.unshift(newBooking);
      });

      // Calculate checkin window (15 mins before to 15 mins after startTime)
      const [sh, sm] = data.startTime.split(':').map(Number);
      const earlyMins = sh * 60 + sm - 15;
      const lateMins = sh * 60 + sm + 15;
      const formatTime = (totalMins: number) => {
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      resolve({
        success: true,
        code: 200,
        message: requiresApproval
          ? 'Đặt phòng hội nghị thành công. Yêu cầu đang chờ quản trị viên duyệt.'
          : 'Đặt phòng thành công',
        data: {
          bookingId: newBooking.id,
          roomCode: newBooking.roomCode,
          bookingStatus: newBooking.status,
          qrCodeData: primaryQrCode,
          qrCodeImageBase64: '', // Mock không trả ảnh base64 giả; QRModal tự vẽ QRCodeSVG
          checkInWindow: {
            allowEarlyFrom: formatTime(earlyMins),
            deadlineAt: formatTime(lateMins),
          },
          memberQrCodes: members.map((m) => ({
            studentCode: m.studentCode,
            qrCodeData: m.qrCode,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }, 400);
  });
};

export const mockGetMyBookings = async (): Promise<ApiEnvelope<Booking[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = getCurrentMockUser();
      const state = mockStore.getState();

      let userBookings = state.bookings;
      if (user) {
        userBookings = userBookings.filter(
          (b) =>
            b.studentId === user.id ||
            (user.studentCode && b.studentCode === user.studentCode) ||
            (user.studentCode && b.members?.some((m) => m.studentCode === user.studentCode))
        );
      }

      // Sort newest first
      const sorted = [...userBookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: sorted,
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

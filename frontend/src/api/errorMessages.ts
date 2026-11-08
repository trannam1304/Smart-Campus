import { USE_MOCK } from '../config/env';

export const errorMap: Record<string, string> = {
  ERR_LIBRARY_NOT_TRAINED: 'Bạn chưa hoàn thành khóa tập huấn thư viện.',
  ERR_MIN_OCCUPANCY: 'Số lượng người đăng ký không đạt yêu cầu tối thiểu của phòng.',
  ERR_INVALID_DURATION: 'Thời gian đặt phòng không hợp lệ.',
  ERR_NO_SHOW_LOCKED: 'Tài khoản của bạn đã bị khóa do vi phạm nội quy.',
  ERR_CONCURRENT_BOOKING: 'Bạn đã có lịch đặt phòng trong khoảng thời gian này.',
  ERR_OUTSIDE_GRACE_PERIOD: 'Thời gian check-in không hợp lệ.',
  ERR_STUDIO_LEAD_TIME: 'Phòng Studio cần đặt trước ít nhất số giờ quy định.',
  ERR_NIGHT_LEAD_TIME: 'Đặt phòng buổi tối cần thời gian chuẩn bị sớm hơn.'
};

export const getErrorMessage = (err: unknown): string => {
  const appendHint = (msg: string) => {
    if (import.meta.env.DEV && !USE_MOCK) {
      return msg + " (Gợi ý: Không kết nối được máy chủ API. Nếu chưa có backend, đặt VITE_USE_MOCK=true trong .env rồi khởi động lại npm run dev.)";
    }
    return msg;
  };

  if (typeof err === 'object' && err !== null) {
    const error = err as any;
    
    if (error.errorCode === 'ERR_QUOTA_EXCEEDED' && error.details) {
      const { studentCode, usedHours, requestedHours, weeklyQuota } = error.details;
      return `Sinh viên ${studentCode} đã dùng ${usedHours}/${weeklyQuota} giờ trong tuần, yêu cầu thêm ${requestedHours} giờ.`;
    }

    if (error.errorCode && errorMap[error.errorCode]) {
      return errorMap[error.errorCode];
    }

    if (error.status >= 500) {
      return appendHint('Lỗi máy chủ, vui lòng thử lại sau.');
    }

    if (error.message) {
      return error.message;
    }
  }

  if (err instanceof Error) {
    if (err.message.includes('Network Error') || err.message.includes('network')) return appendHint('Lỗi kết nối mạng, vui lòng kiểm tra lại.');
    if (err.message.includes('timeout')) return appendHint('Hết thời gian chờ kết nối, vui lòng thử lại.');
    return err.message;
  }

  return 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
};

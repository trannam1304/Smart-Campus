/**
 * Tiện ích tạo và phân tích mã QR điểm danh của từng thành viên trong lượt đặt phòng.
 * Quy ước mã: SMART-CAMPUS-<mã lượt đặt>-<MSSV>, ví dụ: SMART-CAMPUS-BK-8901-52100888
 */

const MEMBER_QR_REGEX = /^SMART-CAMPUS-(BK-[A-Za-z0-9]+)-(\d{8})$/;

export interface ParsedMemberQrCode {
  bookingId: string;
  studentCode: string;
}

/**
 * Sinh chuỗi dữ liệu mã QR cho một thành viên cụ thể trong lượt đặt phòng.
 */
export const buildMemberQrCode = (bookingId: string, studentCode: string): string => {
  const cleanBookingId = (bookingId || '').trim();
  const cleanStudentCode = (studentCode || '').trim();
  return `SMART-CAMPUS-${cleanBookingId}-${cleanStudentCode}`;
};

/**
 * Phân tích chuỗi dữ liệu mã QR để trích xuất bookingId và studentCode.
 * Trả về null nếu mã sai định dạng, thiếu MSSV, sai tiền tố hoặc MSSV không đúng 8 chữ số.
 */
export const parseMemberQrCode = (code: string | null | undefined): ParsedMemberQrCode | null => {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();
  const match = trimmed.match(MEMBER_QR_REGEX);
  if (!match) return null;

  return {
    bookingId: match[1],
    studentCode: match[2],
  };
};

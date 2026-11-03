import { STUDENT_EMAIL_DOMAIN } from '../config/bookingRules';

export const STUDENT_CODE_REGEX = /^\d{8}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * Kiểm tra tính hợp lệ của Mã số sinh viên (MSSV).
 * - Trả về '' nếu hợp lệ (/^\d{8}$/) sau khi trim khoảng trắng.
 * - 'MSSV chỉ gồm chữ số' nếu chứa ký tự khác ngoài chữ số.
 * - 'MSSV chưa đủ 8 chữ số' nếu ít hơn 8 chữ số.
 * - 'MSSV vượt quá 8 chữ số' nếu nhiều hơn 8 chữ số.
 */
export const getStudentCodeError = (value: string): string => {
  const trimmed = (value || '').trim();
  if (/[^\d]/.test(trimmed)) {
    return 'MSSV chỉ gồm chữ số';
  }
  if (trimmed.length < 8) {
    return 'MSSV chưa đủ 8 chữ số';
  }
  if (trimmed.length > 8) {
    return 'MSSV vượt quá 8 chữ số';
  }
  if (STUDENT_CODE_REGEX.test(trimmed)) {
    return '';
  }
  return 'MSSV chỉ gồm chữ số';
};

/**
 * Kiểm tra tính hợp lệ của mật khẩu.
 * Regex: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
 * Trả về '' nếu hợp lệ, hoặc thông báo chi tiết điều kiện còn thiếu (độ dài, chữ, số, ký tự đặc biệt).
 */
export const getPasswordError = (value: string): string => {
  if (!value) {
    return 'Vui lòng nhập mật khẩu';
  }

  const missing: string[] = [];
  if (value.length < 8) {
    missing.push('độ dài tối thiểu 8 ký tự');
  }
  if (!/[A-Za-z]/.test(value)) {
    missing.push('chữ cái');
  }
  if (!/\d/.test(value)) {
    missing.push('chữ số');
  }
  if (!/[@$!%*#?&]/.test(value)) {
    missing.push('ký tự đặc biệt (@$!%*#?&)');
  }

  if (/[^A-Za-z\d@$!%*#?&]/.test(value)) {
    return 'Mật khẩu chứa ký tự không hợp lệ (chỉ chấp nhận chữ cái, chữ số và ký tự @$!%*#?&)';
  }

  if (missing.length > 0) {
    return `Mật khẩu thiếu: ${missing.join(', ')}`;
  }

  if (PASSWORD_REGEX.test(value)) {
    return '';
  }

  return 'Mật khẩu chưa đáp ứng yêu cầu bảo mật';
};

/**
 * Kiểm tra tính hợp lệ của Email sinh viên.
 * Bắt buộc kết thúc bằng STUDENT_EMAIL_DOMAIN (@student.edu.vn).
 */
export const getEmailError = (value: string): string => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return 'Vui lòng nhập email';
  }

  const domain = STUDENT_EMAIL_DOMAIN;
  if (!trimmed.toLowerCase().endsWith(domain.toLowerCase())) {
    return `Email sinh viên phải có đuôi ${domain}`;
  }

  const prefix = trimmed.slice(0, trimmed.length - domain.length);
  if (!prefix || /[\s@]/.test(prefix)) {
    return `Email sinh viên không hợp lệ (phải có đuôi ${domain})`;
  }

  return '';
};

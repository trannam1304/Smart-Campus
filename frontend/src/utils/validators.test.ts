import { describe, it, expect } from 'vitest';
import { getStudentCodeError, getPasswordError } from './validators';

describe('validators', () => {
  describe('getStudentCodeError', () => {
    it("'52100666' hợp lệ", () => {
      expect(getStudentCodeError('52100666')).toBe('');
    });

    it("'5210066' báo thiếu", () => {
      expect(getStudentCodeError('5210066')).toBe('MSSV chưa đủ 8 chữ số');
    });

    it("'521006666' báo thừa", () => {
      expect(getStudentCodeError('521006666')).toBe('MSSV vượt quá 8 chữ số');
    });

    it("'5210066a' báo ký tự", () => {
      expect(getStudentCodeError('5210066a')).toBe('MSSV chỉ gồm chữ số');
    });

    it("' 52100666 ' hợp lệ sau trim", () => {
      expect(getStudentCodeError(' 52100666 ')).toBe('');
    });
  });

  describe('getPasswordError', () => {
    it("mật khẩu 'Password123@' hợp lệ", () => {
      expect(getPasswordError('Password123@')).toBe('');
    });

    it("'password' báo lỗi", () => {
      const err = getPasswordError('password');
      expect(err).not.toBe('');
      expect(err).toContain('Mật khẩu thiếu');
    });

    it("'Password123' báo thiếu ký tự đặc biệt", () => {
      const err = getPasswordError('Password123');
      expect(err).toContain('ký tự đặc biệt');
    });

    it("'Pass1@' báo thiếu độ dài", () => {
      const err = getPasswordError('Pass1@');
      expect(err).toContain('độ dài');
    });
  });
});

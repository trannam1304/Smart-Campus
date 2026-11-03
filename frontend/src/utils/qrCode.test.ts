import { describe, it, expect } from 'vitest';
import { buildMemberQrCode, parseMemberQrCode } from './qrCode';

describe('qrCode utils', () => {
  describe('buildMemberQrCode', () => {
    it('tạo chuỗi mã QR theo đúng định dạng SMART-CAMPUS-<bookingId>-<studentCode>', () => {
      const code = buildMemberQrCode('BK-8901', '52100888');
      expect(code).toBe('SMART-CAMPUS-BK-8901-52100888');
    });

    it('loại bỏ khoảng trắng thừa ở đầu/cuối của bookingId và studentCode', () => {
      const code = buildMemberQrCode('  BK-1234  ', '  52100666  ');
      expect(code).toBe('SMART-CAMPUS-BK-1234-52100666');
    });
  });

  describe('parseMemberQrCode', () => {
    it('phân tích thành công mã hợp lệ với mã phòng BK-xxxx và MSSV 8 chữ số', () => {
      const parsed = parseMemberQrCode('SMART-CAMPUS-BK-8901-52100888');
      expect(parsed).toEqual({
        bookingId: 'BK-8901',
        studentCode: '52100888',
      });
    });

    it('chấp nhận mã có khoảng trắng bao quanh sau khi trim', () => {
      const parsed = parseMemberQrCode('  SMART-CAMPUS-BK-9999-52100123  ');
      expect(parsed).toEqual({
        bookingId: 'BK-9999',
        studentCode: '52100123',
      });
    });

    it('trả về null nếu mã cũ dạng SMART-CAMPUS-BK-8901 (không có MSSV)', () => {
      expect(parseMemberQrCode('SMART-CAMPUS-BK-8901')).toBeNull();
    });

    it('trả về null nếu thiếu MSSV hoặc sai dấu gạch nối', () => {
      expect(parseMemberQrCode('SMART-CAMPUS-BK-8901-')).toBeNull();
      expect(parseMemberQrCode('SMART-CAMPUS-BK-8901_52100888')).toBeNull();
    });

    it('trả về null nếu sai tiền tố', () => {
      expect(parseMemberQrCode('CAMPUS-BK-8901-52100888')).toBeNull();
      expect(parseMemberQrCode('OTHER-CAMPUS-BK-8901-52100888')).toBeNull();
      expect(parseMemberQrCode('SMART_CAMPUS-BK-8901-52100888')).toBeNull();
    });

    it('trả về null nếu MSSV không đúng 8 chữ số (7 hoặc 9 chữ số)', () => {
      // 7 chữ số
      expect(parseMemberQrCode('SMART-CAMPUS-BK-8901-5210088')).toBeNull();
      // 9 chữ số
      expect(parseMemberQrCode('SMART-CAMPUS-BK-8901-521008889')).toBeNull();
      // Chứa chữ cái trong MSSV
      expect(parseMemberQrCode('SMART-CAMPUS-BK-8901-5210088A')).toBeNull();
    });

    it('trả về null nếu mã booking không có tiền tố BK-', () => {
      expect(parseMemberQrCode('SMART-CAMPUS-8901-52100888')).toBeNull();
      expect(parseMemberQrCode('SMART-CAMPUS-ROOM-102-52100888')).toBeNull();
    });

    it('trả về null khi truyền chuỗi rỗng, null, undefined hoặc kiểu dữ liệu khác', () => {
      expect(parseMemberQrCode('')).toBeNull();
      expect(parseMemberQrCode('   ')).toBeNull();
      expect(parseMemberQrCode(null as unknown as string)).toBeNull();
      expect(parseMemberQrCode(undefined as unknown as string)).toBeNull();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { parseStudentCodes } from './studentCodeParser';

describe('studentCodeParser - parseStudentCodes', () => {
  it('tách đúng MSSV theo dấu cách, phẩy, chấm phẩy và xuống dòng', () => {
    const raw = '52100111, 52100222; 52100333\n52100444\r\n52100555   52100666';
    const result = parseStudentCodes(raw);

    expect(result.acceptedCodes).toEqual([
      '52100111',
      '52100222',
      '52100333',
      '52100444',
      '52100555',
      '52100666',
    ]);
    expect(result.totalSkipped).toBe(0);
  });

  it('bỏ qua MSSV của người đặt phòng', () => {
    const raw = '52100888, 52100111, 52100222';
    const result = parseStudentCodes(raw, { bookerCode: '52100888' });

    expect(result.acceptedCodes).toEqual(['52100111', '52100222']);
    expect(result.bookerSkippedCount).toBe(1);
    expect(result.skippedCodes).toContain('52100888');
  });

  it('bỏ qua MSSV trùng lặp trong nội dung dán', () => {
    const raw = '52100111, 52100222, 52100111, 52100333, 52100222';
    const result = parseStudentCodes(raw);

    expect(result.acceptedCodes).toEqual(['52100111', '52100222', '52100333']);
    expect(result.duplicateSkippedCount).toBe(2);
    expect(result.totalSkipped).toBe(2);
  });

  it('bỏ qua MSSV đã tồn tại trong danh sách existingCodes', () => {
    const raw = '52100111, 52100222, 52100333';
    const result = parseStudentCodes(raw, {
      existingCodes: ['52100111', '52100999'],
    });

    expect(result.acceptedCodes).toEqual(['52100222', '52100333']);
    expect(result.duplicateSkippedCount).toBe(1);
  });

  it('bỏ qua các mã không đúng định dạng 8 chữ số', () => {
    const raw = '52100111, 12345, 5210022a, 52100333, 521004449';
    const result = parseStudentCodes(raw);

    expect(result.acceptedCodes).toEqual(['52100111', '52100333']);
    expect(result.invalidSkippedCount).toBe(3);
    expect(result.skippedCodes).toEqual(['12345', '5210022a', '521004449']);
  });

  it('giới hạn số lượng nhận khi truyền maxSlots', () => {
    const raw = '52100111, 52100222, 52100333, 52100444';
    const result = parseStudentCodes(raw, { maxSlots: 2 });

    expect(result.acceptedCodes).toEqual(['52100111', '52100222']);
    expect(result.overflowSkippedCount).toBe(2);
    expect(result.totalSkipped).toBe(2);
  });

  it('xử lý chuỗi rỗng hoặc chỉ có khoảng trắng an toàn', () => {
    expect(parseStudentCodes('').acceptedCodes).toEqual([]);
    expect(parseStudentCodes('   \n\t  ').totalSkipped).toBe(0);
  });
});

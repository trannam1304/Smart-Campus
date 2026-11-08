/**
 * Tiện ích tách và phân tích danh sách mã số sinh viên (MSSV).
 * Hỗ trợ phân tách theo dấu cách, phẩy, chấm phẩy hoặc xuống dòng.
 * Tự động loại bỏ MSSV của người đặt, các mã trùng lặp và các mã không đúng 8 chữ số.
 */
import { getStudentCodeError } from './validators';

export interface ParseStudentCodesOptions {
  bookerCode?: string;
  existingCodes?: string[];
  maxSlots?: number;
}

export interface ParseStudentCodesResult {
  acceptedCodes: string[];
  skippedCodes: string[];
  bookerSkippedCount: number;
  duplicateSkippedCount: number;
  invalidSkippedCount: number;
  overflowSkippedCount: number;
  totalSkipped: number;
}

export const parseStudentCodes = (
  rawText: string,
  options: ParseStudentCodesOptions = {}
): ParseStudentCodesResult => {
  const { bookerCode = '', existingCodes = [], maxSlots } = options;

  const trimmedBooker = bookerCode.trim();
  const normalizedExisting = new Set(
    existingCodes
      .map((c) => (c || '').trim())
      .filter((c) => c.length > 0)
  );

  // Tách theo dấu cách, phẩy, chấm phẩy hoặc xuống dòng (\r, \n, \t)
  const tokens = rawText
    .split(/[\s,;\n\r\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const acceptedCodes: string[] = [];
  const skippedCodes: string[] = [];
  const seenInPaste = new Set<string>();

  let bookerSkippedCount = 0;
  let duplicateSkippedCount = 0;
  let invalidSkippedCount = 0;
  let overflowSkippedCount = 0;

  for (const token of tokens) {
    // 1. Kiểm tra định dạng chuẩn: 8 chữ số
    if (getStudentCodeError(token) !== '') {
      skippedCodes.push(token);
      invalidSkippedCount++;
      continue;
    }

    // 2. Bỏ qua MSSV của người đặt
    if (trimmedBooker && token === trimmedBooker) {
      skippedCodes.push(token);
      bookerSkippedCount++;
      continue;
    }

    // 3. Bỏ qua MSSV trùng (đã có trong danh sách hiện tại hoặc trùng lặp trong chuỗi vừa dán)
    if (normalizedExisting.has(token) || seenInPaste.has(token)) {
      skippedCodes.push(token);
      duplicateSkippedCount++;
      continue;
    }

    // 4. Nếu giới hạn số ô trống (maxSlots) và đã đầy
    if (typeof maxSlots === 'number' && acceptedCodes.length >= maxSlots) {
      skippedCodes.push(token);
      overflowSkippedCount++;
      continue;
    }

    seenInPaste.add(token);
    acceptedCodes.push(token);
  }

  return {
    acceptedCodes,
    skippedCodes,
    bookerSkippedCount,
    duplicateSkippedCount,
    invalidSkippedCount,
    overflowSkippedCount,
    totalSkipped: skippedCodes.length,
  };
};

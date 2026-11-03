// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageFile,
  formatFileSize,
  truncateFileName,
  compressImageToDataUrl,
  MAX_IMAGE_SIZE_BYTES,
} from './imageUtils';

describe('imageUtils', () => {
  describe('validateImageFile', () => {
    it('chấp nhận file ảnh hợp lệ (JPG, PNG, WebP) dưới hoặc bằng 5 MB', () => {
      const jpgFile = new File(['dummy-content'], 'test.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(jpgFile)).toEqual({ valid: true });

      const pngFile = new File(['dummy-content'], 'photo.png', { type: 'image/png' });
      expect(validateImageFile(pngFile)).toEqual({ valid: true });

      const webpFile = new File(['dummy-content'], 'photo.webp', { type: 'image/webp' });
      expect(validateImageFile(webpFile)).toEqual({ valid: true });
    });

    it('từ chối file không phải ảnh (PDF, DOCX, TXT) với thông báo phù hợp', () => {
      const pdfFile = new File(['dummy-pdf'], 'document.pdf', { type: 'application/pdf' });
      const result = validateImageFile(pdfFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Chỉ nhận file ảnh (JPG, PNG, WebP).');

      const txtFile = new File(['hello'], 'note.txt', { type: 'text/plain' });
      expect(validateImageFile(txtFile).valid).toBe(false);
    });

    it('từ chối file vượt quá 5 MB và hiển thị dung lượng cụ thể trong thông báo', () => {
      // Giả lập file 6 MB (6 * 1024 * 1024 bytes)
      const bigFile = new File([''], 'big-photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });

      const result = validateImageFile(bigFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ảnh 6.0 MB vượt quá giới hạn 5 MB. Vui lòng chọn ảnh nhỏ hơn.');

      // Giả lập file 5.3 MB
      const file5_3Mb = new File([''], 'photo.png', { type: 'image/png' });
      Object.defineProperty(file5_3Mb, 'size', { value: 5.3 * 1024 * 1024 });
      const res5_3 = validateImageFile(file5_3Mb);
      expect(res5_3.valid).toBe(false);
      expect(res5_3.error).toBe('Ảnh 5.3 MB vượt quá giới hạn 5 MB. Vui lòng chọn ảnh nhỏ hơn.');
    });
  });

  describe('formatFileSize', () => {
    it('định dạng đúng cho dung lượng dưới 1 MB (KB) và trên 1 MB (MB)', () => {
      expect(formatFileSize(500 * 1024)).toBe('500 KB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(4.8 * 1024 * 1024)).toBe('4.8 MB');
    });
  });

  describe('truncateFileName', () => {
    it('giữ nguyên tên file ngắn và rút gọn tên file dài kèm phần mở rộng', () => {
      expect(truncateFileName('photo.jpg')).toBe('photo.jpg');

      const longName = 'hien_truong_phong_hoc_thuyet_trinh_hong_may_chieu.jpg';
      const truncated = truncateFileName(longName, 25);
      expect(truncated.length).toBeLessThanOrEqual(25);
      expect(truncated.endsWith('.jpg')).toBe(true);
      expect(truncated).toContain('...');
    });
  });

  describe('compressImageToDataUrl', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('nén ảnh qua FileReader và Canvas trả về Data URL', async () => {
      const mockDataUrl = 'data:image/jpeg;base64,mocked-compressed-image';

      // Mock FileReader
      class MockFileReader {
        result: string | ArrayBuffer | null = null;
        onload: ((e: any) => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        readAsDataURL() {
          this.result = 'data:image/png;base64,mock-source';
          setTimeout(() => {
            if (this.onload) this.onload({ target: { result: this.result } });
          }, 0);
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);

      // Mock Image
      class MockImage {
        width = 2000;
        height = 1000;
        src = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      vi.stubGlobal('Image', MockImage);

      // Mock Canvas
      const mockDrawImage = vi.fn();
      const mockGetContext = vi.fn(() => ({
        drawImage: mockDrawImage,
      }));
      const mockToDataURL = vi.fn(() => mockDataUrl);

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: mockGetContext,
            toDataURL: mockToDataURL,
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      });

      const file = new File(['sample'], 'photo.png', { type: 'image/png' });
      const result = await compressImageToDataUrl(file, 1024, 0.7);

      expect(result).toBe(mockDataUrl);
      expect(mockDrawImage).toHaveBeenCalled();
      expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.7);

      vi.unstubAllGlobals();
    });
  });
});

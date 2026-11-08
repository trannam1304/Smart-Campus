export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Kiểm tra file ảnh:
 * - Chỉ nhận file có MIME type bắt đầu bằng "image/" (JPG, PNG, WebP, HEIC...)
 * - Dung lượng tối đa 5 MB
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!file.type || !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Chỉ nhận file ảnh (JPG, PNG, WebP).',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ảnh ${sizeMb} MB vượt quá giới hạn 5 MB. Vui lòng chọn ảnh nhỏ hơn.`,
    };
  }

  return { valid: true };
};

/**
 * Định dạng dung lượng file để hiển thị người dùng
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Rút gọn tên file nếu quá dài mà vẫn giữ phần mở rộng
 */
export const truncateFileName = (name: string, maxLength = 25): string => {
  if (name.length <= maxLength) return name;
  const extIndex = name.lastIndexOf('.');
  if (extIndex > 0 && name.length - extIndex <= 6) {
    const ext = name.slice(extIndex);
    const base = name.slice(0, extIndex);
    const keepChars = maxLength - ext.length - 3;
    if (keepChars > 0) {
      return `${base.slice(0, keepChars)}...${ext}`;
    }
  }
  return `${name.slice(0, maxLength - 3)}...`;
};

/**
 * Nén ảnh bằng Canvas trước khi lưu vào mockStore (tránh tràn 5 MB của localStorage):
 * - Cạnh dài tối đa maxDimension (mặc định 1024px)
 * - JPEG quality (mặc định 0.7)
 * - Trả về Data URL dạng base64
 */
export const compressImageToDataUrl = (
  file: File,
  maxDimension = 1024,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Môi trường không hỗ trợ Canvas xử lý hình ảnh.'));
    }

    const timer = setTimeout(() => {
      reject(new Error('Hết thời gian xử lý hình ảnh qua Canvas.'));
    }, 3000);

    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        clearTimeout(timer);
        return reject(new Error('Không thể đọc dữ liệu file ảnh.'));
      }

      const img = new Image();

      img.onload = () => {
        clearTimeout(timer);
        try {
          let width = img.width || maxDimension;
          let height = img.height || maxDimension;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Không thể khởi tạo Canvas 2D context.'));
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(new Error(`Lỗi nén ảnh qua Canvas: ${err instanceof Error ? err.message : String(err)}`));
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Trình duyệt không thể giải mã hình ảnh này. Vui lòng thử ảnh JPG/PNG khác.'));
      };

      img.src = src;
    };

    reader.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Lỗi khi đọc file ảnh từ thiết bị.'));
    };

    reader.readAsDataURL(file);
  });
};

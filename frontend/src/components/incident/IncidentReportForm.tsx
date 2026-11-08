import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Toast } from '../ui/Toast';
import { createIncidentApi } from '../../api/incidentApi';
import { getErrorMessage } from '../../api/errorMessages';
import { Loader2, Camera, Upload, AlertCircle } from 'lucide-react';
import { RoomDevice } from '../../types/booking';
import {
  validateImageFile,
  formatFileSize,
  truncateFileName,
} from '../../utils/imageUtils';

export interface IncidentReportFormProps {
  initialRoomId?: string;
  onSuccess?: (incidentId: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({
  initialRoomId = '',
  onSuccess,
  onCancel,
  submitLabel = 'Gửi Phản Ánh',
}) => {
  const { floors } = useBooking();
  const allRooms = useMemo(() => floors.flatMap((f) => f.rooms), [floors]);

  // Xác định ID phòng hợp lệ (nếu initialRoomId là roomCode thì tìm ID tương ứng)
  const resolvedInitialRoomId = useMemo(() => {
    if (!initialRoomId) return '';
    const found = allRooms.find((r) => r.id === initialRoomId || r.roomCode === initialRoomId);
    return found ? found.id : initialRoomId;
  }, [initialRoomId, allRooms]);

  const [selectedRoomId, setSelectedRoomId] = useState(resolvedInitialRoomId);

  useEffect(() => {
    if (resolvedInitialRoomId) {
      setSelectedRoomId(resolvedInitialRoomId);
    }
  }, [resolvedInitialRoomId]);

  const selectedRoom = useMemo(
    () => (selectedRoomId ? allRooms.find((r) => r.id === selectedRoomId) || null : null),
    [allRooms, selectedRoomId]
  );

  const devices = useMemo(() => selectedRoom?.devices || [], [selectedRoom]);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [description, setDescription] = useState('');

  // ─── State ảnh đính kèm ─────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string>('');

  previewUrlRef.current = previewUrl;

  // Thu hồi ObjectURL khi unmount tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoomId(e.target.value);
    setSelectedDeviceId('');
  };

  const getDeviceOptionLabel = (device: RoomDevice) => {
    if (device.status !== 'GOOD') {
      return `${device.name} (đang hỏng)`;
    }
    return device.name;
  };

  const clearImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    setPreviewUrl('');
    setImageFile(null);
    setImageError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value của input để có thể chọn lại cùng một file
    e.target.value = '';

    const validation = validateImageFile(file);
    if (!validation.valid) {
      clearImage();
      setImageError(validation.error || 'File không hợp lệ');
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageFile(file);
    setImageError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Chống gửi hai lần

    if (!selectedRoomId) {
      setToastType('error');
      setToastMessage('Vui lòng chọn phòng bị sự cố.');
      return;
    }

    if (!selectedDeviceId) {
      setToastType('error');
      setToastMessage('Vui lòng chọn thiết bị gặp sự cố.');
      return;
    }

    if (!description.trim()) {
      setToastType('error');
      setToastMessage('Vui lòng nhập mô tả lỗi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createIncidentApi({
        roomId: selectedRoomId,
        equipmentId: selectedDeviceId,
        description: description.trim(),
        imageFile: imageFile || undefined,
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.message || 'Gửi báo cáo sự cố thành công!');
        setDescription('');
        clearImage();
        setSelectedDeviceId('');
        // Giữ phòng đã chọn (selectedRoomId không bị reset)
        onSuccess?.(res.data?.incidentId || '');
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="incident-room-select"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Chọn Phòng Học Gặp Sự Cố
          </label>
          <select
            id="incident-room-select"
            value={selectedRoomId}
            onChange={handleRoomChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="">-- Chọn một phòng --</option>
            {allRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Phòng {r.roomCode} ({r.floorCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="incident-device-select"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Thiết Bị Hỏng Hóc
          </label>
          <select
            id="incident-device-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={!selectedRoomId || devices.length === 0}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 bg-white"
          >
            <option value="">-- Chọn thiết bị --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {getDeviceOptionLabel(d)}
              </option>
            ))}
          </select>
          {selectedRoomId && devices.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1">Phòng này không có thiết bị nào được ghi nhận.</p>
          )}
        </div>

        <div>
          <label
            htmlFor="incident-description"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Mô Tả Hiện Trượng Lỗi
          </label>
          <textarea
            id="incident-description"
            rows={4}
            placeholder="Mô tả sự cố gặp phải..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* ─── Khu vực Đính kèm / Chụp ảnh ─── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Ảnh Minh Họa Sự Cố (Tùy chọn)
          </label>
          <p className="text-[11px] text-slate-500 mb-2.5">
            Đính kèm ảnh hiện trường giúp kỹ thuật viên nắm rõ tình trạng (tối đa 5 MB).
          </p>

          {/* Input camera ẩn: trên mobile mở thẳng camera sau */}
          <input
            id="incident-camera-input"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Tệp ảnh chụp từ camera"
          />

          {/* Input file ẩn: chọn từ thư viện / máy tính */}
          <input
            id="incident-gallery-input"
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Tệp ảnh chọn từ máy"
          />

          {!imageFile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                aria-label="Chụp ảnh sự cố"
                className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Chụp ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                aria-label="Chọn ảnh từ máy"
                className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Upload className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Chọn ảnh từ máy</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70">
              <img
                src={previewUrl}
                alt={`Xem trước ảnh sự cố: ${imageFile.name}`}
                className="w-24 h-24 max-w-[160px] object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-bold text-slate-800 truncate" title={imageFile.name}>
                  {truncateFileName(imageFile.name, 25)}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {formatFileSize(imageFile.size)}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    aria-label="Chụp lại ảnh"
                    className="py-1 px-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 min-h-[32px]"
                  >
                    Chụp lại
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    aria-label="Chọn lại ảnh từ máy"
                    className="py-1 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 min-h-[32px]"
                  >
                    Chọn lại
                  </button>
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Xóa ảnh đính kèm"
                    className="py-1 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 min-h-[32px]"
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            </div>
          )}

          {imageError && (
            <p className="text-[11px] font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{imageError}</span>
            </p>
          )}
        </div>

        {onCancel ? (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="py-3 px-5 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 min-h-[44px] rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Đang gửi...' : submitLabel}</span>
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 min-h-[44px] rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Đang gửi...' : submitLabel}</span>
          </button>
        )}
      </form>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </>
  );
};

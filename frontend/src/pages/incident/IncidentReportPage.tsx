import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Toast } from '../../components/ui/Toast';
import { useLocation } from 'react-router-dom';
import { createIncidentApi } from '../../api/incidentApi';
import { getErrorMessage } from '../../api/errorMessages';
import { Loader2 } from 'lucide-react';
import { RoomDevice } from '../../types/booking';

export const IncidentReportPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { roomId?: string; roomCode?: string } | null;

  const { floors } = useBooking();
  const allRooms = floors.flatMap(f => f.rooms);

  const [selectedRoomId, setSelectedRoomId] = useState(state?.roomId || '');
  const [devices, setDevices] = useState<RoomDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Load danh sách thiết bị khi chọn phòng
  useEffect(() => {
    if (selectedRoomId) {
      const room = allRooms.find(r => r.id === selectedRoomId);
      if (room) {
        setDevices(room.devices);
        setSelectedDeviceId(''); // Reset thiết bị
      }
    } else {
      setDevices([]);
      setSelectedDeviceId('');
    }
  }, [selectedRoomId, allRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        description,
        imageUrl: imageUrl.trim() || undefined
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.message || 'Gửi báo cáo sự cố thành công!');
        setDescription('');
        setImageUrl('');
        setSelectedDeviceId('');
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Báo Cáo Sự Cố Thiết Bị Hỏng</h1>
        <p className="text-xs text-slate-500 font-medium">
          Gửi thông tin phản ánh sự cố kỹ thuật để ban quản lý thư viện xử lý
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Chọn Phòng Học Gặp Sự Cố
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Thiết Bị Hỏng Hóc
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={!selectedRoomId || devices.length === 0}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">-- Chọn thiết bị --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {selectedRoomId && devices.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1">Phòng này không có thiết bị nào được ghi nhận.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Mô Tả Hiện Trượng Lỗi
          </label>
          <textarea
            rows={4}
            placeholder="Mô tả sự cố gặp phải..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            URL Ảnh Minh Họa (Tùy chọn)
          </label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isLoading ? 'Đang gửi...' : 'Gửi Phản Ánh'}</span>
        </button>
      </form>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { IncidentReportForm } from '../../components/incident/IncidentReportForm';

export const IncidentReportPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { roomId?: string; roomCode?: string } | null;

  const { floors } = useBooking();
  const allRooms = useMemo(() => floors.flatMap((f) => f.rooms), [floors]);

  // Xác định phòng ban đầu từ state nếu có
  const initialRoomId = useMemo(() => {
    if (state?.roomId) return state.roomId;
    if (state?.roomCode) {
      const found = allRooms.find((r) => r.roomCode === state.roomCode);
      if (found) return found.id;
    }
    return '';
  }, [state, allRooms]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Báo Cáo Sự Cố Thiết Bị Hỏng</h1>
        <p className="text-xs text-slate-500 font-medium">
          Gửi thông tin phản ánh sự cố kỹ thuật để ban quản lý thư viện xử lý
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <IncidentReportForm initialRoomId={initialRoomId} />
      </div>
    </div>
  );
};

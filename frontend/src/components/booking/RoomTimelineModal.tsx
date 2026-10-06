import React, { useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Room } from '../../types/booking';
import { RoomAvailabilityCalendar } from './RoomAvailabilityCalendar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSelectSlot?: (date: string, startTime: string) => void;
}

export const RoomTimelineModal: React.FC<Props> = ({ isOpen, onClose, room, onSelectSlot }) => {
  // Đóng bằng Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !room) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-gray-900/60 z-50 flex items-end md:items-center justify-center backdrop-blur-[2px]"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* ── Modal Shell ── */}
        <div
          className={[
            'bg-white flex flex-col overflow-hidden',
            // mobile: full-width bottom sheet; desktop: centered modal ~1000px
            'w-full max-h-[95vh] rounded-t-[20px]',
            'md:max-w-[1000px] md:rounded-2xl md:max-h-[90vh] md:mx-4 md:mb-auto shadow-2xl',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header ─────────────────────────────────────── */}
          <div className="px-5 py-4 border-b border-slate-200 shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[17px] font-black text-slate-900 leading-tight">
                    Lịch Bận — Phòng {room.roomCode}
                  </h2>
                  <p className="text-[12px] font-semibold text-slate-500">
                    {room.building} · {room.floorCode}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              💡 Bấm vào ô trống tương lai trên lịch để đặt phòng nhanh cho khung giờ đó.
            </p>
          </div>

          {/* ── Calendar Content ────────────────────────── */}
          <div className="flex-1 overflow-auto bg-slate-50 relative">
            <RoomAvailabilityCalendar 
              room={room} 
              onSelectSlot={(d, t) => {
                onClose(); // Đóng modal lịch
                if (onSelectSlot) onSelectSlot(d, t); // Bật form đặt phòng
              }} 
            />
          </div>

          {/* ── Footer legend ──────────────────────────────── */}
          <div className="px-5 py-3 border-t border-slate-200 flex items-center gap-6 shrink-0 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500 shadow-inner" />
              <span className="text-[12px] font-bold text-slate-600">Đã có người đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-400 shadow-inner" />
              <span className="text-[12px] font-bold text-slate-600">Bảo trì</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white border-2 border-slate-200 shadow-inner" />
              <span className="text-[12px] font-bold text-slate-600">Còn trống</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

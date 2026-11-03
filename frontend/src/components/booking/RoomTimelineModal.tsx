import React from 'react';
import { Room } from '../../types/booking';
import { RoomAvailabilityCalendar } from './RoomAvailabilityCalendar';
import { Modal } from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSelectSlot?: (date: string, startTime: string) => void;
}

export const RoomTimelineModal: React.FC<Props> = ({
  isOpen,
  onClose,
  room,
  onSelectSlot,
}) => {
  if (!isOpen || !room) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Lịch Bận — Phòng ${room.roomCode}`}
      subtitle={`${room.building} · ${room.floorCode}`}
      footer={
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-red-500 shadow-inner" />
            <span>Đã có người đặt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-amber-400 shadow-inner" />
            <span>Bảo trì</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-300 shadow-inner" />
            <span>Còn trống</span>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-[12px] text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          💡 Bấm vào ô trống tương lai trên lịch để đặt phòng nhanh cho khung giờ đó.
        </p>
        <div className="overflow-x-auto min-h-[420px]">
          <RoomAvailabilityCalendar
            room={room}
            onSelectSlot={(d, t) => {
              onClose();
              if (onSelectSlot) onSelectSlot(d, t);
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Room } from '../../types/booking';
import { Modal } from '../ui/Modal';
import { Calendar, Clock, Users, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { FLOOR_HOURS } from '../../config/bookingRules';
import { validateBookingForm } from '../../utils/bookingValidation';
import { createBookingApi, CreateBookingResponse } from '../../api/bookingApi';
import { getErrorMessage } from '../../api/errorMessages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { QRModal } from './QRModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  defaultDate?: string;
  defaultStartTime?: string;
  onSuccess: (booking: CreateBookingResponse) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, room, defaultDate, defaultStartTime, onSuccess }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<90 | 120>(90);
  const [people, setPeople] = useState<number>(1);
  const [purpose, setPurpose] = useState('');
  const [studentCodes, setStudentCodes] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time slots generation
  const generateTimeSlots = (floor: number) => {
    const hours = FLOOR_HOURS[floor] || { open: '07:30', close: '20:00' };
    const slots = [];
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    
    let currentH = openH;
    let currentM = openM;
    
    while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
      slots.push(`${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`);
      currentM += 30;
      if (currentM >= 60) {
        currentH++;
        currentM = 0;
      }
    }
    return slots;
  };

  const getEndTime = (start: string, dur: number) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const dateObj = new Date();
    dateObj.setHours(h, m + dur, 0, 0);
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isOpen && room && user) {
      const today = new Date().toISOString().split('T')[0];
      setDate(defaultDate || today);
      setStartTime(defaultStartTime || '07:30');
      setDuration(90);
      
      const minCap = Math.ceil(room.capacity * 0.5);
      setPeople(minCap);
      
      setPurpose('');
      setStudentCodes([user.studentCode || '', ...Array(Math.max(0, minCap - 1)).fill('')]);
      
      setErrors({});
      setApiError('');
    }
  }, [isOpen, room, defaultDate, defaultStartTime, user]);

  // Adjust studentCodes array when people count changes
  useEffect(() => {
    if (people > 0 && user) {
      setStudentCodes(prev => {
        const newCodes = [...prev];
        newCodes[0] = user.studentCode || ''; // First is always user
        if (newCodes.length < people) {
          return [...newCodes, ...Array(people - newCodes.length).fill('')];
        } else if (newCodes.length > people) {
          return newCodes.slice(0, people);
        }
        return newCodes;
      });
    }
  }, [people, user]);

  if (!room || !user) return null;

  const minCap = Math.ceil(room.capacity * 0.5);
  const timeSlots = generateTimeSlots(room.floor);
  const endTime = getEndTime(startTime, duration);
  
  const isUserBlocked = user.isLocked || user.libraryTrained === false;

  const validate = () => {
    const input = {
      start: startTime,
      end: endTime,
      purpose,
      participantsCount: people,
      participantIds: studentCodes
    };
    const errs = validateBookingForm(input, { capacity: room.capacity, floor: room.floor });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    if (isUserBlocked) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await createBookingApi({
        roomId: room.id,
        bookingDate: date,
        startTime,
        endTime,
        occupancy: people,
        purpose,
        memberStudentCodes: studentCodes
      });

      if (res.success && res.data) {
        toast.success('Đặt phòng thành công!');
        onSuccess(res.data);
        onClose();
      } else {
        const msg = getErrorMessage(res);
        setApiError(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      const msg = getErrorMessage(error);
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Đặt phòng ${room.roomCode} (${room.roomType})`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isUserBlocked && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {user.isLocked ? 'Tài khoản của bạn đã bị khóa do vi phạm nội quy.' : 'Bạn chưa hoàn thành khóa tập huấn thư viện, không thể đặt phòng.'}
            </span>
          </div>
        )}

        {apiError && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Ngày đặt phòng
          </label>
          <div className="relative">
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Giờ bắt đầu
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              required
            >
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Thời lượng
            </label>
            <div className="flex items-center gap-4 h-[42px]">
              <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                <input type="radio" name="duration" value={90} checked={duration === 90} onChange={() => setDuration(90)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                90 phút
              </label>
              <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                <input type="radio" name="duration" value={120} checked={duration === 120} onChange={() => setDuration(120)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                120 phút
              </label>
            </div>
          </div>
        </div>
        {errors.time && <p className="text-rose-500 text-xs font-medium">{errors.time}</p>}

        <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 p-2 rounded-lg">
          Giờ kết thúc dự kiến: <strong>{endTime}</strong>
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Số lượng người tham gia
          </label>
          <div className="relative">
            <input
              type="number"
              min={minCap}
              max={room.capacity}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <Users className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Phòng {room.capacity} chỗ: cần từ {minCap} đến {room.capacity} người.</p>
          {errors.participantsCount && <p className="text-rose-500 text-xs font-medium mt-1">{errors.participantsCount}</p>}
        </div>

        {room.capacity >= 2 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Danh sách MSSV
            </label>
            <div className="space-y-2">
              {studentCodes.map((code, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={idx === 0 ? "MSSV người đặt" : `MSSV người thứ ${idx + 1}`}
                  value={code}
                  onChange={(e) => {
                    const newCodes = [...studentCodes];
                    newCodes[idx] = e.target.value;
                    setStudentCodes(newCodes);
                  }}
                  disabled={idx === 0}
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${idx === 0 ? 'bg-slate-100 text-slate-500' : ''}`}
                  required
                />
              ))}
            </div>
            {errors.participantIds && <p className="text-rose-500 text-xs font-medium mt-1">{errors.participantIds}</p>}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Mục đích sử dụng phòng
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="VD: Học nhóm thuyết trình, nghiên cứu đồ án..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          {errors.purpose && <p className="text-rose-500 text-xs font-medium mt-1">{errors.purpose}</p>}
        </div>

        <div className="pt-3 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isUserBlocked || isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận đặt chỗ
          </button>
        </div>
      </form>
    </Modal>
  );
};

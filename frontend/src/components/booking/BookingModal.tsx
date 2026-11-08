import React, { useState, useEffect, useRef } from 'react';
import { Room } from '../../types/booking';
import { Modal } from '../ui/Modal';
import { Users, FileText, AlertCircle, Loader2, ClipboardPaste } from 'lucide-react';
import { FLOOR_HOURS } from '../../config/bookingRules';
import { validateBookingForm, minOccupancy } from '../../utils/bookingValidation';
import { createBookingApi, CreateBookingResponse } from '../../api/bookingApi';
import { getErrorMessage } from '../../api/errorMessages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { parseStudentCodes } from '../../utils/studentCodeParser';
import { getStudentCodeError } from '../../utils/validators';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  defaultDate?: string;
  defaultStartTime?: string;
  onSuccess: (booking: CreateBookingResponse) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  room,
  defaultDate,
  defaultStartTime,
  onSuccess,
}) => {
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

  // Trạng thái ô dán danh sách MSSV
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  const apiErrorRef = useRef<HTMLDivElement>(null);

  // Cuộn vào banner lỗi API khi có lỗi từ backend
  useEffect(() => {
    if (apiError && apiErrorRef.current) {
      apiErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [apiError]);

  // Sinh các khung giờ khả dụng cho tầng
  const generateTimeSlots = (floor: number) => {
    const hours = FLOOR_HOURS[floor] || { open: '07:30', close: '20:00' };
    const slots = [];
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);

    let currentH = openH;
    let currentM = openM;

    while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
      slots.push(
        `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`,
      );
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

      const minCap = minOccupancy(room.capacity);
      setPeople(minCap);

      setPurpose('');
      setStudentCodes([user.studentCode || '', ...Array(Math.max(0, minCap - 1)).fill('')]);

      setErrors({});
      setApiError('');
      setShowPasteArea(false);
      setPasteText('');
      setPasteFeedback(null);
    }
  }, [isOpen, room, defaultDate, defaultStartTime, user]);

  if (!room || !user) return null;

  const minCap = minOccupancy(room.capacity);
  const timeSlots = generateTimeSlots(room.floor);
  const endTime = getEndTime(startTime, duration);

  const isUserBlocked = user.isLocked || user.libraryTrained === false;

  const handleApplyPastedCodes = () => {
    if (!pasteText.trim()) return;

    // Tìm các vị trí ô trống (tính từ index 1 trở đi, vì index 0 là người đặt)
    const emptyIndices: number[] = [];
    studentCodes.forEach((code, idx) => {
      if (idx > 0 && !code.trim()) {
        emptyIndices.push(idx);
      }
    });

    if (emptyIndices.length === 0) {
      setPasteFeedback('Tất cả các ô MSSV đều đã có dữ liệu.');
      return;
    }

    // Danh sách MSSV hiện có trong form
    const existingInForm = studentCodes.map((s) => s.trim()).filter(Boolean);

    const result = parseStudentCodes(pasteText, {
      bookerCode: user.studentCode || '',
      existingCodes: existingInForm,
      maxSlots: emptyIndices.length,
    });

    if (result.acceptedCodes.length === 0) {
      const msg = `Không có MSSV hợp lệ mới để điền (đã bỏ qua ${result.totalSkipped} MSSV trùng hoặc sai định dạng).`;
      setPasteFeedback(msg);
      return;
    }

    const nextCodes = [...studentCodes];
    result.acceptedCodes.forEach((code, i) => {
      const slotIdx = emptyIndices[i];
      nextCodes[slotIdx] = code;
    });

    setStudentCodes(nextCodes);
    setPasteText('');
    setShowPasteArea(false);

    // Xóa lỗi của các ô vừa được điền
    setErrors((prev) => {
      const next = { ...prev };
      emptyIndices.forEach((idx) => {
        delete next[`participantId_${idx}`];
      });
      delete next.participantIds;
      return next;
    });

    const msg = `Đã nhận ${result.acceptedCodes.length} MSSV, bỏ qua ${result.totalSkipped} MSSV.`;
    setPasteFeedback(msg);
    toast.success(msg);
  };

  const validateAndScrollToFirstError = () => {
    const input = {
      start: startTime,
      end: endTime,
      purpose,
      participantsCount: Number(people),
      participantIds: studentCodes.map((s) => (s || '').trim()),
    };
    const errs = validateBookingForm(input, {
      capacity: room.capacity,
      floor: room.floor,
    });
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      let firstElId: string | null = null;
      if (errs.date) firstElId = 'booking-date';
      else if (errs.time) firstElId = 'booking-start-time';
      else if (errs.participantsCount) firstElId = 'booking-people';
      else {
        const participantErrIdx = studentCodes.findIndex((_, idx) => !!errs[`participantId_${idx}`]);
        if (participantErrIdx !== -1) {
          firstElId = `booking-participant-${participantErrIdx}`;
        } else if (errs.participantIds) {
          firstElId = 'booking-participant-1';
        } else if (errs.purpose) {
          firstElId = 'booking-purpose';
        }
      }

      if (firstElId) {
        const el = document.getElementById(firstElId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setApiError('');

    if (isUserBlocked) return;
    if (!validateAndScrollToFirstError()) return;

    setIsSubmitting(true);
    try {
      const res = await createBookingApi({
        roomId: room.id,
        bookingDate: date,
        startTime,
        endTime,
        occupancy: Number(people),
        purpose,
        memberStudentCodes: studentCodes.map((s) => (s || '').trim()),
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
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filledCount = studentCodes.filter((c) => (c || '').trim().length > 0).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={room.capacity >= 8 ? 'lg' : 'md'}
      title={`Đặt phòng ${room.roomCode} (${room.roomType})`}
      subtitle={`Sức chứa ${room.capacity} người • ${room.floorCode}`}
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="booking-form"
            onClick={handleSubmit}
            disabled={isUserBlocked || isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Xác nhận đặt phòng</span>
          </button>
        </div>
      }
    >
      <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Banner lỗi do tài khoản */}
        {isUserBlocked && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {user.isLocked
                ? 'Tài khoản của bạn đã bị khóa do vi phạm nội quy.'
                : 'Bạn chưa hoàn thành khóa tập huấn thư viện, không thể đặt phòng.'}
            </span>
          </div>
        )}

        {/* Banner lỗi API - tự động cuộn vào tầm nhìn */}
        {apiError && (
          <div
            ref={apiErrorRef}
            className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Ngày đặt phòng */}
        <div>
          <label htmlFor="booking-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Ngày đặt phòng
          </label>
          <input
            id="booking-date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.date;
                return next;
              });
            }}
            className="datetime-input w-full px-3.5 py-2.5 text-sm"
            required
          />
          {errors.date && (
            <p className="text-rose-500 text-xs font-medium mt-1">{errors.date}</p>
          )}
        </div>

        {/* Giờ bắt đầu và thời lượng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="booking-start-time" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Giờ bắt đầu
            </label>
            <select
              id="booking-start-time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.time;
                  return next;
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              required
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Thời lượng
            </label>
            <div className="flex items-center gap-4 h-[42px]">
              <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={90}
                  checked={duration === 90}
                  onChange={() => setDuration(90)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                90 phút
              </label>
              <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={120}
                  checked={duration === 120}
                  onChange={() => setDuration(120)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                120 phút
              </label>
            </div>
          </div>
        </div>
        {errors.time && (
          <p className="text-rose-500 text-xs font-medium">{errors.time}</p>
        )}

        <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 p-2 rounded-lg">
          Giờ kết thúc dự kiến: <strong>{endTime}</strong>
        </p>

        {/* Số lượng người tham gia */}
        <div>
          <label htmlFor="booking-people" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Số lượng người tham gia
          </label>
          <div className="relative">
            <input
              id="booking-people"
              type="number"
              min={minCap}
              max={room.capacity}
              value={people}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val)) {
                  setPeople('' as unknown as number);
                  setErrors((prev) => ({
                    ...prev,
                    participantsCount: `Vui lòng nhập số người từ ${minCap} đến ${room.capacity}.`,
                  }));
                  return;
                }
                setPeople(val);
                if (val < minCap || val > room.capacity) {
                  setErrors((prev) => ({
                    ...prev,
                    participantsCount: `Số người phải từ ${minCap} đến ${room.capacity} người.`,
                  }));
                } else {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.participantsCount;
                    return next;
                  });

                  // Cập nhật danh sách MSSV tương ứng với số người
                  setStudentCodes((prev) => {
                    const newCodes = [...prev];
                    newCodes[0] = user?.studentCode || '';
                    if (newCodes.length < val) {
                      return [...newCodes, ...Array(val - newCodes.length).fill('')];
                    } else {
                      return newCodes.slice(0, val);
                    }
                  });
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.participantsCount ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
              }`}
              required
            />
            <Users className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Sức chứa {room.capacity} người. Đăng ký từ {minCap} đến {room.capacity} người (tối thiểu 50% sức chứa).
          </p>
          {errors.participantsCount && (
            <p className="text-rose-500 text-xs font-medium mt-1">
              {errors.participantsCount}
            </p>
          )}
        </div>

        {/* Danh sách MSSV */}
        {room.capacity >= 2 && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Danh sách MSSV
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  (Đã nhập {filledCount}/{studentCodes.length} MSSV)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasteArea((prev) => !prev);
                  setPasteFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors self-start sm:self-auto"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{showPasteArea ? 'Đóng ô dán' : 'Dán danh sách MSSV'}</span>
              </button>
            </div>

            {/* Khung dán danh sách MSSV */}
            {showPasteArea && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Dán danh sách MSSV vào đây:</span>
                  <span className="text-[10px] text-slate-400">Cách nhau bởi dấu cách, phẩy, chấm phẩy hoặc xuống dòng</span>
                </div>
                <textarea
                  rows={3}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="VD: 52100123, 52100456; 52100789&#10;52100999"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {pasteFeedback ? (
                    <span className="text-[11px] font-semibold text-blue-700">
                      {pasteFeedback}
                    </span>
                  ) : <span />}
                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasteArea(false);
                        setPasteText('');
                        setPasteFeedback(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPastedCodes}
                      className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                      Điền vào các ô trống
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lưới các ô MSSV: ≥5 người thì 2 cột từ sm trở lên */}
            <div className={studentCodes.length >= 5 ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5' : 'space-y-2'}>
              {studentCodes.map((code, idx) => (
                <div key={idx} className="space-y-1">
                  <input
                    id={`booking-participant-${idx}`}
                    type="text"
                    inputMode="numeric"
                    placeholder={
                      idx === 0
                        ? `MSSV người đặt: ${user.studentCode || ''} (khóa)`
                        : `MSSV người thứ ${idx + 1}`
                    }
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newCodes = [...studentCodes];
                      newCodes[idx] = val;
                      setStudentCodes(newCodes);

                      const err = getStudentCodeError(val);
                      setErrors((prev) => {
                        const next = { ...prev };
                        if (!err) {
                          delete next[`participantId_${idx}`];
                          delete next.participantIds;
                        } else if (val.trim().length > 8 || /[^\d]/.test(val.trim())) {
                          next[`participantId_${idx}`] = err;
                        } else {
                          delete next[`participantId_${idx}`];
                        }
                        return next;
                      });
                    }}
                    onBlur={() => {
                      if (idx > 0) {
                        const err = getStudentCodeError(code);
                        if (err) {
                          setErrors((prev) => ({
                            ...prev,
                            [`participantId_${idx}`]: err,
                          }));
                        }
                      }
                    }}
                    disabled={idx === 0}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      idx === 0
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        : ''
                    } ${
                      errors[`participantId_${idx}`]
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200'
                    }`}
                    required
                  />
                  {errors[`participantId_${idx}`] && (
                    <p className="text-rose-500 text-xs font-medium">
                      {errors[`participantId_${idx}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {errors.participantIds && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.participantIds}
              </p>
            )}
          </div>
        )}

        {/* Mục đích sử dụng */}
        <div>
          <label htmlFor="booking-purpose" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Mục đích sử dụng phòng
          </label>
          <div className="relative">
            <textarea
              id="booking-purpose"
              rows={3}
              placeholder="VD: Học nhóm thuyết trình, nghiên cứu đồ án..."
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.purpose;
                  return next;
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          {errors.purpose && (
            <p className="text-rose-500 text-xs font-medium mt-1">{errors.purpose}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};

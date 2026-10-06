import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Room, Booking } from '../../types/booking';
import { getRoomBookingsRangeApi } from '../../api/roomApi';
import { getErrorMessage } from '../../api/errorMessages';
import { FLOOR_HOURS } from '../../config/bookingRules';
import { getRoomColor } from '../../utils/roomColors';
import { Loader2, AlertCircle } from 'lucide-react';

const locales = {
  'vi': vi,
};

// Cấu hình localizer với tiếng Việt, tuần bắt đầu vào thứ Hai
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: 'Cả ngày',
  previous: 'Trước',
  next: 'Tiếp',
  today: 'Hôm nay',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  agenda: 'Lịch trình',
  date: 'Ngày',
  time: 'Thời gian',
  event: 'Sự kiện',
  noEventsInRange: 'Không có lượt đặt phòng nào trong khoảng thời gian này.',
  showMore: (total: number) => `+ Xem thêm (${total})`
};

interface RoomAvailabilityCalendarProps {
  room: Room;
  onSelectSlot: (date: string, startTime: string) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  type: 'BOOKING' | 'MAINTENANCE';
}

export const RoomAvailabilityCalendar: React.FC<RoomAvailabilityCalendarProps> = ({ room, onSelectSlot }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<any>(window.innerWidth < 768 ? Views.DAY : Views.WEEK);

  const fetchBookings = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      
      const res = await getRoomBookingsRangeApi(room.id, startDateStr, endDateStr);
      if (res.success && res.data) {
        const calendarEvents: CalendarEvent[] = res.data.map((b: Booking) => {
          const [sh, sm] = b.startTime.split(':').map(Number);
          const [eh, em] = b.endTime.split(':').map(Number);
          
          const startDt = new Date(`${b.date}T00:00:00`);
          startDt.setHours(sh, sm, 0, 0);
          
          const endDt = new Date(`${b.date}T00:00:00`);
          endDt.setHours(eh, em, 0, 0);
          
          return {
            id: b.id,
            title: b.purpose || 'Đã đặt',
            start: startDt,
            end: endDt,
            resource: b,
            type: 'BOOKING'
          };
        });
        
        // Thêm event bảo trì nếu phòng đang bảo trì
        if (room.status === 'MAINTENANCE') {
          const mStart = startOfDay(start);
          const mEnd = startOfDay(addDays(end, 1));
          calendarEvents.push({
            id: 'maint',
            title: 'Phòng đang bảo trì',
            start: mStart,
            end: mEnd,
            resource: null,
            type: 'MAINTENANCE'
          });
        }
        
        setEvents(calendarEvents);
      } else {
        setError(getErrorMessage(res));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [room]);

  // Handle range change
  useEffect(() => {
    // Calculate range based on view
    let start = new Date(currentDate);
    let end = new Date(currentDate);
    
    if (view === Views.DAY) {
      start = startOfDay(currentDate);
      end = startOfDay(currentDate);
    } else if (view === Views.WEEK) {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = addDays(start, 6);
    } else if (view === Views.MONTH) {
      start = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      end = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    }
    
    // Add buffer
    start = addDays(start, -7);
    end = addDays(end, 7);
    
    fetchBookings(start, end);
  }, [currentDate, view, fetchBookings]);

  // Determine min/max time based on floor hours
  const { minTime, maxTime } = useMemo(() => {
    const floorHours = FLOOR_HOURS[room.floor] || { open: '07:00', close: '22:00' };
    const [oh, om] = floorHours.open.split(':').map(Number);
    const [ch, cm] = floorHours.close.split(':').map(Number);
    
    const min = new Date();
    min.setHours(oh, om, 0, 0);
    
    const max = new Date();
    max.setHours(ch, cm, 0, 0);
    
    return { minTime: min, maxTime: max };
  }, [room.floor]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const slotStart = slotInfo.start;
    const now = new Date();
    
    // Kiểm tra không cho chọn quá khứ
    if (isBefore(slotStart, now)) {
      return;
    }
    
    // Kiểm tra không cho chọn nếu phòng đang bảo trì
    if (room.status === 'MAINTENANCE') {
      return;
    }

    const dateStr = format(slotStart, 'yyyy-MM-dd');
    const startTimeStr = format(slotStart, 'HH:mm');
    
    onSelectSlot(dateStr, startTimeStr);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = getRoomColor('BOOKED').fill; // Red-ish
    let borderColor = getRoomColor('BOOKED').stroke;
    
    if (event.type === 'MAINTENANCE') {
      backgroundColor = getRoomColor('MAINTENANCE').fill;
      borderColor = getRoomColor('MAINTENANCE').stroke;
    }
    
    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-[600px] relative bg-white flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white/70 flex flex-col items-center justify-center text-blue-600 backdrop-blur-[2px]">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <span className="text-sm font-bold">Đang tải dữ liệu lịch...</span>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center text-rose-600">
          <AlertCircle className="w-12 h-12 mb-3" />
          <span className="text-sm font-bold px-4 text-center">{error}</span>
          <button 
            onClick={() => fetchBookings(addDays(currentDate, -7), addDays(currentDate, 7))} 
            className="mt-5 px-5 py-2 border-2 border-rose-200 rounded-xl bg-rose-50 text-sm font-bold hover:bg-rose-100 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}
      
      {/* Custom CSS to hide all-day section if we don't need it, and adjust styling */}
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-event { padding: 4px 6px; }
        .rbc-today { background-color: #f8fafc; }
        .rbc-time-view .rbc-today { background-color: #f8fafc; }
        .rbc-time-slot { min-height: 24px; }
        .rbc-allday-cell { display: none; }
        .rbc-time-view .rbc-allday-cell { display: none; }
        .rbc-time-header.rbc-overflowing { border-right: none; }
        .rbc-time-header-content > .rbc-row.rbc-row-resource { display: none; }
        .rbc-toolbar button { font-weight: 600; font-size: 13px; border-radius: 8px; }
        .rbc-toolbar button.rbc-active { background-color: #1e293b; color: white; border-color: #1e293b; }
      `}</style>
      
      <div className="flex-1 overflow-hidden p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.DAY, Views.WEEK, Views.MONTH]}
          view={view}
          date={currentDate}
          onView={(newView) => setView(newView)}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          messages={messages}
          step={30}
          timeslots={1}
          min={minTime}
          max={maxTime}
          selectable={room.status !== 'MAINTENANCE'}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          popup
        />
      </div>
    </div>
  );
};

import { Room, Booking, FloorData } from '../types/booking';
import { FLOOR_HOURS } from '../config/bookingRules';

/**
 * Chuyển đổi chuỗi "HH:mm" thành số phút trong ngày
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Tính số phút chênh lệch giữa 2 mốc thời gian "HH:mm"
 */
export const calculateDurationMinutes = (startTime: string, endTime: string): number => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return Math.max(0, end - start);
};

export interface FloorUtilizationItem {
  floorNumber: number;
  floorCode: string;
  floorDescription: string;
  totalRooms: number;
  totalBookedMinutes: number;
  totalOpenMinutes: number;
  percentage: number;
}

export interface RoomUtilizationItem {
  roomId: string;
  roomCode: string;
  roomType: string;
  floorNumber: number;
  floorCode: string;
  isMaintenance: boolean;
  totalBookedMinutes: number;
  totalOpenMinutes: number;
  percentage: number;
}

export interface HourlyBookingItem {
  time: string;
  hour: number;
  count: number;
}

export interface HourlyBookingsResult {
  hours: HourlyBookingItem[];
  peakHour: string;
  peakCount: number;
  maxCount: number;
}

export interface KPISummary {
  totalRooms: number;
  maintenanceRooms: number;
  availableRooms: number;
  activeBookingsToday: number;
  pendingApprovals: number;
  openIncidents: number;
  ongoingBookingsCount: number;
  currentUtilizationRate: number;
}

/**
 * Tính tỷ lệ lấp đầy theo tầng cho tất cả 6 tầng (G, 1-5)
 * Tỷ lệ = (tổng phút đã đặt trong ngày / (tổng phút mở cửa × số phòng của tầng)) × 100
 */
export const calculateFloorUtilization = (
  floors: FloorData[],
  rooms: Room[],
  bookings: Booking[],
  selectedDate: string,
  floorHoursConfig: Record<number, { open: string; close: string }> = FLOOR_HOURS
): FloorUtilizationItem[] => {
  const floorNumbers = [0, 1, 2, 3, 4, 5];

  return floorNumbers.map((floorNum) => {
    const floor = floors.find((f) => f.floorNumber === floorNum);
    const floorRooms = rooms.filter((r) => r.floor === floorNum);
    const totalRooms = floorRooms.length;

    // Giờ mở cửa theo cấu hình FLOOR_HOURS
    const hours = floorHoursConfig[floorNum] || { open: '07:30', close: '20:00' };
    const openMinutesPerRoom = calculateDurationMinutes(hours.open, hours.close);
    const totalOpenMinutes = openMinutesPerRoom * totalRooms;

    // Tổng số phút đã đặt trong ngày bởi các booking CONFIRMED hoặc IN_USE
    const dayBookings = bookings.filter(
      (b) =>
        b.floor === floorNum &&
        b.date === selectedDate &&
        (b.status === 'CONFIRMED' || b.status === 'IN_USE')
    );

    let totalBookedMinutes = 0;
    dayBookings.forEach((b) => {
      totalBookedMinutes += calculateDurationMinutes(b.startTime, b.endTime);
    });

    const rawPercent = totalOpenMinutes > 0 ? (totalBookedMinutes / totalOpenMinutes) * 100 : 0;
    const percentage = Math.min(100, Math.round(rawPercent * 10) / 10);

    const floorCode = floor?.floorCode || (floorNum === 0 ? 'G - Floor' : `${floorNum}th - Floor`);
    const floorDescription = floor?.description || `Tầng ${floorNum}`;

    return {
      floorNumber: floorNum,
      floorCode,
      floorDescription,
      totalRooms,
      totalBookedMinutes,
      totalOpenMinutes,
      percentage,
    };
  });
};

/**
 * Tính tỷ lệ sử dụng của từng phòng cho ngày được chọn
 * Tỉ lệ = số phút phòng được đặt trong ngày / số phút mở cửa của tầng đó
 */
export const calculateRoomUtilization = (
  rooms: Room[],
  bookings: Booking[],
  selectedDate: string,
  floorHoursConfig: Record<number, { open: string; close: string }> = FLOOR_HOURS
): RoomUtilizationItem[] => {
  const items: RoomUtilizationItem[] = rooms.map((room) => {
    const isMaintenance = Boolean(room.maintenance || room.status === 'MAINTENANCE');

    // Giờ mở cửa của tầng theo cấu hình (mặc định 07:30–20:00)
    const hours = floorHoursConfig[room.floor] || { open: '07:30', close: '20:00' };
    const totalOpenMinutes = calculateDurationMinutes(hours.open, hours.close);

    // Chỉ tính booking CONFIRMED hoặc IN_USE đúng selectedDate và đúng phòng (khớp theo roomId hoặc roomCode)
    const roomBookings = bookings.filter(
      (b) =>
        (b.roomId === room.id || b.roomCode === room.roomCode) &&
        b.date === selectedDate &&
        (b.status === 'CONFIRMED' || b.status === 'IN_USE')
    );

    let totalBookedMinutes = 0;
    roomBookings.forEach((b) => {
      totalBookedMinutes += calculateDurationMinutes(b.startTime, b.endTime);
    });

    const rawPercent = totalOpenMinutes > 0 ? (totalBookedMinutes / totalOpenMinutes) * 100 : 0;
    const percentage = Math.min(100, Math.round(rawPercent * 10) / 10);

    const floorCode = room.floorCode || (room.floor === 0 ? 'G - Floor' : `${room.floor}th - Floor`);

    return {
      roomId: room.id,
      roomCode: room.roomCode,
      roomType: room.roomType,
      floorNumber: room.floor,
      floorCode,
      isMaintenance,
      totalBookedMinutes,
      totalOpenMinutes,
      percentage,
    };
  });

  // Sắp xếp: phòng không bảo trì theo percentage giảm dần (bằng nhau thì theo roomCode tăng dần), phòng bảo trì xếp cuối.
  return items.sort((a, b) => {
    if (a.isMaintenance !== b.isMaintenance) {
      return a.isMaintenance ? 1 : -1;
    }
    if (!a.isMaintenance && !b.isMaintenance) {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return a.roomCode.localeCompare(b.roomCode);
    }
    return a.roomCode.localeCompare(b.roomCode);
  });
};

/**
 * Tính số lượt đặt theo từng khung giờ (07:00 - 20:00) cho ngày được chọn
 */
export const calculateHourlyBookings = (
  bookings: Booking[],
  selectedDate: string,
  startHour = 7,
  endHour = 20
): HourlyBookingsResult => {
  const dayBookings = bookings.filter(
    (b) =>
      b.date === selectedDate &&
      (b.status === 'CONFIRMED' || b.status === 'IN_USE')
  );

  const hours: HourlyBookingItem[] = [];
  let peakHour = '07:00';
  let peakCount = 0;

  for (let h = startHour; h <= endHour; h++) {
    const timeStr = `${String(h).padStart(2, '0')}:00`;
    const nextHourStr = `${String(h + 1).padStart(2, '0')}:00`;

    // Một booking giao với khung giờ [h:00, (h+1):00] nếu startTime < nextHour và endTime > thisHour
    const count = dayBookings.filter(
      (b) => b.startTime < nextHourStr && b.endTime > timeStr
    ).length;

    hours.push({
      time: timeStr,
      hour: h,
      count,
    });

    if (count > peakCount) {
      peakCount = count;
      peakHour = timeStr;
    }
  }

  const counts = hours.map((item) => item.count);
  const maxCount = Math.max(5, ...counts);

  return {
    hours,
    peakHour,
    peakCount,
    maxCount,
  };
};

/**
 * Tính toán các chỉ số KPI theo thời gian thực từ store
 */
export const calculateKPISummary = (
  rooms: Room[],
  bookings: Booking[],
  incidents: any[],
  selectedDate: string,
  currentTime?: string
): KPISummary => {
  const totalRooms = rooms.length;
  const maintenanceRooms = rooms.filter((r) => r.maintenance || r.status === 'MAINTENANCE').length;
  const availableRooms = Math.max(0, totalRooms - maintenanceRooms);

  // Lượt đặt đang hoạt động trong ngày được chọn (CONFIRMED hoặc IN_USE)
  const activeBookingsToday = bookings.filter(
    (b) =>
      b.date === selectedDate &&
      (b.status === 'CONFIRMED' || b.status === 'IN_USE')
  ).length;

  // Đơn chờ duyệt toàn hệ thống
  const pendingApprovals = bookings.filter((b) => b.status === 'PENDING_APPROVAL').length;

  // Sự cố đang mở
  const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;

  // Xác định thời điểm hiện tại để tính lượt đặt đang diễn ra
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const nowTimeStr =
    currentTime ||
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const isToday = selectedDate === todayStr;

  // Lượt đặt đang diễn ra tại thời điểm xem
  const ongoingBookings = bookings.filter((b) => {
    if (b.date !== selectedDate) return false;
    if (b.status !== 'CONFIRMED' && b.status !== 'IN_USE') return false;
    if (isToday) {
      return nowTimeStr >= b.startTime && nowTimeStr < b.endTime;
    }
    return true;
  });

  const distinctRoomIds = new Set(ongoingBookings.map((b) => b.roomId || b.roomCode));
  const ongoingBookingsCount = distinctRoomIds.size;

  const currentUtilizationRate =
    availableRooms > 0 ? Math.round((ongoingBookingsCount / availableRooms) * 100) : 0;

  return {
    totalRooms,
    maintenanceRooms,
    availableRooms,
    activeBookingsToday,
    pendingApprovals,
    openIncidents,
    ongoingBookingsCount,
    currentUtilizationRate,
  };
};

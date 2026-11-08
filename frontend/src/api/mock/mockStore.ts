import { Room, Booking, FloorData, RoomStatus, RegistrationRequest, BookingStatus, BookingMember } from '../../types/booking';
import { mockExactRooms, mockInitialFloors, mockIncidents, mockRegistrations } from './mockData';
import { buildMemberQrCode } from '../../utils/qrCode';

export const STORE_STORAGE_KEY = 'smart_campus_mock_store_v1';
export const STORE_VERSION = 5;

export interface MockStoreState {
  rooms: Room[];
  floors: FloorData[];
  bookings: Booking[];
  incidents: any[];
  registrations: RegistrationRequest[];
}

export const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Get the currently logged-in user from localStorage, if any */
export const getCurrentMockUser = (): {
  id: string;
  fullName: string;
  studentCode?: string;
  staffCode?: string;
  email: string;
  role: string;
} | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    return null;
  }
  return null;
};

/** Check if a booking is considered upcoming relative to current date and time */
export const isUpcomingBooking = (booking: Booking): boolean => {
  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING_APPROVAL') {
    return false;
  }
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (booking.date > todayStr) return true;
  if (booking.date < todayStr) return false;

  // Same day: compare endTime vs current time (HH:mm)
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHH}:${currentMM}`;
  return booking.endTime > currentTimeStr;
};

/**
 * Trạng thái phòng theo thời điểm (hàm dùng chung getRoomStatusAt):
 * - MAINTENANCE nếu room.maintenance
 * - BOOKED nếu có booking trạng thái CONFIRMED, IN_USE hoặc PENDING_APPROVAL giao với thời điểm đó
 * - Ngược lại AVAILABLE
 */
export const getRoomStatusAt = (
  room: Room,
  date?: string,
  time?: string,
  endTime?: string,
  bookingsList?: Booking[]
): RoomStatus => {
  if (room.maintenance) {
    return 'MAINTENANCE';
  }
  if (!date) {
    return room.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE';
  }

  const allBookings = bookingsList || mockStore.getState().bookings;

  const isBooked = allBookings.some((b) => {
    if (b.roomId !== room.id && b.roomCode !== room.roomCode) return false;
    if (b.date !== date) return false;
    if (b.status !== 'CONFIRMED' && b.status !== 'IN_USE' && b.status !== 'PENDING_APPROVAL') {
      return false;
    }

    if (time && endTime) {
      // Overlap of [time, endTime] with [b.startTime, b.endTime]
      return time < b.endTime && endTime > b.startTime;
    }
    if (time) {
      // Single time check: time is within [b.startTime, b.endTime)
      return time >= b.startTime && time < b.endTime;
    }
    // If only date is provided, any active booking marks it booked
    return true;
  });

  return isBooked ? 'BOOKED' : 'AVAILABLE';
};

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
};

const createSeedRooms = (): Room[] => {
  return mockExactRooms.map((r) => {
    const requiresApproval = r.roomCode === 'L.106' || r.roomCode === 'L.506';
    const isMaintenance = r.status === 'MAINTENANCE';
    return {
      ...r,
      maintenance: isMaintenance,
      maintenanceReason: isMaintenance ? 'Máy chiếu hỏng, chờ thay thế' : undefined,
      requiresApproval,
      status: isMaintenance ? 'MAINTENANCE' : ('AVAILABLE' as RoomStatus),
    };
  });
};

const createSeedMembers = (
  bookingId: string,
  ownerCode: string,
  ownerName: string,
  count: number,
  hasQr: boolean,
  checkedInCount = 0
): BookingMember[] => {
  const candidateStudents = [
    { code: '52100888', name: 'La Thái Thành' },
    { code: '52100666', name: 'Nguyễn Hoàng Nam' },
    { code: '52100555', name: 'Đặng Văn Minh' },
    { code: '52100777', name: 'Trần Thành Phát' },
    { code: '52100444', name: 'Lê Quốc Bảo' },
    { code: '52100111', name: 'Phạm Thị Mai' },
    { code: '52100222', name: 'Vũ Đức Anh' },
    { code: '52100333', name: 'Hoàng Kim Chi' },
  ];

  const members: BookingMember[] = [
    {
      studentCode: ownerCode,
      studentName: ownerName,
      qrCode: hasQr ? buildMemberQrCode(bookingId, ownerCode) : '',
      checkedInAt: checkedInCount >= 1 ? `${getRelativeDate(0)}T07:35:00Z` : undefined,
    },
  ];

  const pool = candidateStudents.filter((s) => s.code !== ownerCode);
  for (let i = 1; i < count; i++) {
    const student = pool[(i - 1) % pool.length];
    const code =
      i - 1 < pool.length ? student.code : `52100${String(100 + i).slice(-3)}`;
    const name =
      i - 1 < pool.length ? student.name : `Sinh viên ${code}`;
    members.push({
      studentCode: code,
      studentName: name,
      qrCode: hasQr ? buildMemberQrCode(bookingId, code) : '',
      checkedInAt: i < checkedInCount ? `${getRelativeDate(0)}T07:40:00Z` : undefined,
    });
  }

  return members;
};

const createSeedBookings = (): Booking[] => {
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const yesterday = getRelativeDate(-1);
  const twoDaysAgo = getRelativeDate(-2);

  return [
    // 1. Tầng 1 L.102 - CONFIRMED today
    {
      id: 'BK-8901',
      roomId: 'r-102',
      roomCode: 'L.102',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      studentId: 'u-student-01',
      studentName: 'La Thái Thành',
      studentCode: '52100888',
      members: createSeedMembers('BK-8901', '52100888', 'La Thái Thành', 6, true, 0),
      date: today,
      startTime: '09:00',
      endTime: '11:00',
      numberOfPeople: 6,
      purpose: 'Học nhóm ôn thi cuối kỳ',
      qrCode: buildMemberQrCode('BK-8901', '52100888'),
      status: 'CONFIRMED',
      createdAt: `${yesterday}T14:30:00Z`,
    },
    // 2. Tầng 1 L.103 - CANCELLED_ADMIN (phòng bảo trì trong seed data)
    {
      id: 'BK-8902',
      roomId: 'r-103',
      roomCode: 'L.103',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      studentId: 'u-student-01',
      studentName: 'La Thái Thành',
      studentCode: '52100888',
      members: createSeedMembers('BK-8902', '52100888', 'La Thái Thành', 7, false, 0),
      date: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      numberOfPeople: 7,
      purpose: 'Thuyết trình dự án phần mềm',
      qrCode: '',
      status: 'CANCELLED_ADMIN',
      cancelReason: 'Phòng bảo trì: Máy chiếu hỏng, chờ thay thế',
      createdAt: `${today}T08:00:00Z`,
    },
    // 3. Tầng G L.004 - CONFIRMED today afternoon
    {
      id: 'BK-8903',
      roomId: 'r-g04',
      roomCode: 'L.004',
      roomType: 'Phòng video',
      building: 'Tòa L',
      floor: 0,
      floorCode: 'G - Floor',
      studentId: 'u-student-02',
      studentName: 'Nguyễn Hoàng Nam',
      studentCode: '52100666',
      members: createSeedMembers('BK-8903', '52100666', 'Nguyễn Hoàng Nam', 7, true, 0),
      date: today,
      startTime: '14:00',
      endTime: '16:00',
      numberOfPeople: 7,
      purpose: 'Thảo luận đề tài nghiên cứu',
      qrCode: buildMemberQrCode('BK-8903', '52100666'),
      status: 'CONFIRMED',
      createdAt: `${yesterday}T16:00:00Z`,
    },
    // 4. Tầng 3 L.305 - IN_USE today (2/5 đã điểm danh)
    {
      id: 'BK-8904',
      roomId: 'r-305',
      roomCode: 'L.305',
      roomType: 'Phòng thuyết trình',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      studentId: 'u-student-03',
      studentName: 'Đặng Văn Minh',
      studentCode: '52100555',
      members: createSeedMembers('BK-8904', '52100555', 'Đặng Văn Minh', 5, true, 2),
      date: today,
      startTime: '07:30',
      endTime: '11:30',
      numberOfPeople: 5,
      purpose: 'Học nhóm giải bài tập cấu trúc dữ liệu',
      qrCode: buildMemberQrCode('BK-8904', '52100555'),
      status: 'IN_USE',
      checkInTime: `${today}T07:35:00Z`,
      createdAt: `${yesterday}T18:00:00Z`,
    },
    // 5. Tầng 2 L.203 - CONFIRMED today
    {
      id: 'BK-8905',
      roomId: 'r-203',
      roomCode: 'L.203',
      roomType: 'Phòng video',
      building: 'Tòa L',
      floor: 2,
      floorCode: '2nd - Floor',
      studentId: 'u-student-01',
      studentName: 'La Thái Thành',
      studentCode: '52100888',
      members: createSeedMembers('BK-8905', '52100888', 'La Thái Thành', 5, true, 0),
      date: today,
      startTime: '13:30',
      endTime: '15:30',
      numberOfPeople: 5,
      purpose: 'Họp ban chủ nhiệm CLB Tiếng Anh',
      qrCode: buildMemberQrCode('BK-8905', '52100888'),
      status: 'CONFIRMED',
      createdAt: `${today}T07:00:00Z`,
    },
    // 6. Tầng 4 L.404 - COMPLETED yesterday
    {
      id: 'BK-8906',
      roomId: 'r-404',
      roomCode: 'L.404',
      roomType: 'Phòng thuyết trình',
      building: 'Tòa L',
      floor: 4,
      floorCode: '4th - Floor',
      studentId: 'u-student-04',
      studentName: 'Trần Thành Phát',
      studentCode: '52100777',
      members: createSeedMembers('BK-8906', '52100777', 'Trần Thành Phát', 6, true, 6),
      date: yesterday,
      startTime: '09:00',
      endTime: '11:00',
      numberOfPeople: 6,
      purpose: 'Thuyết trình bài tập lớn công nghệ phần mềm',
      qrCode: buildMemberQrCode('BK-8906', '52100777'),
      status: 'COMPLETED',
      checkInTime: `${yesterday}T09:05:00Z`,
      createdAt: `${twoDaysAgo}T10:00:00Z`,
    },
    // 7. Tầng 1 L.106 (Phòng hội nghị) - PENDING_APPROVAL tomorrow
    {
      id: 'BK-8907',
      roomId: 'r-106',
      roomCode: 'L.106',
      roomType: 'Phòng hội nghị',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      studentId: 'u-student-01',
      studentName: 'La Thái Thành',
      studentCode: '52100888',
      members: createSeedMembers('BK-8907', '52100888', 'La Thái Thành', 25, false, 0),
      date: tomorrow,
      startTime: '08:30',
      endTime: '11:30',
      numberOfPeople: 25,
      purpose: 'Hội thảo nghiên cứu khoa học sinh viên Tôn Đức Thắng',
      qrCode: '',
      status: 'PENDING_APPROVAL',
      createdAt: `${today}T08:30:00Z`,
    },
    // 8. Tầng 2 L.201 - CANCELLED_AUTO today
    {
      id: 'BK-8908',
      roomId: 'r-201',
      roomCode: 'L.201',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 2,
      floorCode: '2nd - Floor',
      studentId: 'u-student-05',
      studentName: 'Lê Quốc Bảo',
      studentCode: '52100444',
      members: createSeedMembers('BK-8908', '52100444', 'Lê Quốc Bảo', 6, false, 0),
      date: today,
      startTime: '07:30',
      endTime: '09:00',
      numberOfPeople: 6,
      purpose: 'Xem phim tư liệu lịch sử',
      qrCode: '',
      status: 'CANCELLED_AUTO',
      createdAt: `${yesterday}T20:00:00Z`,
    },
  ];
};

const createSeedFloors = (rooms: Room[]): FloorData[] => {
  return mockInitialFloors.map((fl) => {
    const floorRooms = rooms.filter((r) => r.floor === fl.floorNumber);
    const available = floorRooms.filter((r) => !r.maintenance && r.status === 'AVAILABLE').length;
    return {
      ...fl,
      totalRooms: floorRooms.length,
      availableRooms: available,
      rooms: floorRooms,
    };
  });
};

export const getSeedState = (): MockStoreState => {
  const rooms = createSeedRooms();
  const floors = createSeedFloors(rooms);
  const bookings = createSeedBookings();
  const incidents = JSON.parse(JSON.stringify(mockIncidents));
  const registrations: RegistrationRequest[] = [];

  return {
    rooms,
    floors,
    bookings,
    incidents,
    registrations,
  };
};

const syncFloorsWithRooms = (state: MockStoreState) => {
  state.floors = state.floors.map((fl) => {
    const floorRooms = state.rooms.filter((r) => r.floor === fl.floorNumber);
    const available = floorRooms.filter((r) => !r.maintenance && r.status === 'AVAILABLE').length;
    return {
      ...fl,
      totalRooms: floorRooms.length,
      availableRooms: available,
      rooms: floorRooms,
    };
  });
};

type Listener = () => void;

class MockStore {
  private state: MockStoreState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadInitialState();
    this.initStorageListener();
  }

  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORE_STORAGE_KEY) {
          this.state = this.loadInitialState();
          this.notify();
        }
      });
    }
  }

  public getState(): MockStoreState {
    return this.state;
  }

  public update(fn: (state: MockStoreState) => MockStoreState | void): void {
    const result = fn(this.state);
    if (result) {
      this.state = result;
    }
    syncFloorsWithRooms(this.state);
    this.saveState();
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public reset(): void {
    this.state = getSeedState();
    this.saveState();
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in mockStore listener:', err);
      }
    });
  }

  private saveState() {
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(
          STORE_STORAGE_KEY,
          JSON.stringify({
            version: STORE_VERSION,
            state: this.state,
          })
        );
      } catch (e) {
        console.warn('Failed to save mock store to localStorage', e);
      }
    }
  }

  private loadInitialState(): MockStoreState {
    const storage = getStorage();
    if (storage) {
      try {
        const raw = storage.getItem(STORE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === STORE_VERSION && parsed.state) {
            return parsed.state;
          }
        }
      } catch (e) {
        console.warn('Failed to load mock store, using seed', e);
      }
    }
    const seed = getSeedState();
    if (storage) {
      try {
        storage.setItem(
          STORE_STORAGE_KEY,
          JSON.stringify({
            version: STORE_VERSION,
            state: seed,
          })
        );
      } catch {}
    }
    return seed;
  }
}

export const mockStore = new MockStore();

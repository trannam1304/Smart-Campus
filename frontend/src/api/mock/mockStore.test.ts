import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockStore,
  getRoomStatusAt,
  isUpcomingBooking,
  STORE_STORAGE_KEY,
  STORE_VERSION,
  getRelativeDate,
} from './mockStore';
import { mockUpdateRoomStatus, mockGetAdminDashboardData } from './adminMock';
import { mockGetRooms, mockGetFloorMap } from './roomMock';
import { Room, Booking } from '../../types/booking';

// Polyfill for localStorage in test environment
const storageStore: Record<string, string> = {};
const localStoragePolyfill = {
  getItem: (key: string) => storageStore[key] || null,
  setItem: (key: string, value: string) => {
    storageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete storageStore[key];
  },
  clear: () => {
    Object.keys(storageStore).forEach((k) => delete storageStore[k]);
  },
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStoragePolyfill });
} else {
  Object.defineProperty(global, 'localStorage', { value: localStoragePolyfill });
}

describe('mockStore & Maintenance Synchronization', () => {
  beforeEach(() => {
    localStoragePolyfill.clear();
    mockStore.reset();
  });

  describe('1. getRoomStatusAt logic', () => {
    const baseRoom: Room = {
      id: 'test-room-1',
      roomCode: 'L.999',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      capacity: 8,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    };

    it('returns MAINTENANCE when room.maintenance is true regardless of bookings or time', () => {
      const roomInMaint: Room = { ...baseRoom, maintenance: true };
      expect(getRoomStatusAt(roomInMaint, '2026-10-15', '09:00')).toBe('MAINTENANCE');
      expect(getRoomStatusAt(roomInMaint)).toBe('MAINTENANCE');
    });

    it('returns BOOKED when a CONFIRMED, IN_USE or PENDING_APPROVAL booking overlaps with time', () => {
      const today = getRelativeDate(0);
      const testBookings: Booking[] = [
        {
          id: 'b-test-1',
          roomId: baseRoom.id,
          roomCode: baseRoom.roomCode,
          roomType: baseRoom.roomType,
          building: baseRoom.building,
          floor: baseRoom.floor,
          floorCode: baseRoom.floorCode,
          studentId: 'u-1',
          studentName: 'Test Student',
          studentCode: '52100888',
          date: today,
          startTime: '09:00',
          endTime: '11:00',
          numberOfPeople: 5,
          purpose: 'Testing',
          qrCode: 'QR-1',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      ];

      // Overlapping time
      expect(getRoomStatusAt(baseRoom, today, '09:30', undefined, testBookings)).toBe('BOOKED');
      // Exactly at start time
      expect(getRoomStatusAt(baseRoom, today, '09:00', undefined, testBookings)).toBe('BOOKED');
      // Outside time window
      expect(getRoomStatusAt(baseRoom, today, '11:00', undefined, testBookings)).toBe('AVAILABLE');
      expect(getRoomStatusAt(baseRoom, today, '08:30', undefined, testBookings)).toBe('AVAILABLE');
      // Different date
      expect(getRoomStatusAt(baseRoom, '2099-01-01', '09:30', undefined, testBookings)).toBe('AVAILABLE');
    });

    it('returns AVAILABLE when booking is cancelled or completed', () => {
      const today = getRelativeDate(0);
      const cancelledBooking: Booking = {
        id: 'b-test-cancelled',
        roomId: baseRoom.id,
        roomCode: baseRoom.roomCode,
        roomType: baseRoom.roomType,
        building: baseRoom.building,
        floor: baseRoom.floor,
        floorCode: baseRoom.floorCode,
        studentId: 'u-1',
        studentName: 'Test Student',
        studentCode: '52100888',
        date: today,
        startTime: '09:00',
        endTime: '11:00',
        numberOfPeople: 5,
        purpose: 'Testing',
        qrCode: 'QR-1',
        status: 'CANCELLED_ADMIN',
        createdAt: new Date().toISOString(),
      };

      expect(getRoomStatusAt(baseRoom, today, '09:30', undefined, [cancelledBooking])).toBe('AVAILABLE');
    });

    it('supports time range overlap', () => {
      const today = getRelativeDate(0);
      const testBookings: Booking[] = [
        {
          id: 'b-test-2',
          roomId: baseRoom.id,
          roomCode: baseRoom.roomCode,
          roomType: baseRoom.roomType,
          building: baseRoom.building,
          floor: baseRoom.floor,
          floorCode: baseRoom.floorCode,
          studentId: 'u-1',
          studentName: 'Test Student',
          studentCode: '52100888',
          date: today,
          startTime: '13:00',
          endTime: '15:00',
          numberOfPeople: 5,
          purpose: 'Testing',
          qrCode: 'QR-2',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      ];

      // [12:00, 14:00] overlaps with [13:00, 15:00]
      expect(getRoomStatusAt(baseRoom, today, '12:00', '14:00', testBookings)).toBe('BOOKED');
      // [15:00, 17:00] does not overlap with [13:00, 15:00]
      expect(getRoomStatusAt(baseRoom, today, '15:00', '17:00', testBookings)).toBe('AVAILABLE');
    });
  });

  describe('2. Admin maintenance toggle and booking cancellation', () => {
    it('verifies seed maintenance room and tests mockUpdateRoomStatus with maintenanceReason', async () => {
      // 1. Kiểm tra phòng L.103 trong dữ liệu seed đã ở trạng thái bảo trì và có sẵn lý do mẫu
      const room103 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.103');
      expect(room103).toBeDefined();
      expect(room103?.maintenance).toBe(true);
      expect(room103?.status).toBe('MAINTENANCE');
      expect(room103?.maintenanceReason).toBe('Máy chiếu hỏng, chờ thay thế');

      // Booking BK-8902 của L.103 bị hủy do phòng bảo trì
      const booking8902 = mockStore.getState().bookings.find((b) => b.id === 'BK-8902');
      expect(booking8902?.status).toBe('CANCELLED_ADMIN');
      expect(booking8902?.cancelReason).toBe('Phòng bảo trì: Máy chiếu hỏng, chờ thay thế');

      // 2. Mở trống phòng L.103 -> xóa maintenanceReason và chuyển status về AVAILABLE
      const openRes = await mockUpdateRoomStatus(room103!.id, 'AVAILABLE');
      expect(openRes.success).toBe(true);
      const room103Reopened = mockStore.getState().rooms.find((r) => r.roomCode === 'L.103');
      expect(room103Reopened?.maintenance).toBe(false);
      expect(room103Reopened?.status).toBe('AVAILABLE');
      expect(room103Reopened?.maintenanceReason).toBeUndefined();

      // Sinh viên tìm kiếm lại thấy phòng L.103
      const searchReopened = await mockGetRooms({ q: 'L.103' });
      expect(searchReopened.data!.items.length).toBe(1);
      expect(searchReopened.data!.items[0].status).toBe('AVAILABLE');

      // 3. Chuyển phòng L.102 sang bảo trì kèm lý do -> lưu maintenanceReason và hủy booking sắp tới với cancelReason chứa lý do
      const tomorrow = getRelativeDate(1);
      const room102 = mockStore.getState().rooms.find((r) => r.roomCode === 'L.102');
      expect(room102).toBeDefined();
      expect(room102?.maintenance).toBe(false);

      // Thêm booking sắp tới vào ngày mai cho phòng L.102 để kiểm thử hủy tự động
      mockStore.update((state) => {
        state.bookings.push({
          id: 'test-upcoming-102',
          roomId: room102!.id,
          roomCode: 'L.102',
          roomType: room102!.roomType,
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-test',
          studentName: 'Test Student',
          studentCode: '52100999',
          date: tomorrow,
          startTime: '09:00',
          endTime: '11:00',
          numberOfPeople: 5,
          purpose: 'Kiểm tra bảo trì',
          qrCode: 'QR-TEST',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        });
      });

      const upcoming102 = mockStore
        .getState()
        .bookings.filter((b) => b.roomCode === 'L.102' && isUpcomingBooking(b));
      expect(upcoming102.length).toBeGreaterThan(0);

      const maintRes = await mockUpdateRoomStatus(
        room102!.id,
        'MAINTENANCE',
        'Điều hòa hỏng và chập điện'
      );
      expect(maintRes.success).toBe(true);
      expect(maintRes.data.cancelledCount).toBeGreaterThan(0);

      const room102Updated = mockStore.getState().rooms.find((r) => r.roomCode === 'L.102');
      expect(room102Updated?.maintenance).toBe(true);
      expect(room102Updated?.status).toBe('MAINTENANCE');
      expect(room102Updated?.maintenanceReason).toBe('Điều hòa hỏng và chập điện');

      // Booking sắp tới bị hủy với cancelReason chứa lý do bảo trì
      const booking102After = mockStore.getState().bookings.find((b) => b.id === upcoming102[0].id);
      expect(booking102After?.status).toBe('CANCELLED_ADMIN');
      expect(booking102After?.cancelReason).toBe(
        'Phòng bảo trì: Điều hòa hỏng và chập điện'
      );

      // Mở trống lại phòng L.102 -> xóa lý do bảo trì
      await mockUpdateRoomStatus(room102!.id, 'AVAILABLE');
      const room102Cleared = mockStore.getState().rooms.find((r) => r.roomCode === 'L.102');
      expect(room102Cleared?.maintenanceReason).toBeUndefined();
    });
  });

  describe('3. mockStore reset and persistence', () => {
    it('restores initial seed state when reset() is called', () => {
      // Modify store state
      mockStore.update((state) => {
        state.rooms[0].maintenance = true;
        state.bookings.push({
          id: 'custom-booking',
          roomId: 'r-0',
          roomCode: 'CUSTOM',
          roomType: 'CUSTOM',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-x',
          studentName: 'Custom',
          studentCode: '99999999',
          date: '2099-01-01',
          startTime: '08:00',
          endTime: '10:00',
          numberOfPeople: 5,
          purpose: 'Custom',
          qrCode: 'QR-CUSTOM',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        });
      });

      expect(mockStore.getState().bookings.some((b) => b.id === 'custom-booking')).toBe(true);
      expect(mockStore.getState().rooms[0].maintenance).toBe(true);

      // Call reset()
      mockStore.reset();

      // Custom booking should be gone
      expect(mockStore.getState().bookings.some((b) => b.id === 'custom-booking')).toBe(false);
      // Room maintenance should be restored
      expect(mockStore.getState().rooms[0].maintenance).toBe(false);
      // Seed bookings should exist (~8 bookings)
      expect(mockStore.getState().bookings.length).toBe(8);
    });

    it('subscribers are notified when update() or reset() is called', () => {
      let callCount = 0;
      const unsubscribe = mockStore.subscribe(() => {
        callCount++;
      });

      mockStore.update((state) => {
        state.rooms[0].roomType = 'Updated Type';
      });
      expect(callCount).toBe(1);

      mockStore.reset();
      expect(callCount).toBe(2);

      unsubscribe();
      mockStore.update((state) => {
        state.rooms[0].roomType = 'Another Type';
      });
      expect(callCount).toBe(2); // no more increments after unsub
    });
  });
});

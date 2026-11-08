import { describe, it, expect } from 'vitest';
import {
  calculateFloorUtilization,
  calculateHourlyBookings,
  calculateKPISummary,
  calculateRoomUtilization,
} from './adminAnalytics';
import { Booking, FloorData, Room } from '../types/booking';
import { mockExactRooms } from '../api/mock/mockData';

describe('adminAnalytics', () => {
  const sampleFloors: FloorData[] = [
    {
      floorNumber: 0,
      floorCode: 'G - Floor',
      description: 'Tầng G Sảnh Đọc & Tự học',
      mapImage: '/assets/floors/image3.png',
      otherZones: [],
      totalRooms: 2,
      availableRooms: 2,
      rooms: [],
    },
    {
      floorNumber: 1,
      floorCode: '1st - Floor',
      description: 'Tầng 1 Phòng Thuyết trình',
      mapImage: '/assets/floors/image4.png',
      otherZones: [],
      totalRooms: 2,
      availableRooms: 2,
      rooms: [],
    },
    {
      floorNumber: 2,
      floorCode: '2nd - Floor',
      description: 'Tầng 2 Video & Nhóm',
      mapImage: '/assets/floors/image5.png',
      otherZones: [],
      totalRooms: 1,
      availableRooms: 1,
      rooms: [],
    },
    {
      floorNumber: 3,
      floorCode: '3rd - Floor',
      description: 'Tầng 3 Tự học & Nhóm',
      mapImage: '/assets/floors/image6.png',
      otherZones: [],
      totalRooms: 1,
      availableRooms: 1,
      rooms: [],
    },
    {
      floorNumber: 4,
      floorCode: '4th - Floor',
      description: 'Tầng 4 Video & Thuyết trình',
      mapImage: '/assets/floors/image7.png',
      otherZones: [],
      totalRooms: 1,
      availableRooms: 1,
      rooms: [],
    },
    {
      floorNumber: 5,
      floorCode: '5th - Floor',
      description: 'Tầng 5 Nhóm & Hội nghị',
      mapImage: '/assets/floors/image8.png',
      otherZones: [],
      totalRooms: 1,
      availableRooms: 1,
      rooms: [],
    },
  ];

  const sampleRooms: Room[] = [
    {
      id: 'r-001',
      roomCode: 'L.001',
      roomType: 'Phòng tự học',
      building: 'Tòa L',
      floor: 0,
      floorCode: 'G - Floor',
      capacity: 5,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-002',
      roomCode: 'L.002',
      roomType: 'Phòng tự học',
      building: 'Tòa L',
      floor: 0,
      floorCode: 'G - Floor',
      capacity: 6,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-101',
      roomCode: 'L.101',
      roomType: 'Phòng thuyết trình',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      capacity: 6,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-102',
      roomCode: 'L.102',
      roomType: 'Phòng thuyết trình',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      capacity: 8,
      status: 'MAINTENANCE',
      devices: [],
      maintenance: true,
    },
    {
      id: 'r-201',
      roomCode: 'L.201',
      roomType: 'Phòng Video',
      building: 'Tòa L',
      floor: 2,
      floorCode: '2nd - Floor',
      capacity: 8,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-301',
      roomCode: 'L.301',
      roomType: 'Phòng tự học',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 5,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-401',
      roomCode: 'L.401',
      roomType: 'Phòng Video',
      building: 'Tòa L',
      floor: 4,
      floorCode: '4th - Floor',
      capacity: 8,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-501',
      roomCode: 'L.501',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 5,
      floorCode: '5th - Floor',
      capacity: 5,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
  ];

  const targetDate = '2026-10-14';

  describe('calculateFloorUtilization', () => {
    it('calculates correct utilization percentage based on booked minutes vs open minutes for all 6 floors', () => {
      // Custom test schedule: Floor 0 has 2 rooms, each open 08:00 - 18:00 (10h = 600 min -> 1200 total open min)
      const testHours = {
        0: { open: '08:00', close: '18:00' },
        1: { open: '08:00', close: '18:00' },
        2: { open: '08:00', close: '18:00' },
        3: { open: '08:00', close: '18:00' },
        4: { open: '08:00', close: '18:00' },
        5: { open: '08:00', close: '18:00' },
      };

      const sampleBookings: Booking[] = [
        {
          id: 'b-1',
          roomId: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-1',
          studentName: 'Sinh viên 1',
          studentCode: '52100111',
          date: targetDate,
          startTime: '09:00',
          endTime: '11:00', // 120 minutes
          numberOfPeople: 4,
          purpose: 'Học bài',
          qrCode: 'SMART-CAMPUS-b-1',
          status: 'CONFIRMED',
          createdAt: '2026-10-13T10:00:00Z',
        },
        {
          id: 'b-2',
          roomId: 'r-002',
          roomCode: 'L.002',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-2',
          studentName: 'Sinh viên 2',
          studentCode: '52100222',
          date: targetDate,
          startTime: '13:00',
          endTime: '14:30', // 90 minutes
          numberOfPeople: 4,
          purpose: 'Làm bài tập',
          qrCode: 'SMART-CAMPUS-b-2',
          status: 'IN_USE',
          createdAt: '2026-10-13T10:00:00Z',
        },
        // Booking on different date (should NOT be counted)
        {
          id: 'b-3',
          roomId: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-3',
          studentName: 'Sinh viên 3',
          studentCode: '52100333',
          date: '2026-10-15',
          startTime: '09:00',
          endTime: '11:00',
          numberOfPeople: 4,
          purpose: 'Học bài',
          qrCode: 'SMART-CAMPUS-b-3',
          status: 'CONFIRMED',
          createdAt: '2026-10-13T10:00:00Z',
        },
        // Cancelled booking (should NOT be counted)
        {
          id: 'b-4',
          roomId: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-4',
          studentName: 'Sinh viên 4',
          studentCode: '52100444',
          date: targetDate,
          startTime: '15:00',
          endTime: '17:00',
          numberOfPeople: 4,
          purpose: 'Học bài',
          qrCode: 'SMART-CAMPUS-b-4',
          status: 'CANCELLED_USER',
          createdAt: '2026-10-13T10:00:00Z',
        },
      ];

      const result = calculateFloorUtilization(
        sampleFloors,
        sampleRooms,
        sampleBookings,
        targetDate,
        testHours
      );

      expect(result).toHaveLength(6);

      // Floor 0: total booked = 120 + 90 = 210 min. Total open = 2 rooms * 600 min = 1200 min.
      // Percentage = (210 / 1200) * 100 = 17.5%
      const floor0 = result.find((f) => f.floorNumber === 0);
      expect(floor0).toBeDefined();
      expect(floor0?.totalRooms).toBe(2);
      expect(floor0?.totalBookedMinutes).toBe(210);
      expect(floor0?.totalOpenMinutes).toBe(1200);
      expect(floor0?.percentage).toBe(17.5);

      // Floor 1-5 have 0 bookings, percentage must be 0
      const floor1 = result.find((f) => f.floorNumber === 1);
      expect(floor1?.percentage).toBe(0);
      expect(floor1?.totalBookedMinutes).toBe(0);
    });
  });

  describe('calculateHourlyBookings', () => {
    it('calculates booking counts per hour (07:00 to 20:00) and detects peak hours', () => {
      const sampleBookings: Booking[] = [
        {
          id: 'b-1',
          roomId: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-1',
          studentName: 'Sinh viên 1',
          studentCode: '52100111',
          date: targetDate,
          startTime: '08:00',
          endTime: '10:00', // active in [08:00, 09:00] and [09:00, 10:00]
          numberOfPeople: 4,
          purpose: 'Học bài',
          qrCode: 'SMART-CAMPUS-b-1',
          status: 'CONFIRMED',
          createdAt: '2026-10-13T10:00:00Z',
        },
        {
          id: 'b-2',
          roomId: 'r-101',
          roomCode: 'L.101',
          roomType: 'Phòng thuyết trình',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-2',
          studentName: 'Sinh viên 2',
          studentCode: '52100222',
          date: targetDate,
          startTime: '09:30',
          endTime: '11:30', // active in [09:00, 10:00], [10:00, 11:00], [11:00, 12:00]
          numberOfPeople: 4,
          purpose: 'Thuyết trình',
          qrCode: 'SMART-CAMPUS-b-2',
          status: 'IN_USE',
          createdAt: '2026-10-13T10:00:00Z',
        },
        // Cancelled booking should NOT be counted
        {
          id: 'b-3',
          roomId: 'r-201',
          roomCode: 'L.201',
          roomType: 'Phòng Video',
          building: 'Tòa L',
          floor: 2,
          floorCode: '2nd - Floor',
          studentId: 'u-3',
          studentName: 'Sinh viên 3',
          studentCode: '52100333',
          date: targetDate,
          startTime: '09:00',
          endTime: '11:00',
          numberOfPeople: 4,
          purpose: 'Xem phim',
          qrCode: 'SMART-CAMPUS-b-3',
          status: 'CANCELLED_ADMIN',
          createdAt: '2026-10-13T10:00:00Z',
        },
        // Different date booking should NOT be counted
        {
          id: 'b-4',
          roomId: 'r-301',
          roomCode: 'L.301',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 3,
          floorCode: '3rd - Floor',
          studentId: 'u-4',
          studentName: 'Sinh viên 4',
          studentCode: '52100444',
          date: '2026-10-15',
          startTime: '09:00',
          endTime: '11:00',
          numberOfPeople: 4,
          purpose: 'Học bài',
          qrCode: 'SMART-CAMPUS-b-4',
          status: 'CONFIRMED',
          createdAt: '2026-10-13T10:00:00Z',
        },
      ];

      const result = calculateHourlyBookings(sampleBookings, targetDate);

      // Check hours list covers 07:00 to 20:00 (14 hours)
      expect(result.hours).toHaveLength(14);
      expect(result.hours[0].time).toBe('07:00');
      expect(result.hours[result.hours.length - 1].time).toBe('20:00');

      // 07:00 -> 0 bookings
      expect(result.hours.find((h) => h.time === '07:00')?.count).toBe(0);

      // 08:00 -> 1 booking (b-1)
      expect(result.hours.find((h) => h.time === '08:00')?.count).toBe(1);

      // 09:00 -> 2 bookings (b-1 and b-2)
      expect(result.hours.find((h) => h.time === '09:00')?.count).toBe(2);

      // 10:00 -> 1 booking (b-2)
      expect(result.hours.find((h) => h.time === '10:00')?.count).toBe(1);

      // 11:00 -> 1 booking (b-2)
      expect(result.hours.find((h) => h.time === '11:00')?.count).toBe(1);

      // 12:00 -> 0 bookings
      expect(result.hours.find((h) => h.time === '12:00')?.count).toBe(0);

      // Peak hour should be 09:00 with peakCount = 2
      expect(result.peakHour).toBe('09:00');
      expect(result.peakCount).toBe(2);
    });
  });

  describe('calculateKPISummary', () => {
    it('calculates all KPI metrics accurately from raw store data', () => {
      const sampleBookings: Booking[] = [
        {
          id: 'b-1',
          roomId: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-1',
          studentName: 'Sinh viên 1',
          studentCode: '52100111',
          date: targetDate,
          startTime: '08:00',
          endTime: '12:00',
          numberOfPeople: 4,
          purpose: 'Học bài',
          qrCode: 'SMART-CAMPUS-b-1',
          status: 'CONFIRMED',
          createdAt: '2026-10-13T10:00:00Z',
        },
        {
          id: 'b-2',
          roomId: 'r-101',
          roomCode: 'L.101',
          roomType: 'Phòng thuyết trình',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-2',
          studentName: 'Sinh viên 2',
          studentCode: '52100222',
          date: targetDate,
          startTime: '10:00',
          endTime: '14:00',
          numberOfPeople: 4,
          purpose: 'Thuyết trình',
          qrCode: 'SMART-CAMPUS-b-2',
          status: 'IN_USE',
          createdAt: '2026-10-13T10:00:00Z',
        },
        {
          id: 'b-3',
          roomId: 'r-501',
          roomCode: 'L.501',
          roomType: 'Phòng hội nghị',
          building: 'Tòa L',
          floor: 5,
          floorCode: '5th - Floor',
          studentId: 'u-3',
          studentName: 'Sinh viên 3',
          studentCode: '52100333',
          date: targetDate,
          startTime: '14:00',
          endTime: '16:00',
          numberOfPeople: 20,
          purpose: 'Hội thảo khoa học',
          qrCode: '',
          status: 'PENDING_APPROVAL',
          createdAt: '2026-10-13T10:00:00Z',
        },
      ];

      const sampleIncidents = [
        { id: 'inc-1', status: 'OPEN', description: 'Máy chiếu hỏng' },
        { id: 'inc-2', status: 'OPEN', description: 'Điều hòa không lạnh' },
        { id: 'inc-3', status: 'RESOLVED', description: 'Đèn chớp nháy' },
      ];

      // Test with currentTime = '10:30': both b-1 and b-2 are ongoing
      const kpiAt1030 = calculateKPISummary(
        sampleRooms,
        sampleBookings,
        sampleIncidents,
        targetDate,
        '10:30'
      );

      // 8 total rooms, 1 in maintenance (L.102) => 7 available
      expect(kpiAt1030.totalRooms).toBe(8);
      expect(kpiAt1030.maintenanceRooms).toBe(1);
      expect(kpiAt1030.availableRooms).toBe(7);

      // 2 active bookings on targetDate (CONFIRMED + IN_USE)
      expect(kpiAt1030.activeBookingsToday).toBe(2);

      // 1 pending approval
      expect(kpiAt1030.pendingApprovals).toBe(1);

      // 2 open incidents
      expect(kpiAt1030.openIncidents).toBe(2);

      // At 10:30: both L.001 (08:00-12:00) and L.101 (10:00-14:00) are ongoing -> 2 rooms
      expect(kpiAt1030.ongoingBookingsCount).toBe(2);

      // Utilization rate = round(2 / 7 * 100) = round(28.57) = 29%
      expect(kpiAt1030.currentUtilizationRate).toBe(29);
    });
  });

  describe('calculateRoomUtilization', () => {
    it('(a) calculates correct percentage for floor 3 (07:30-17:00 = 570 min) and floor G (07:30-20:00 = 750 min)', () => {
      const testRooms: Room[] = [
        {
          id: 'r-301',
          roomCode: 'L.301',
          roomType: 'Phòng học nhỏ',
          building: 'Tòa L',
          floor: 3,
          floorCode: '3rd - Floor',
          capacity: 8,
          status: 'AVAILABLE',
          devices: [],
        },
        {
          id: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          capacity: 5,
          status: 'AVAILABLE',
          devices: [],
        },
      ];

      const bookings: Booking[] = [
        {
          id: 'b-1',
          roomId: 'r-301',
          roomCode: 'L.301',
          roomType: 'Phòng học nhỏ',
          building: 'Tòa L',
          floor: 3,
          floorCode: '3rd - Floor',
          studentId: 'u-1',
          studentName: 'SV 1',
          studentCode: '52100111',
          date: '2026-11-02',
          startTime: '08:00',
          endTime: '10:00', // 120 min
          numberOfPeople: 4,
          purpose: 'Học nhóm',
          qrCode: 'qr-1',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
        {
          id: 'b-2',
          roomId: 'r-001',
          roomCode: 'L.001',
          roomType: 'Phòng tự học',
          building: 'Tòa L',
          floor: 0,
          floorCode: 'G - Floor',
          studentId: 'u-2',
          studentName: 'SV 2',
          studentCode: '52100222',
          date: '2026-11-02',
          startTime: '08:00',
          endTime: '10:00', // 120 min
          numberOfPeople: 4,
          purpose: 'Tự học',
          qrCode: 'qr-2',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
      ];

      const result = calculateRoomUtilization(testRooms, bookings, '2026-11-02');
      const r301 = result.find((r) => r.roomCode === 'L.301')!;
      const r001 = result.find((r) => r.roomCode === 'L.001')!;

      // Floor 3: 120 min / 570 min = 21.0526% => 21.1%
      expect(r301.totalBookedMinutes).toBe(120);
      expect(r301.totalOpenMinutes).toBe(570);
      expect(r301.percentage).toBe(21.1);

      // Floor G: 120 min / 750 min = 16% => 16.0%
      expect(r001.totalBookedMinutes).toBe(120);
      expect(r001.totalOpenMinutes).toBe(750);
      expect(r001.percentage).toBe(16);
    });

    it('(b) only counts CONFIRMED and IN_USE bookings, ignoring other statuses', () => {
      const testRooms: Room[] = [
        {
          id: 'r-101',
          roomCode: 'L.101',
          roomType: 'Phòng học',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
      ];

      const allStatuses = [
        'CONFIRMED',
        'IN_USE',
        'PENDING_APPROVAL',
        'CANCELLED_AUTO',
        'CANCELLED_USER',
        'CANCELLED_ADMIN',
        'COMPLETED',
      ] as const;

      const bookings: Booking[] = allStatuses.map((st, i) => ({
        id: `b-${i}`,
        roomId: 'r-101',
        roomCode: 'L.101',
        roomType: 'Phòng học',
        building: 'Tòa L',
        floor: 1,
        floorCode: '1st - Floor',
        studentId: `u-${i}`,
        studentName: `SV ${i}`,
        studentCode: `52100${i}`,
        date: '2026-11-02',
        startTime: '08:00',
        endTime: '09:00', // 60 min each
        numberOfPeople: 4,
        purpose: 'Thử nghiệm status',
        qrCode: `qr-${i}`,
        status: st,
        createdAt: '2026-11-02T07:00:00Z',
      }));

      const result = calculateRoomUtilization(testRooms, bookings, '2026-11-02');
      const r101 = result[0];

      // Only CONFIRMED (60) + IN_USE (60) = 120 min
      expect(r101.totalBookedMinutes).toBe(120);
    });

    it('(c) ignores bookings on different dates', () => {
      const testRooms: Room[] = [
        {
          id: 'r-101',
          roomCode: 'L.101',
          roomType: 'Phòng học',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
      ];

      const bookings: Booking[] = [
        {
          id: 'b-today',
          roomId: 'r-101',
          roomCode: 'L.101',
          roomType: 'Phòng học',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-1',
          studentName: 'SV 1',
          studentCode: '52100111',
          date: '2026-11-02',
          startTime: '08:00',
          endTime: '09:30', // 90 min
          numberOfPeople: 4,
          purpose: 'Học hôm nay',
          qrCode: 'qr-1',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
        {
          id: 'b-tomorrow',
          roomId: 'r-101',
          roomCode: 'L.101',
          roomType: 'Phòng học',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-2',
          studentName: 'SV 2',
          studentCode: '52100222',
          date: '2026-11-03',
          startTime: '08:00',
          endTime: '10:00', // 120 min
          numberOfPeople: 4,
          purpose: 'Học ngày mai',
          qrCode: 'qr-2',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
      ];

      const result = calculateRoomUtilization(testRooms, bookings, '2026-11-02');
      expect(result[0].totalBookedMinutes).toBe(90);
    });

    it('(d) marks maintenance rooms with isMaintenance=true and puts them at the end', () => {
      const testRooms: Room[] = [
        {
          id: 'r-maint1',
          roomCode: 'L.101',
          roomType: 'Phòng bảo trì qua flag',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
          maintenance: true,
        },
        {
          id: 'r-maint2',
          roomCode: 'L.102',
          roomType: 'Phòng bảo trì qua status',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'MAINTENANCE',
          devices: [],
        },
        {
          id: 'r-avail',
          roomCode: 'L.103',
          roomType: 'Phòng sẵn sàng 0%',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
      ];

      const result = calculateRoomUtilization(testRooms, [], '2026-11-02');

      expect(result[0].roomCode).toBe('L.103');
      expect(result[0].isMaintenance).toBe(false);

      expect(result[1].roomCode).toBe('L.101');
      expect(result[1].isMaintenance).toBe(true);

      expect(result[2].roomCode).toBe('L.102');
      expect(result[2].isMaintenance).toBe(true);
    });

    it('(e) sorts rooms by percentage descending, and tie-breaks by roomCode ascending', () => {
      const testRooms: Room[] = [
        {
          id: 'r-2',
          roomCode: 'L.102',
          roomType: 'Phòng',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
        {
          id: 'r-1',
          roomCode: 'L.101',
          roomType: 'Phòng',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
        {
          id: 'r-3',
          roomCode: 'L.103',
          roomType: 'Phòng',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
      ];

      const bookings: Booking[] = [
        {
          id: 'b-3',
          roomId: 'r-3',
          roomCode: 'L.103',
          roomType: 'Phòng',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-3',
          studentName: 'SV 3',
          studentCode: '52100333',
          date: '2026-11-02',
          startTime: '08:00',
          endTime: '11:00', // 180 min
          numberOfPeople: 4,
          purpose: 'Học',
          qrCode: 'qr-3',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
        {
          id: 'b-1',
          roomId: 'r-1',
          roomCode: 'L.101',
          roomType: 'Phòng',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-1',
          studentName: 'SV 1',
          studentCode: '52100111',
          date: '2026-11-02',
          startTime: '08:00',
          endTime: '09:30', // 90 min
          numberOfPeople: 4,
          purpose: 'Học',
          qrCode: 'qr-1',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
        {
          id: 'b-2',
          roomId: 'r-2',
          roomCode: 'L.102',
          roomType: 'Phòng',
          building: 'Tòa L',
          floor: 1,
          floorCode: '1st - Floor',
          studentId: 'u-2',
          studentName: 'SV 2',
          studentCode: '52100222',
          date: '2026-11-02',
          startTime: '08:00',
          endTime: '09:30', // 90 min
          numberOfPeople: 4,
          purpose: 'Học',
          qrCode: 'qr-2',
          status: 'CONFIRMED',
          createdAt: '2026-11-02T07:00:00Z',
        },
      ];

      const result = calculateRoomUtilization(testRooms, bookings, '2026-11-02');

      expect(result.map((r) => r.roomCode)).toEqual(['L.103', 'L.101', 'L.102']);
    });

    it('(f) gives 0% for rooms without any bookings', () => {
      const testRooms: Room[] = [
        {
          id: 'r-empty',
          roomCode: 'L.201',
          roomType: 'Phòng trống',
          building: 'Tòa L',
          floor: 2,
          floorCode: '2nd - Floor',
          capacity: 10,
          status: 'AVAILABLE',
          devices: [],
        },
      ];

      const result = calculateRoomUtilization(testRooms, [], '2026-11-02');
      expect(result[0].totalBookedMinutes).toBe(0);
      expect(result[0].percentage).toBe(0);
    });

    it('(g) returns all 33 rooms with seed data', () => {
      const result = calculateRoomUtilization(mockExactRooms, [], '2026-11-02');
      expect(result).toHaveLength(33);
      const resultCodes = result.map((r) => r.roomCode);
      for (const r of mockExactRooms) {
        expect(resultCodes).toContain(r.roomCode);
      }
    });
  });
});

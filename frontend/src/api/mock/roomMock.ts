import { ApiEnvelope, Paginated } from '../types';
import { Room, Booking } from '../../types/booking';
import { GetRoomsParams } from '../roomApi';
import { mockStore, getRoomStatusAt } from './mockStore';

export const mockGetRooms = async (params: GetRoomsParams): Promise<ApiEnvelope<Paginated<Room>>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const state = mockStore.getState();
      let allRooms = state.rooms.map((room) => ({
        ...room,
        status: getRoomStatusAt(room, params.date, params.startTime, params.endTime, state.bookings),
      }));

      // Unless specifically requesting maintenance rooms (e.g., admin), hide maintenance rooms from student search results
      if (!params.includeMaintenance) {
        allRooms = allRooms.filter((r) => !r.maintenance && r.status !== 'MAINTENANCE');
      }

      if (params.q) {
        const q = params.q.toLowerCase();
        allRooms = allRooms.filter(
          (r) => r.roomCode.toLowerCase().includes(q) || r.roomType.toLowerCase().includes(q)
        );
      }
      if (params.roomType) {
        const t = params.roomType.toLowerCase();
        allRooms = allRooms.filter((r) => r.roomType.toLowerCase() === t);
      }
      if (params.capacity) {
        allRooms = allRooms.filter((r) => r.capacity >= params.capacity!);
      }
      if (params.buildingId) {
        allRooms = allRooms.filter((r) => r.building === params.buildingId);
      }
      if (typeof params.floor === 'number') {
        allRooms = allRooms.filter((r) => r.floor === params.floor);
      }
      if (params.equipment && params.equipment.length > 0) {
        // Phòng phải có ĐỦ mọi loại đã chọn và thiết bị đó ở trạng thái GOOD (thiết bị BROKEN/REPAIRING không được tính)
        allRooms = allRooms.filter((r) =>
          params.equipment!.every((cat) =>
            r.devices.some((d) => d.category === cat && d.status === 'GOOD')
          )
        );
      } else if (params.hasProjector) {
        allRooms = allRooms.filter((r) =>
          r.devices.some((d) => (d.category === 'PROJECTOR' || d.name.toLowerCase().includes('máy chiếu')) && d.status === 'GOOD')
        );
      }

      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          items: allRooms,
          pagination: {
            page: 1,
            limit: allRooms.length,
            totalElements: allRooms.length,
            totalPages: 1,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockGetFloorMap = async (floorId: string, date?: string, time?: string): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const state = mockStore.getState();
      const floor = state.floors.find(
        (f) => f.floorNumber.toString() === floorId || f.floorCode === floorId
      );

      if (!floor) {
        return resolve({
          success: false,
          code: 404,
          message: 'Không tìm thấy tầng',
          timestamp: new Date().toISOString(),
        } as any);
      }

      // Check bookings & maintenance via getRoomStatusAt
      const roomsWithStatus = floor.rooms.map((room) => {
        const status = getRoomStatusAt(room, date, time, undefined, state.bookings);
        return { ...room, status };
      });

      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          ...floor,
          rooms: roomsWithStatus,
        },
        timestamp: new Date().toISOString(),
      });
    }, 300);
  });
};

export const mockGetRoomBookings = async (roomId: string, date: string): Promise<ApiEnvelope<Booking[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const state = mockStore.getState();
      const bookings = state.bookings.filter(
        (b) =>
          (b.roomId === roomId || b.roomCode === roomId) &&
          b.date === date &&
          (b.status === 'CONFIRMED' || b.status === 'IN_USE')
      );
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: bookings,
        timestamp: new Date().toISOString(),
      });
    }, 200);
  });
};

export const mockGetRoomBookingsRange = async (
  roomId: string,
  startDate: string,
  endDate: string
): Promise<ApiEnvelope<Booking[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const state = mockStore.getState();
      const bookings = state.bookings.filter(
        (b) =>
          (b.roomId === roomId || b.roomCode === roomId) &&
          b.date >= startDate &&
          b.date <= endDate &&
          (b.status === 'CONFIRMED' || b.status === 'IN_USE')
      );
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: bookings,
        timestamp: new Date().toISOString(),
      });
    }, 200);
  });
};

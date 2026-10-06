import { ApiEnvelope, Paginated } from '../types';
import { Room, Booking } from '../../types/booking';
import { GetRoomsParams } from '../roomApi';
import { mockInitialFloors, mockBookings } from './mockData';

export const mockGetRooms = async (params: GetRoomsParams): Promise<ApiEnvelope<Paginated<Room>>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let allRooms = mockInitialFloors.flatMap(f => f.rooms);

      if (params.q) {
        const q = params.q.toLowerCase();
        allRooms = allRooms.filter(r => r.roomCode.toLowerCase().includes(q));
      }
      if (params.capacity) {
        allRooms = allRooms.filter(r => r.capacity >= params.capacity!);
      }
      if (params.buildingId) {
        allRooms = allRooms.filter(r => r.building === params.buildingId);
      }
      if (params.hasProjector) {
        allRooms = allRooms.filter(r => r.devices.some(d => d.name.toLowerCase().includes('máy chiếu') && d.status === 'GOOD'));
      }

      // Filter dynamically based on date and time overlapping
      if (params.date && params.startTime && params.endTime) {
        allRooms = allRooms.map(room => {
          if (room.status === 'MAINTENANCE') return room;
          
          const isBooked = mockBookings.some(b => 
            b.roomId === room.id && 
            b.date === params.date && 
            b.status === 'CONFIRMED' &&
            ((params.startTime! >= b.startTime && params.startTime! < b.endTime) ||
             (params.endTime! > b.startTime && params.endTime! <= b.endTime) ||
             (params.startTime! <= b.startTime && params.endTime! >= b.endTime))
          );
          
          return { ...room, status: isBooked ? 'BOOKED' : 'AVAILABLE' };
        });
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
            totalPages: 1
          }
        },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

export const mockGetFloorMap = async (floorId: string, date?: string, time?: string): Promise<ApiEnvelope<any>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const floor = mockInitialFloors.find(f => f.floorNumber.toString() === floorId || f.floorCode === floorId);
      
      if (!floor) {
        return resolve({
          success: false,
          code: 404,
          message: 'Không tìm thấy tầng',
          timestamp: new Date().toISOString()
        } as any);
      }

      // Check bookings if date and time provided
      const roomsWithStatus = floor.rooms.map(room => {
        let currentStatus = room.status;

        // If not explicitly maintenance, check bookings
        if (currentStatus !== 'MAINTENANCE' && date && time) {
          const isBooked = mockBookings.some(b => 
            b.roomId === room.id && 
            b.date === date && 
            b.status === 'CONFIRMED' &&
            time >= b.startTime && time < b.endTime
          );

          if (isBooked) {
            currentStatus = 'BOOKED';
          } else {
            currentStatus = 'AVAILABLE';
          }
        }

        return { ...room, status: currentStatus };
      });

      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          ...floor,
          rooms: roomsWithStatus
        },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

export const mockGetRoomBookings = async (roomId: string, date: string): Promise<ApiEnvelope<Booking[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bookings = mockBookings.filter(b => b.roomId === roomId && b.date === date && (b.status === 'CONFIRMED' || b.status === 'IN_USE'));
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: bookings,
        timestamp: new Date().toISOString()
      });
    }, 400);
  });
};

export const mockGetRoomBookingsRange = async (roomId: string, startDate: string, endDate: string): Promise<ApiEnvelope<Booking[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bookings = mockBookings.filter(b => 
        b.roomId === roomId && 
        b.date >= startDate && 
        b.date <= endDate && 
        (b.status === 'CONFIRMED' || b.status === 'IN_USE')
      );
      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: bookings,
        timestamp: new Date().toISOString()
      });
    }, 400);
  });
};

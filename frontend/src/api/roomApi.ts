import { USE_MOCK } from '../config/env';
import axiosClient from './axiosClient';
import { ApiEnvelope, Paginated } from './types';
import { Room, Booking } from '../types/booking';

export interface GetRoomsParams {
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  buildingId?: string;
  hasProjector?: boolean;
  q?: string;
}

export const getRoomsApi = async (params: GetRoomsParams): Promise<ApiEnvelope<Paginated<Room>>> => {
  if (USE_MOCK) {
    const { mockGetRooms } = await import('./mock/roomMock');
    return mockGetRooms(params);
  }
  return axiosClient.get('/rooms', { params });
};

export const getFloorMapApi = async (floorId: string, date?: string, time?: string): Promise<ApiEnvelope<any>> => {
  if (USE_MOCK) {
    const { mockGetFloorMap } = await import('./mock/roomMock');
    return mockGetFloorMap(floorId, date, time);
  }
  return axiosClient.get(`/floors/${floorId}/map`, { params: { date, time } });
};

export const getRoomBookingsApi = async (roomId: string, date: string): Promise<ApiEnvelope<Booking[]>> => {
  if (USE_MOCK) {
    const { mockGetRoomBookings } = await import('./mock/roomMock');
    return mockGetRoomBookings(roomId, date);
  }
  return axiosClient.get(`/rooms/${roomId}/bookings`, { params: { date } });
};

export const getRoomBookingsRangeApi = async (roomId: string, startDate: string, endDate: string): Promise<ApiEnvelope<Booking[]>> => {
  if (USE_MOCK) {
    const { mockGetRoomBookingsRange } = await import('./mock/roomMock');
    return mockGetRoomBookingsRange(roomId, startDate, endDate);
  }
  // TODO: Implement real backend call when endpoint is ready
  return axiosClient.get(`/rooms/${roomId}/bookings`, { params: { startDate, endDate } });
};


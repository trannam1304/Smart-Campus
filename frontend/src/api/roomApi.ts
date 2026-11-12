import axiosClient from './axiosClient';
import { ApiEnvelope, Paginated } from './types';
import { Room, Booking, DeviceCategory, FloorData } from '../types/booking';
import { campusFloors } from '../data/floors';

export interface GetRoomsParams {
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  buildingId?: string;
  floor?: number;
  roomType?: string;
  equipment?: DeviceCategory[];
  hasProjector?: boolean;
  q?: string;
  includeMaintenance?: boolean;
}

const mapRoomTypeCodeToType = (code?: string): string => {
  switch (code) {
    case 'GROUP':
      return 'Phòng học nhóm';
    case 'PRESENTATION':
      return 'Phòng thuyết trình';
    case 'VIDEO':
    case 'VIDEO_ROOM':
      return 'Phòng video';
    case 'STUDY':
    case 'SELF_STUDY':
    case 'INDIVIDUAL':
      return 'Phòng tự học';
    case 'CONFERENCE':
      return 'Phòng hội nghị';
    default:
      return code || 'Phòng học';
  }
};

const mapFloorNumberToCode = (floor?: number): string => {
  if (floor === undefined || floor === null || floor === 0) return 'G - Floor';
  if (floor === 1) return '1st - Floor';
  if (floor === 2) return '2nd - Floor';
  if (floor === 3) return '3rd - Floor';
  return `${floor}th - Floor`;
};

export const normalizeRoom = (r: any): Room => {
  const floor = r.floorNumber ?? r.floor ?? 0;
  return {
    id: String(r.roomId || r.id || ''),
    roomCode: r.roomCode || '',
    roomType: r.roomType || mapRoomTypeCodeToType(r.roomTypeCode),
    building: r.buildingName || r.building || 'Tòa L',
    floor,
    floorCode: r.floorCode || mapFloorNumberToCode(floor),
    capacity: r.capacity || 0,
    status: (r.status || r.baseStatus || 'AVAILABLE') as any,
    devices: (r.equipments || r.devices || []).map((e: any) => ({
      id: String(e.equipmentId || e.id || ''),
      name: e.equipmentName || e.name || 'Thiết bị',
      status: e.status || e.equipmentStatus || 'GOOD',
      category: e.equipmentType || e.category || 'OTHER',
    })),
    description: r.description,
    minOccupancy: r.minOccupancy,
    maintenance: r.status === 'MAINTENANCE' || r.maintenance,
    maintenanceReason: r.maintenanceReason,
    requiresApproval: r.requiresApproval || r.roomTypeCode === 'CONFERENCE',
  };
};

export const getRoomsApi = async (params: GetRoomsParams): Promise<ApiEnvelope<Paginated<Room>>> => {
  const res: any = await axiosClient.get('/rooms', { params });
  let rawList: any[] = [];
  if (Array.isArray(res.data)) {
    rawList = res.data;
  } else if (res.data?.items && Array.isArray(res.data.items)) {
    rawList = res.data.items;
  } else if (Array.isArray(res.items)) {
    rawList = res.items;
  }

  const items = rawList.map(normalizeRoom);
  const pagination = res.pagination || res.data?.pagination || {
    page: 1,
    limit: items.length || 100,
    totalElements: items.length,
    totalPages: 1,
  };

  return {
    ...res,
    data: {
      items,
      pagination,
    },
  };
};

export const getFloorMapApi = async (floorId: string, date?: string, time?: string): Promise<ApiEnvelope<FloorData>> => {
  const floorNum = parseInt(String(floorId).replace(/\D/g, ''), 10) || 0;
  const baseFloor = campusFloors.find((f) => f.floorNumber === floorNum) || campusFloors[0];

  try {
    const res: any = await axiosClient.get(`/floors/${floorId}/map`, { params: { date, time } });
    let rooms: Room[] = baseFloor.rooms || [];
    if (res.data?.rooms && Array.isArray(res.data.rooms) && res.data.rooms.length > 0) {
      rooms = res.data.rooms.map(normalizeRoom);
    }
    return {
      ...res,
      data: {
        ...baseFloor,
        ...(res.data || {}),
        floorNumber: floorNum,
        floorCode: res.data?.floorCode || baseFloor.floorCode,
        description: res.data?.description || baseFloor.description,
        mapImage: res.data?.mapImage || baseFloor.mapImage,
        otherZones: res.data?.otherZones || baseFloor.otherZones,
        rooms,
        totalRooms: rooms.length || baseFloor.totalRooms,
        availableRooms: rooms.filter((r) => r.status === 'AVAILABLE').length,
      },
    };
  } catch (err) {
    return {
      success: true,
      code: 200,
      message: 'OK',
      data: {
        ...baseFloor,
        floorNumber: floorNum,
        rooms: baseFloor.rooms || [],
      },
      timestamp: new Date().toISOString(),
    };
  }
};

export const getRoomBookingsApi = async (roomId: string, date: string): Promise<ApiEnvelope<Booking[]>> => {
  return axiosClient.get(`/rooms/${roomId}/bookings`, { params: { date } });
};

export const getRoomBookingsRangeApi = async (roomId: string, startDate: string, endDate: string): Promise<ApiEnvelope<Booking[]>> => {
  return axiosClient.get(`/rooms/${roomId}/bookings`, { params: { startDate, endDate } });
};

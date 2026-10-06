export type RoomStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'SELF_BOOKED';

export interface RoomDevice {
  id: string;
  name: string;
  status: 'GOOD' | 'BROKEN' | 'REPAIRING';
}

export interface Room {
  id: string;
  roomCode: string;
  roomType: string;
  building: string;
  floor: number;
  floorCode: string; // "G - Floor", "1st - Floor", etc.
  capacity: number;
  status: RoomStatus;
  devices: RoomDevice[];
  description?: string;
  minOccupancy?: number;
  colorCode?: string;
}

export type BookingStatus = 'CONFIRMED' | 'IN_USE' | 'CANCELLED_AUTO' | 'COMPLETED' | 'PENDING_APPROVAL' | 'CANCELLED_USER' | 'CANCELLED_ADMIN';

export interface Booking {
  id: string;
  roomId: string;
  roomCode: string;
  roomType: string;
  building: string;
  floor: number;
  floorCode: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  date: string;      // YYYY-MM-DD
  numberOfPeople: number;
  purpose: string;
  qrCode: string;
  status: BookingStatus;
  checkInTime?: string;
  createdAt: string;
}

export interface FloorData {
  floorNumber: number;
  floorCode: string; // Strictly "G - Floor", "1st - Floor", "2nd - Floor", "3rd - Floor", "4th - Floor", "5th - Floor"
  description: string;
  mapImage: string;
  otherZones: string[];
  totalRooms: number;
  availableRooms: number;
  rooms: Room[];
}

export interface RegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  studentCode: string;
  faculty: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

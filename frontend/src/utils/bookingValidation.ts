import { MIN_DURATION_MIN, ALLOWED_DURATIONS, OCC_MIN_RATIO, MIN_PURPOSE_LENGTH, FLOOR_HOURS } from '../config/bookingRules';

export const minOccupancy = (capacity: number): number => {
  return Math.ceil(OCC_MIN_RATIO * capacity);
};

export const durationMinutes = (start: string, end: string): number => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
};

export interface BookingInput {
  start: string; // HH:mm
  end: string; // HH:mm
  purpose: string;
  participantsCount: number;
  participantIds: string[];
}

export interface RoomInfo {
  capacity: number;
  floor: number;
}

export const validateBookingForm = (input: BookingInput, room: RoomInfo): Record<string, string> => {
  const errors: Record<string, string> = {};

  const startMinutes = input.start.split(':').map(Number);
  const endMinutes = input.end.split(':').map(Number);
  
  if (startMinutes.length !== 2 || endMinutes.length !== 2) {
      errors.time = "Thời gian không hợp lệ.";
      return errors;
  }

  const duration = durationMinutes(input.start, input.end);

  if (duration <= 0) {
    errors.time = "Thời gian bắt đầu phải trước thời gian kết thúc.";
  } else if (startMinutes[1] !== 0 && startMinutes[1] !== 30) {
    errors.time = "Phút của thời gian bắt đầu phải là 00 hoặc 30.";
  } else if (endMinutes[1] !== 0 && endMinutes[1] !== 30) {
    errors.time = "Phút của thời gian kết thúc phải là 00 hoặc 30.";
  } else if (duration < MIN_DURATION_MIN) {
    errors.time = "Thời gian đặt phòng tối thiểu là 1 giờ 30 phút.";
  } else if (!ALLOWED_DURATIONS.includes(duration)) {
    errors.time = "Phòng này chỉ được đặt 1 giờ 30 phút hoặc 2 giờ / lượt.";
  } else {
    // Check floor hours
    const hours = FLOOR_HOURS[room.floor];
    if (hours) {
        const floorOpen = hours.open.split(':').map(Number);
        const floorClose = hours.close.split(':').map(Number);
        const startTotal = startMinutes[0] * 60 + startMinutes[1];
        const endTotal = endMinutes[0] * 60 + endMinutes[1];
        const openTotal = floorOpen[0] * 60 + floorOpen[1];
        const closeTotal = floorClose[0] * 60 + floorClose[1];

        if (startTotal < openTotal || endTotal > closeTotal) {
            errors.time = `Tầng ${room.floor} chỉ mở cửa từ ${hours.open} đến ${hours.close}.`;
        }
    }
  }

  if (input.purpose.trim().length < MIN_PURPOSE_LENGTH) {
    errors.purpose = `Mục đích sử dụng phải dài ít nhất ${MIN_PURPOSE_LENGTH} ký tự.`;
  }

  const minOcc = minOccupancy(room.capacity);
  if (!Number.isInteger(input.participantsCount) || input.participantsCount < minOcc || input.participantsCount > room.capacity) {
    errors.participantsCount = `Số người phải là số nguyên từ ${minOcc} đến ${room.capacity}.`;
  }

  if (room.capacity >= 2) {
    if (input.participantIds.length !== input.participantsCount) {
        errors.participantIds = "Số lượng MSSV không khớp với số người đăng ký.";
    } else {
        const uniqueIds = new Set(input.participantIds);
        if (uniqueIds.size !== input.participantIds.length) {
            errors.participantIds = "MSSV không được trùng lặp.";
        } else {
            const invalidId = input.participantIds.find(id => !/^\\d{8}$/.test(id));
            if (invalidId) {
                errors.participantIds = "Mỗi MSSV phải gồm đúng 8 chữ số.";
            }
        }
    }
  }

  return errors;
};

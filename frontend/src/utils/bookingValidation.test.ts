import { describe, it, expect } from 'vitest';
import { validateBookingForm, BookingInput, RoomInfo } from './bookingValidation';
import { FLOOR_HOURS } from '../config/bookingRules';

describe('bookingValidation', () => {
  it('should invalidate duration < 90 minutes (e.g. 60 minutes)', () => {
    const input: BookingInput = {
      start: '09:00', end: '10:00', purpose: 'Học nhóm SE', participantsCount: 2, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    const result = validateBookingForm(input, room);
    expect(result.time).toBe('Thời gian đặt phòng tối thiểu là 1 giờ 30 phút.');
  });

  it('should validate duration of 90 and 120 minutes', () => {
    // 90 minutes
    let input: BookingInput = {
      start: '09:00', end: '10:30', purpose: 'Học nhóm thiết kế phần mềm', participantsCount: 2, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    let result = validateBookingForm(input, room);
    expect(result.time).toBeUndefined();

    // 120 minutes
    input = { ...input, end: '11:00' };
    result = validateBookingForm(input, room);
    expect(result.time).toBeUndefined();
  });

  it('should invalidate duration of 100 minutes', () => {
    const input: BookingInput = {
      start: '09:00', end: '10:40', purpose: 'Học nhóm thiết kế', participantsCount: 2, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    const result = validateBookingForm(input, room);
    expect(result.time).toBe('Phút của thời gian kết thúc phải là 00 hoặc 30.');
  });

  it('should invalidate minutes other than :00 or :30', () => {
    const input: BookingInput = {
      start: '09:15', end: '10:45', purpose: 'Học nhóm thiết kế', participantsCount: 2, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    const result = validateBookingForm(input, room);
    expect(result.time).toBe('Phút của thời gian bắt đầu phải là 00 hoặc 30.');
  });

  it('capacity 9 requires minimum 5 people, capacity 1 requires minimum 1', () => {
    // capacity 9 (5 is valid, 4 is invalid)
    let input: BookingInput = {
      start: '09:00', end: '10:30', purpose: 'Học nhóm thiết kế phần mềm', participantsCount: 4, participantIds: ['11111111', '22222222', '33333333', '44444444']
    };
    let room: RoomInfo = { capacity: 9, floor: 1 };
    let result = validateBookingForm(input, room);
    expect(result.participantsCount).toContain('Số người phải là số nguyên từ 5 đến 9');

    // capacity 1
    input = { ...input, participantsCount: 0, participantIds: [] };
    room = { capacity: 1, floor: 1 };
    result = validateBookingForm(input, room);
    expect(result.participantsCount).toContain('Số người phải là số nguyên từ 1 đến 1');
  });

  it('should invalidate missing student codes', () => {
    const input: BookingInput = {
      start: '09:00', end: '10:30', purpose: 'Học nhóm thiết kế', participantsCount: 3, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    const result = validateBookingForm(input, room);
    expect(result.participantIds).toBe('Số lượng MSSV không khớp với số người đăng ký.');
  });

  it('should invalidate duplicate student codes', () => {
    const input: BookingInput = {
      start: '09:00', end: '10:30', purpose: 'Học nhóm thiết kế', participantsCount: 2, participantIds: ['12345678', '12345678']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    const result = validateBookingForm(input, room);
    expect(result.participantIds).toBe('MSSV không được trùng lặp.');
  });

  it('should invalidate booking outside operating hours (e.g., 17:30 at floor 3)', () => {
    const input: BookingInput = {
      start: '17:30', end: '19:00', purpose: 'Học nhóm thiết kế', participantsCount: 2, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 3 };
    const result = validateBookingForm(input, room);
    // Tùy theo FLOOR_HOURS của floor 3, nếu close là 17:00
    const hours = FLOOR_HOURS[3];
    expect(result.time).toBe(`Tầng 3 chỉ mở cửa từ ${hours.open} đến ${hours.close}.`);
  });

  it('should invalidate purpose < 10 characters', () => {
    const input: BookingInput = {
      start: '09:00', end: '10:30', purpose: 'Học nhóm', participantsCount: 2, participantIds: ['12345678', '87654321']
    };
    const room: RoomInfo = { capacity: 4, floor: 1 };
    const result = validateBookingForm(input, room);
    expect(result.purpose).toContain('Mục đích sử dụng phải dài ít nhất 10 ký tự');
  });
});

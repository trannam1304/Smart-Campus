import { RoomStatus } from '../types/booking';

export interface RoomColorInfo {
  fill: string;
  stroke: string;
  text: string;
  label: string;
  bgHex: string; // for HTML backgrounds
}

export const getRoomColor = (status: RoomStatus, serverColorCode?: string): RoomColorInfo => {
  if (serverColorCode) {
    return {
      fill: serverColorCode + '80', // adding opacity 50%
      stroke: serverColorCode,
      text: serverColorCode,
      label: status,
      bgHex: serverColorCode
    };
  }

  switch (status) {
    case 'AVAILABLE':
      return {
        fill: 'rgba(34, 197, 94, 0.4)', // #22C55E 40%
        stroke: '#22C55E',
        text: '#14532d',
        label: 'Trống',
        bgHex: '#22C55E'
      };
    case 'BOOKED':
      return {
        fill: 'rgba(239, 68, 68, 0.4)', // #EF4444 40%
        stroke: '#EF4444',
        text: '#7f1d1d',
        label: 'Đã đặt',
        bgHex: '#EF4444'
      };
    case 'MAINTENANCE':
      return {
        fill: 'rgba(234, 179, 8, 0.4)', // #EAB308 40%
        stroke: '#EAB308',
        text: '#713f12',
        label: 'Bảo trì',
        bgHex: '#EAB308'
      };
    case 'SELF_BOOKED':
      return {
        fill: 'rgba(59, 130, 246, 0.4)', // #3B82F6 40%
        stroke: '#3B82F6',
        text: '#1e3a8a',
        label: 'Bạn đã đặt',
        bgHex: '#3B82F6'
      };
    default:
      return {
        fill: 'rgba(156, 163, 175, 0.4)',
        stroke: '#9CA3AF',
        text: '#1f2937',
        label: 'Không xác định',
        bgHex: '#9CA3AF'
      };
  }
};

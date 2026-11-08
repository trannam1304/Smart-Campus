// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';
import { FloorData } from '../../types/booking';

// Mock getFloorMapApi
vi.mock('../../api/roomApi', () => ({
  getFloorMapApi: vi.fn(),
}));

import { getFloorMapApi } from '../../api/roomApi';

const mockFloor3: FloorData = {
  floorNumber: 3,
  floorCode: '3rd - Floor',
  description: 'Tầng 3',
  mapImage: '/assets/floors/image6.png',
  otherZones: ['Khu tự học'],
  totalRooms: 6,
  availableRooms: 6,
  rooms: [
    {
      id: 'r-301',
      roomCode: 'L.301',
      roomType: 'Phòng học nhỏ',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 8,
      status: 'AVAILABLE',
      devices: [{ id: 'd-1', name: 'Máy chiếu', status: 'GOOD' }],
    },
    {
      id: 'r-302',
      roomCode: 'L.302',
      roomType: 'Phòng học nhỏ',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 8,
      status: 'AVAILABLE',
      devices: [],
    },
    {
      id: 'r-303',
      roomCode: 'L.303',
      roomType: 'Phòng học nhỏ',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 8,
      status: 'BOOKED',
      devices: [],
    },
    {
      id: 'r-304',
      roomCode: 'L.304',
      roomType: 'Phòng thảo luận',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 12,
      status: 'AVAILABLE',
      devices: [],
    },
    {
      id: 'r-305',
      roomCode: 'L.305',
      roomType: 'Phòng thảo luận',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 12,
      status: 'MAINTENANCE',
      devices: [],
    },
    {
      id: 'r-306',
      roomCode: 'L.306',
      roomType: 'Phòng thảo luận',
      building: 'Tòa L',
      floor: 3,
      floorCode: '3rd - Floor',
      capacity: 12,
      status: 'SELF_BOOKED',
      devices: [],
    },
  ],
};

describe('InteractiveFloorPlan', () => {
  const onBookRoomMock = vi.fn();
  const onViewScheduleMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFloorMapApi).mockResolvedValue({
      success: true,
      code: 200,
      message: 'OK',
      data: mockFloor3,
      timestamp: new Date().toISOString(),
    });
  });

  it('renders in normal mode: no <img> tag, room rect count equals room count, and has "Thang máy" text', async () => {
    const { container } = render(
      <InteractiveFloorPlan
        floorId="3"
        onBookRoom={onBookRoomMock}
        onViewSchedule={onViewScheduleMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thang máy')).toBeTruthy();
    });

    // 1. Không có thẻ <img> ở chế độ thường
    expect(container.querySelector('img')).toBeNull();

    // 2. Số rect phòng (role="button") bằng số phòng (6)
    const roomRects = container.querySelectorAll('rect[role="button"]');
    expect(roomRects).toHaveLength(mockFloor3.rooms.length);

    // 3. Có chữ "Thang máy"
    expect(screen.getByText('Thang máy')).toBeTruthy();

    // 4. Có text mã phòng cho từng phòng
    for (const room of mockFloor3.rooms) {
      expect(screen.getByText(room.roomCode)).toBeTruthy();
    }
  });

  it('allows clicking an available room to open details and trigger booking', async () => {
    const { container } = render(
      <InteractiveFloorPlan
        floorId="3"
        onBookRoom={onBookRoomMock}
        onViewSchedule={onViewScheduleMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('L.301')).toBeTruthy();
    });

    const roomRect = container.querySelector('rect[aria-label="Phòng L.301 – Trống"]');
    expect(roomRect).not.toBeNull();
    fireEvent.click(roomRect!);

    await waitFor(() => {
      expect(screen.getByText('Đặt phòng này')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Đặt phòng này'));
    expect(onBookRoomMock).toHaveBeenCalledTimes(1);
    expect(onBookRoomMock).toHaveBeenCalledWith(
      expect.objectContaining({ roomCode: 'L.301' }),
      expect.any(String),
      expect.any(String),
    );
  });
});

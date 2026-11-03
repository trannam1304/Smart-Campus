// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RoomUtilizationTable } from './RoomUtilizationTable';
import { RoomUtilizationItem } from '../../utils/adminAnalytics';

describe('RoomUtilizationTable', () => {
  afterEach(() => {
    cleanup();
  });
  const sampleItems: RoomUtilizationItem[] = [
    {
      roomId: 'r-1',
      roomCode: 'L.101',
      roomType: 'Phòng học thuyết trình',
      floorNumber: 1,
      floorCode: '1st - Floor',
      isMaintenance: false,
      totalBookedMinutes: 120,
      totalOpenMinutes: 750,
      percentage: 16,
    },
    {
      roomId: 'r-2',
      roomCode: 'L.102',
      roomType: 'Phòng học nhóm',
      floorNumber: 1,
      floorCode: '1st - Floor',
      isMaintenance: true,
      totalBookedMinutes: 0,
      totalOpenMinutes: 750,
      percentage: 0,
    },
  ];

  it('renders loading state when isLoading is true', () => {
    render(
      <RoomUtilizationTable
        items={[]}
        selectedDate="2026-11-02"
        isLoading={true}
      />
    );
    expect(screen.getByText('Đang tính toán tỷ lệ sử dụng phòng...')).toBeTruthy();
  });

  it('renders empty message when items array is empty', () => {
    render(
      <RoomUtilizationTable
        items={[]}
        selectedDate="2026-11-02"
        isLoading={false}
      />
    );
    expect(screen.getByText('Không có dữ liệu phòng nào được ghi nhận.')).toBeTruthy();
  });

  it('renders rows for rooms with ranking, room code, room type, floor badge and utilization or maintenance badge', () => {
    const { container } = render(
      <RoomUtilizationTable
        items={sampleItems}
        selectedDate="2026-11-02"
        isLoading={false}
      />
    );

    // Header & Subtitle
    expect(screen.getByText('Tỷ lệ sử dụng từng phòng')).toBeTruthy();
    expect(screen.getByText(/Mật độ đặt phòng ngày 2026-11-02 \(2 phòng\)/)).toBeTruthy();

    // Row 1: L.101
    expect(screen.getByText('L.101')).toBeTruthy();
    expect(screen.getByText('Phòng học thuyết trình')).toBeTruthy();
    expect(screen.getByText('16%')).toBeTruthy();

    // Row 2: L.102 (Maintenance)
    expect(screen.getByText('L.102')).toBeTruthy();
    expect(screen.getByText('Phòng học nhóm')).toBeTruthy();
    expect(screen.getByText('Bảo trì')).toBeTruthy();

    // Scrollable container with max-h-[28rem]
    const scrollContainer = container.querySelector('.max-h-\\[28rem\\]');
    expect(scrollContainer).not.toBeNull();
  });
});

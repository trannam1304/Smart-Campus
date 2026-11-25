// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MonthlyStudentDensityChart } from './MonthlyStudentDensityChart';
import { MonthlyStudentDensityResult } from '../../utils/adminAnalytics';

describe('MonthlyStudentDensityChart', () => {
  beforeAll(() => {
    // Polyfill ResizeObserver for Recharts ResponsiveContainer in jsdom
    if (typeof window !== 'undefined' && !window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  });

  afterEach(() => {
    cleanup();
  });

  const sampleData: MonthlyStudentDensityResult = {
    month: '2026-11',
    days: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      date: `2026-11-${String(i + 1).padStart(2, '0')}`,
      label: String(i + 1).padStart(2, '0'),
      studentCount: i === 4 ? 12 : 0,
      bookingCount: i === 4 ? 2 : 0,
    })),
    totalStudents: 12,
    totalBookings: 2,
    peakDay: '05/11',
    peakStudents: 12,
  };

  it('renders header, summary badges, and notifies on month change', () => {
    const onMonthChange = vi.fn();
    render(
      <MonthlyStudentDensityChart
        data={sampleData}
        selectedMonth="2026-11"
        onMonthChange={onMonthChange}
      />
    );

    expect(screen.getByText('Mật độ số lượng sinh viên đặt phòng các ngày theo tháng')).toBeTruthy();
    expect(screen.getByText(/Tổng: 12 SV \(2 lượt\)/)).toBeTruthy();
    expect(screen.getByText(/Cao điểm: 05\/11 \(12 SV\)/)).toBeTruthy();

    const monthInput = screen.getByLabelText(/Chọn tháng/i) as HTMLInputElement;
    expect(monthInput.value).toBe('2026-11');

    fireEvent.change(monthInput, { target: { value: '2026-12' } });
    expect(onMonthChange).toHaveBeenCalledWith('2026-12');
  });
});

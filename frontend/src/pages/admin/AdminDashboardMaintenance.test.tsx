// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { BookingProvider } from '../../context/BookingContext';
import { Room, Booking } from '../../types/booking';

// Mock API calls
vi.mock('../../api/adminApi', () => ({
  getAdminDashboardDataApi: vi.fn(),
  updateRoomStatusApi: vi.fn(),
  resolveIncidentApi: vi.fn(),
  approveBookingApi: vi.fn(),
  rejectBookingApi: vi.fn(),
  handleRegistrationApi: vi.fn(),
}));

vi.mock('../../api/roomApi', () => ({
  getRoomsApi: vi.fn(),
  getFloorMapApi: vi.fn(),
}));

import * as adminApi from '../../api/adminApi';
import * as roomApi from '../../api/roomApi';

describe('AdminDashboardPage - Maintenance Modal & Status Management', () => {
  const tomorrow = '2099-01-02';

  const mockRooms: Room[] = [
    {
      id: 'r-101',
      roomCode: 'L.101',
      roomType: 'Phòng học thuyết trình',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      capacity: 10,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-102',
      roomCode: 'L.102',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      capacity: 8,
      status: 'AVAILABLE',
      devices: [],
      maintenance: false,
    },
    {
      id: 'r-103',
      roomCode: 'L.103',
      roomType: 'Phòng thuyết trình',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      capacity: 9,
      status: 'MAINTENANCE',
      devices: [],
      maintenance: true,
      maintenanceReason: 'Máy chiếu hỏng, chờ thay thế',
    },
  ];

  const mockBookings: Booking[] = [
    {
      id: 'b-up-1',
      roomId: 'r-102',
      roomCode: 'L.102',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      studentId: 'u-1',
      studentName: 'Sinh viên 1',
      studentCode: '52100111',
      date: tomorrow,
      startTime: '08:00',
      endTime: '10:00',
      numberOfPeople: 5,
      purpose: 'Thảo luận',
      qrCode: 'QR-1',
      status: 'CONFIRMED',
      createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'b-up-2',
      roomId: 'r-102',
      roomCode: 'L.102',
      roomType: 'Phòng học nhóm',
      building: 'Tòa L',
      floor: 1,
      floorCode: '1st - Floor',
      studentId: 'u-2',
      studentName: 'Sinh viên 2',
      studentCode: '52100222',
      date: tomorrow,
      startTime: '13:00',
      endTime: '15:00',
      numberOfPeople: 4,
      purpose: 'Ôn tập',
      qrCode: 'QR-2',
      status: 'CONFIRMED',
      createdAt: '2026-10-10T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApi.getAdminDashboardDataApi).mockResolvedValue({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        bookings: mockBookings,
        incidents: [],
        registrations: [],
      },
      timestamp: new Date().toISOString(),
    });

    vi.mocked(roomApi.getRoomsApi).mockResolvedValue({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        items: mockRooms,
        pagination: {
          page: 1,
          limit: 10,
          totalElements: 3,
          totalPages: 1,
        },
      },
      timestamp: new Date().toISOString(),
    });

    vi.mocked(adminApi.updateRoomStatusApi).mockResolvedValue({
      success: true,
      code: 200,
      message: 'Cập nhật trạng thái thành công',
      data: {},
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderAdminRoomsTab = () => {
    return render(
      <MemoryRouter initialEntries={['/admin?tab=ROOMS']}>
        <BookingProvider>
          <AdminDashboardPage />
        </BookingProvider>
      </MemoryRouter>
    );
  };

  it('không có lý do thì nút xác nhận bị khóa; nhập lý do rồi xác nhận mới gọi API và truyền đúng lý do', async () => {
    renderAdminRoomsTab();

    await waitFor(() => {
      expect(screen.getByText('Phòng L.101')).toBeTruthy();
    });

    // Tìm phòng L.101 và bấm nút "Bảo Trì"
    const maintButtons = screen.getAllByRole('button', { name: /Bảo Trì/i });
    fireEvent.click(maintButtons[0]);

    // Popup mở ra với tiêu đề phòng L.101
    await waitFor(() => {
      expect(screen.getByText(/Chuyển phòng L\.101 sang bảo trì/i)).toBeTruthy();
    });

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Bảo trì/i }) as HTMLButtonElement;
    // Ban đầu chưa có lý do -> nút Xác nhận bị disabled
    expect(confirmBtn.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText(/Nhập chi tiết nguyên nhân phòng cần bảo trì/i) as HTMLTextAreaElement;

    // Nhập lý do quá ngắn (< 5 ký tự) -> vẫn disabled
    fireEvent.change(textarea, { target: { value: 'Hỏng' } });
    expect(confirmBtn.disabled).toBe(true);

    // Nhập lý do hợp lệ (>= 5 ký tự) -> enabled
    fireEvent.change(textarea, { target: { value: 'Hỏng máy chiếu và bóng đèn' } });
    expect(confirmBtn.disabled).toBe(false);

    // Bấm xác nhận
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminApi.updateRoomStatusApi).toHaveBeenCalledTimes(1);
      expect(adminApi.updateRoomStatusApi).toHaveBeenCalledWith(
        'r-101',
        'MAINTENANCE',
        'Hỏng máy chiếu và bóng đèn'
      );
    });
  });

  it('phòng có lượt đặt sắp tới hiện dòng cảnh báo "N lượt đặt sẽ bị hủy"', async () => {
    renderAdminRoomsTab();

    await waitFor(() => {
      expect(screen.getByText('Phòng L.102')).toBeTruthy();
    });

    // Phòng L.102 có 2 bookings sắp tới
    // Tìm các nút Bảo Trì, phòng L.102 là phòng thứ 2
    const maintButtons = screen.getAllByRole('button', { name: /Bảo Trì/i });
    fireEvent.click(maintButtons[1]);

    // Popup mở ra có cảnh báo đỏ "2 lượt đặt sẽ bị hủy"
    await waitFor(() => {
      expect(screen.getByText(/2 lượt đặt sẽ bị hủy/i)).toBeTruthy();
    });
  });

  it('bấm phòng bảo trì mở popup xem lý do, hiện mã phòng, lý do và nút Mở trống', async () => {
    renderAdminRoomsTab();

    await waitFor(() => {
      expect(screen.getByText('Phòng L.103')).toBeTruthy();
    });

    // Thẻ phòng L.103 có role="button" xem lý do bảo trì
    const viewBtn = screen.getByLabelText(/Xem lý do bảo trì phòng L\.103/i);
    fireEvent.click(viewBtn);

    // Popup xem lý do mở ra
    await waitFor(() => {
      expect(screen.getByText(/Thông tin bảo trì phòng L\.103/i)).toBeTruthy();
      expect(screen.getAllByText(/Máy chiếu hỏng, chờ thay thế/i).length).toBeGreaterThanOrEqual(2);
    });

    const dialog = screen.getByRole('dialog');
    // Có nút "Mở trống" trong modal
    const openBtn = within(dialog).getByRole('button', { name: /Mở trống/i });
    expect(openBtn).toBeTruthy();

    fireEvent.click(openBtn);
    await waitFor(() => {
      expect(adminApi.updateRoomStatusApi).toHaveBeenCalledWith('r-103', 'AVAILABLE', undefined);
    });
  });
});

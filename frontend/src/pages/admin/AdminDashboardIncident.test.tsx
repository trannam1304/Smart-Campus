// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { BookingProvider } from '../../context/BookingContext';
import { testRooms, testFloors } from '../../test/testFixtures';
import * as adminApi from '../../api/adminApi';
import * as roomApi from '../../api/roomApi';
import * as incidentApi from '../../api/incidentApi';

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

vi.mock('../../api/incidentApi', () => ({
  createIncidentApi: vi.fn(),
}));

describe('AdminDashboardPage - Tab INCIDENTS', () => {
  const initialIncidents = [
    {
      id: 'INC-01',
      roomId: 'r-103',
      roomCode: 'L.103',
      deviceName: 'Máy chiếu HDMI',
      reporterName: 'Trần Thành Phát',
      reporterCode: '52100777',
      description: 'Máy chiếu chớp tắt không lên hình',
      imageUrl: 'https://example.com/projector-broken.jpg',
      status: 'OPEN',
      createdAt: '2026-09-25 10:15',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.getAdminDashboardDataApi).mockResolvedValue({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        bookings: [],
        incidents: [...initialIncidents],
        kpis: {
          totalBookingsToday: 0,
          pendingApprovals: 0,
          activeNow: 0,
          openIncidents: 1,
        },
      },
      timestamp: new Date().toISOString(),
    });

    vi.mocked(roomApi.getRoomsApi).mockResolvedValue({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        items: testRooms,
        pagination: {
          page: 1,
          limit: 10,
          totalElements: testRooms.length,
          totalPages: 1,
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter initialEntries={['/admin?tab=INCIDENTS']}>
        <BookingProvider initialFloors={testFloors}>
          <AdminDashboardPage />
        </BookingProvider>
      </MemoryRouter>
    );
  };

  it('hiển thị danh sách sự cố với phòng, thiết bị, mô tả, người báo + MSSV, ngày giờ tạo và ảnh thu nhỏ', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Phòng L.103 • Máy chiếu HDMI/i)).toBeTruthy();
    });

    expect(screen.getByText('Máy chiếu chớp tắt không lên hình')).toBeTruthy();
    expect(screen.getByText(/Trần Thành Phát \(52100777\)/i)).toBeTruthy();
    expect(screen.getByText('25/09/2026 10:15')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Đã Sửa Xong' })).toBeTruthy();

    // Ảnh thu nhỏ 80x80
    const thumbBtn = screen.getByRole('button', { name: /Xem ảnh lớn sự cố/i });
    expect(thumbBtn).toBeTruthy();
    const img = thumbBtn.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/projector-broken.jpg');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  it('bấm vào ảnh thu nhỏ sẽ mở modal xem ảnh lớn', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Phòng L.103 • Máy chiếu HDMI/i)).toBeTruthy();
    });

    const thumbBtn = screen.getByRole('button', { name: /Xem ảnh lớn sự cố/i });
    fireEvent.click(thumbBtn);

    // Modal ảnh lớn hiển thị
    const dialogs = screen.getAllByRole('dialog');
    const imageDialog = dialogs[dialogs.length - 1];
    expect(imageDialog).toBeTruthy();

    const largeImg = within(imageDialog).getByRole('img');
    expect(largeImg.getAttribute('src')).toBe('https://example.com/projector-broken.jpg');
  });

  it('mở popup từ nút "Báo sự cố mới", gửi thành công thì popup đóng và danh sách có thêm sự cố', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Xử Lý Phản Ánh Sự Cố/i)).toBeTruthy();
    });

    // 1. Bấm nút "Báo sự cố mới"
    const openBtn = screen.getByRole('button', { name: /Báo sự cố mới/i });
    fireEvent.click(openBtn);

    // Modal xuất hiện
    expect(screen.getByText('Báo sự cố thiết bị mới')).toBeTruthy();

    // 2. Mock createIncidentApi và getAdminDashboardDataApi cho lần reload tiếp theo
    vi.mocked(incidentApi.createIncidentApi).mockResolvedValueOnce({
      success: true,
      code: 200,
      message: 'Báo cáo sự cố thành công',
      data: { incidentId: 'INC-02' },
      timestamp: new Date().toISOString(),
    });

    const updatedIncidents = [
      {
        id: 'INC-02',
        roomId: 'r-103',
        roomCode: 'L.103',
        deviceName: 'Máy chiếu',
        reporterName: 'Võ Minh Luân (QTV)',
        reporterCode: 'STAFF-01',
        description: 'Điều hòa không mát',
        imageUrl: '',
        status: 'OPEN',
        createdAt: '2026-11-02 18:00',
      },
      ...initialIncidents,
    ];

    vi.mocked(adminApi.getAdminDashboardDataApi).mockResolvedValueOnce({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        bookings: [],
        incidents: updatedIncidents,
        kpis: {
          totalBookingsToday: 0,
          pendingApprovals: 0,
          activeNow: 0,
          openIncidents: 2,
        },
      },
      timestamp: new Date().toISOString(),
    });

    // 3. Điền form
    const roomSelect = screen.getByLabelText(/Chọn Phòng Học Gặp Sự Cố/i) as HTMLSelectElement;
    fireEvent.change(roomSelect, { target: { value: 'r-103' } });

    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;
    await waitFor(() => expect(deviceSelect.disabled).toBe(false));
    expect(deviceSelect.options.length).toBeGreaterThan(1);
    fireEvent.change(deviceSelect, { target: { value: deviceSelect.options[1].value } });

    const descInput = screen.getByLabelText(/Mô Tả Hiện Trượng Lỗi/i);
    fireEvent.change(descInput, { target: { value: 'Điều hòa không mát' } });

    // 4. Bấm "Báo Sự Cố"
    const submitBtn = screen.getByRole('button', { name: 'Báo Sự Cố' });
    fireEvent.click(submitBtn);

    // 5. Kiểm tra: popup đóng, toast hiển thị, và sự cố mới xuất hiện
    await waitFor(() => {
      expect(screen.queryByText('Báo sự cố thiết bị mới')).toBeNull();
      expect(screen.getByText('Báo sự cố mới thành công!')).toBeTruthy();
      expect(screen.getByText('Phòng L.103 • Máy chiếu')).toBeTruthy();
      expect(screen.getByText('Điều hòa không mát')).toBeTruthy();
      expect(screen.getByText(/Võ Minh Luân \(QTV\) \(STAFF-01\)/i)).toBeTruthy();
    });
  });

  it('lọc danh sách sự cố theo trạng thái Chưa xử lý và Đã xử lý', async () => {
    const multiIncidents = [
      {
        id: 'INC-OPEN-1',
        roomId: 'r-103',
        roomCode: 'L.103',
        deviceName: 'Máy chiếu HDMI',
        reporterName: 'Sinh viên 1',
        description: 'Máy chiếu hỏng',
        status: 'OPEN',
        createdAt: '2026-09-25 10:15',
      },
      {
        id: 'INC-RESOLVED-1',
        roomId: 'r-201',
        roomCode: 'L.201',
        deviceName: 'Điều hòa Daikin',
        reporterName: 'Sinh viên 2',
        description: 'Điều hòa chảy nước đã sửa',
        status: 'RESOLVED',
        createdAt: '2026-09-24 15:30',
      },
    ];

    vi.mocked(adminApi.getAdminDashboardDataApi).mockResolvedValueOnce({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        bookings: [],
        incidents: multiIncidents,
        kpis: {
          totalBookingsToday: 0,
          pendingApprovals: 0,
          activeNow: 0,
          openIncidents: 1,
        },
      },
      timestamp: new Date().toISOString(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Máy chiếu hỏng')).toBeTruthy();
      expect(screen.getByText('Điều hòa chảy nước đã sửa')).toBeTruthy();
    });

    // Bấm nút "Chưa xử lý"
    const openFilterBtn = screen.getByRole('button', { name: /Chưa xử lý/i });
    fireEvent.click(openFilterBtn);

    expect(screen.getByText('Máy chiếu hỏng')).toBeTruthy();
    expect(screen.queryByText('Điều hòa chảy nước đã sửa')).toBeNull();

    // Bấm nút "Đã xử lý"
    const resolvedFilterBtn = screen.getByRole('button', { name: /Đã xử lý/i });
    fireEvent.click(resolvedFilterBtn);

    expect(screen.queryByText('Máy chiếu hỏng')).toBeNull();
    expect(screen.getByText('Điều hòa chảy nước đã sửa')).toBeTruthy();

    // Bấm "Tất cả sự cố"
    const allFilterBtn = screen.getByRole('button', { name: /Tất cả sự cố/i });
    fireEvent.click(allFilterBtn);

    expect(screen.getByText('Máy chiếu hỏng')).toBeTruthy();
    expect(screen.getByText('Điều hòa chảy nước đã sửa')).toBeTruthy();
  });

  it('lọc danh sách sự cố theo ô tìm kiếm và đặt lại bộ lọc', async () => {
    const multiIncidents = [
      {
        id: 'INC-1',
        roomId: 'r-103',
        roomCode: 'L.103',
        deviceName: 'Máy chiếu HDMI',
        reporterName: 'Nguyễn Văn A',
        description: 'Máy chiếu không lên nguồn',
        status: 'OPEN',
        createdAt: '2026-09-25 10:15',
      },
      {
        id: 'INC-2',
        roomId: 'r-505',
        roomCode: 'L.505',
        deviceName: 'Bàn ghế học tập',
        reporterName: 'Trần Thị B',
        description: 'Gãy chân bàn',
        status: 'OPEN',
        createdAt: '2026-09-24 15:30',
      },
    ];

    vi.mocked(adminApi.getAdminDashboardDataApi).mockResolvedValueOnce({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        bookings: [],
        incidents: multiIncidents,
        kpis: {
          totalBookingsToday: 0,
          pendingApprovals: 0,
          activeNow: 0,
          openIncidents: 2,
        },
      },
      timestamp: new Date().toISOString(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Máy chiếu không lên nguồn')).toBeTruthy();
      expect(screen.getByText('Gãy chân bàn')).toBeTruthy();
    });

    // Tìm kiếm theo "L.505"
    const searchInput = screen.getByPlaceholderText(/Tìm theo phòng/i);
    fireEvent.change(searchInput, { target: { value: 'L.505' } });

    expect(screen.queryByText('Máy chiếu không lên nguồn')).toBeNull();
    expect(screen.getByText('Gãy chân bàn')).toBeTruthy();

    // Bấm nút Đặt lại
    const resetBtn = screen.getByRole('button', { name: /Đặt lại/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText('Máy chiếu không lên nguồn')).toBeTruthy();
    expect(screen.getByText('Gãy chân bàn')).toBeTruthy();
  });

  it('tách riêng tab INCIDENTS (không chứa Quản Lý Người Vi Phạm) và tab VIOLATIONS hiển thị Quản Lý Người Vi Phạm', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Xử Lý Phản Ánh Sự Cố/i)).toBeTruthy();
    });

    expect(screen.queryByText(/Quản Lý Người Vi Phạm & Khiếu Nại/i)).toBeNull();

    cleanup();
    render(
      <MemoryRouter initialEntries={['/admin?tab=VIOLATIONS']}>
        <BookingProvider initialFloors={testFloors}>
          <AdminDashboardPage />
        </BookingProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Quản Lý Người Vi Phạm & Khiếu Nại/i)).toBeTruthy();
    });
    expect(screen.queryByText(/Xử Lý Phản Ánh Sự Cố/i)).toBeNull();
  });

  it('hiển thị đúng ảnh base64 thô (không có prefix data:image) trong danh sách sự cố', async () => {
    vi.mocked(adminApi.getAdminDashboardDataApi).mockResolvedValueOnce({
      success: true,
      code: 200,
      message: 'OK',
      data: {
        bookings: [],
        incidents: [
          {
            id: 'INC-B64',
            roomId: 'r-103',
            roomCode: 'L.103',
            deviceName: 'Máy chiếu',
            reporterName: 'Sinh viên Test',
            description: 'Ảnh base64 thô',
            imageUrl: '/9j/4AAQSkZJRgABAQAAAQABAAD',
            status: 'OPEN',
            createdAt: '2026-09-25 10:15',
          },
        ],
        kpis: { totalBookingsToday: 0, pendingApprovals: 0, activeNow: 0, openIncidents: 1 },
      },
      timestamp: new Date().toISOString(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Ảnh base64 thô')).toBeTruthy();
    });

    const thumbBtn = screen.getByRole('button', { name: /Xem ảnh lớn sự cố: Ảnh base64 thô/i });
    const img = thumbBtn.querySelector('img');
    expect(img?.getAttribute('src')).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD');
  });
});

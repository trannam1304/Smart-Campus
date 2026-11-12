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
});

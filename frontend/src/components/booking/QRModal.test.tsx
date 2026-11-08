// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QRModal } from './QRModal';
import { AuthContext } from '../../context/AuthContext';
import { Booking } from '../../types/booking';

describe('QRModal - Member Specific QR Display', () => {
  afterEach(() => {
    cleanup();
  });
  const mockBooking: Booking = {
    id: 'BK-8901',
    roomId: 'r-102',
    roomCode: 'L.102',
    roomType: 'Phòng thuyết trình',
    building: 'Tòa L',
    floor: 1,
    floorCode: '1st - Floor',
    studentId: 'u-student-01',
    studentName: 'La Thái Thành',
    studentCode: '52100888',
    startTime: '09:00',
    endTime: '11:00',
    date: '2026-11-02',
    numberOfPeople: 2,
    purpose: 'Học nhóm',
    qrCode: 'SMART-CAMPUS-BK-8901-52100888',
    status: 'CONFIRMED',
    createdAt: '2026-11-01T14:30:00Z',
    members: [
      {
        studentCode: '52100888',
        studentName: 'La Thái Thành',
        qrCode: 'SMART-CAMPUS-BK-8901-52100888',
      },
      {
        studentCode: '52100666',
        studentName: 'Nguyễn Hoàng Nam',
        qrCode: 'SMART-CAMPUS-BK-8901-52100666',
      },
    ],
  };

  const renderWithAuth = (user: any, booking: any) => {
    return render(
      <AuthContext.Provider
        value={{
          user,
          token: 'mock-token',
          isAuthenticated: !!user,
          isLoading: false,
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <QRModal isOpen={true} onClose={vi.fn()} booking={booking} />
      </AuthContext.Provider>
    );
  };

  it('1. Hiển thị mã QR và thông tin của người đang đăng nhập (chủ phòng)', () => {
    const currentUser = {
      id: 'u-student-01',
      fullName: 'La Thái Thành',
      studentCode: '52100888',
      role: 'STUDENT',
    };

    const { container } = renderWithAuth(currentUser, mockBooking);

    // Hiển thị tên và MSSV của La Thái Thành
    expect(screen.getByText(/La Thái Thành/i)).toBeTruthy();
    expect(screen.getByText(/\(52100888\)/)).toBeTruthy();

    // Hiển thị mã dự phòng của La Thái Thành
    expect(screen.getByText('SMART-CAMPUS-BK-8901-52100888')).toBeTruthy();

    // KHÔNG chứa mã hay thông tin của Nguyễn Hoàng Nam (52100666)
    expect(screen.queryByText('SMART-CAMPUS-BK-8901-52100666')).toBeNull();
    expect(container.textContent).not.toContain('52100666');
    expect(container.textContent).not.toContain('Nguyễn Hoàng Nam');
  });

  it('2. Hiển thị mã QR của thành viên khi thành viên đó đăng nhập; không chứa mã của chủ phòng', () => {
    const memberUser = {
      id: 'u-student-02',
      fullName: 'Nguyễn Hoàng Nam',
      studentCode: '52100666',
      role: 'STUDENT',
    };

    const { container } = renderWithAuth(memberUser, mockBooking);

    // Hiển thị tên và MSSV của Nguyễn Hoàng Nam
    expect(screen.getByText(/Nguyễn Hoàng Nam/i)).toBeTruthy();
    expect(screen.getByText(/\(52100666\)/)).toBeTruthy();

    // Hiển thị mã dự phòng của thành viên
    expect(screen.getByText('SMART-CAMPUS-BK-8901-52100666')).toBeTruthy();

    // KHÔNG chứa mã của chủ phòng La Thái Thành
    expect(screen.queryByText('SMART-CAMPUS-BK-8901-52100888')).toBeNull();
    expect(container.textContent).not.toContain('52100888');
    expect(container.textContent).not.toContain('La Thái Thành');
  });

  it('3. Người dùng không có trong danh sách thành viên -> báo lỗi và KHÔNG vẽ mã QR', () => {
    const strangerUser = {
      id: 'u-stranger',
      fullName: 'Người Ngoài Danh Sách',
      studentCode: '52100999',
      role: 'STUDENT',
    };

    const { container } = renderWithAuth(strangerUser, mockBooking);

    expect(
      screen.getByText('Bạn không có trong danh sách thành viên của lượt đặt này')
    ).toBeTruthy();

    // Không render mã dự phòng của bất kỳ ai
    expect(container.textContent).not.toContain('SMART-CAMPUS-BK-8901');
    expect(container.textContent).not.toContain('Mã dự phòng (Nhập tay)');
  });

  it('4. Hỗ trợ dữ liệu CreateBookingResponse vừa đặt xong với memberQrCodes', () => {
    const currentUser = {
      id: 'u-student-01',
      fullName: 'La Thái Thành',
      studentCode: '52100888',
      role: 'STUDENT',
    };

    const createResponse = {
      bookingId: 'BK-9999',
      roomCode: 'L.201',
      bookingStatus: 'CONFIRMED',
      qrCodeData: 'SMART-CAMPUS-BK-9999-52100888',
      qrCodeImageBase64: '',
      checkInWindow: {
        allowEarlyFrom: '07:15',
        deadlineAt: '07:45',
      },
      memberQrCodes: [
        { studentCode: '52100888', qrCodeData: 'SMART-CAMPUS-BK-9999-52100888' },
        { studentCode: '52100666', qrCodeData: 'SMART-CAMPUS-BK-9999-52100666' },
      ],
    };

    const { container } = renderWithAuth(currentUser, createResponse);

    expect(screen.getByText('SMART-CAMPUS-BK-9999-52100888')).toBeTruthy();
    expect(screen.queryByText('SMART-CAMPUS-BK-9999-52100666')).toBeNull();
    expect(container.textContent).not.toContain('52100666');
  });
});

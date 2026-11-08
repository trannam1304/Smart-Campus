// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BookingModal } from './BookingModal';
import { AuthContext } from '../../context/AuthContext';
import { ToastProvider } from '../../hooks/useToast';
import { Room } from '../../types/booking';

// Mock scrollIntoView in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('BookingModal', () => {
  const mockUser = {
    id: 'u-1',
    fullName: 'Nguyễn Văn A',
    email: 'nva@student.university.edu.vn',
    studentCode: '52100888',
    role: 'STUDENT' as const,
    isLocked: false,
    libraryTrained: true,
  };

  const mockRoom40: Room = {
    id: 'r-506',
    roomCode: 'L.506',
    roomType: 'Phòng hội nghị',
    building: 'Tòa L',
    floor: 5,
    floorCode: '5th - Floor',
    capacity: 40,
    status: 'AVAILABLE',
    devices: [],
    requiresApproval: true,
  };

  const mockAuthContextValue = {
    user: mockUser,
    token: 'fake-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  const renderBookingModal = (room: Room = mockRoom40) => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    const utils = render(
      <ToastProvider>
        <AuthContext.Provider value={mockAuthContextValue}>
          <BookingModal
            isOpen={true}
            onClose={handleClose}
            room={room}
            onSuccess={handleSuccess}
          />
        </AuthContext.Provider>
      </ToastProvider>
    );

    return { ...utils, handleSuccess, handleClose };
  };

  it('hiển thị form đặt phòng sức chứa 40 với lưới 2 cột cho danh sách MSSV và footer cố định', () => {
    renderBookingModal(mockRoom40);

    expect(screen.getByText(/Đặt phòng L.506/i)).toBeDefined();

    // Nút submit "Xác nhận đặt phòng" nằm ở footer, gắn form="booking-form"
    const submitBtn = screen.getByRole('button', { name: /Xác nhận đặt phòng/i });
    expect(submitBtn.getAttribute('form')).toBe('booking-form');

    // Sức chứa 40 -> min là ceil(0.5 * 40) = 20 người
    // Số ô MSSV ban đầu là 20 (>= 5 nên dùng grid 2 cột sm:grid-cols-2)
    const inputs = screen.getAllByPlaceholderText(/MSSV người/i);
    expect(inputs.length).toBe(20);

    // Ô đầu tiên là của người đặt và bị khóa
    expect(inputs[0].getAttribute('disabled')).not.toBeNull();
    expect((inputs[0] as HTMLInputElement).value).toBe('52100888');

    // Bộ đếm MSSV: Đã nhập 1/20 MSSV (chỉ có người đặt)
    expect(screen.getByText(/Đã nhập 1\/20 MSSV/i)).toBeDefined();
  });

  it('hỗ trợ mở ô textarea dán danh sách MSSV và tự động điền vào các ô trống', async () => {
    renderBookingModal(mockRoom40);

    // Bấm nút "Dán danh sách MSSV"
    const pasteBtn = screen.getByRole('button', { name: /Dán danh sách MSSV/i });
    fireEvent.click(pasteBtn);

    // Xuất hiện ô textarea
    const textarea = screen.getByPlaceholderText(/VD: 52100123/i) as HTMLTextAreaElement;
    expect(textarea).toBeDefined();

    // Dán danh sách có lẫn dấu cách, phẩy, chấm phẩy, xuống dòng và MSSV người đặt
    const pasteContent = `
      52100888, 52100111; 52100222
      52100333 52100111; 52100444
    `;
    fireEvent.change(textarea, { target: { value: pasteContent } });

    // Bấm "Điền vào các ô trống"
    const applyBtn = screen.getByRole('button', { name: /Điền vào các ô trống/i });
    fireEvent.click(applyBtn);

    // Kết quả:
    // 52100888 (người đặt) bị bỏ
    // 52100111 (lần 2) bị bỏ trùng
    // Nhận: 52100111, 52100222, 52100333, 52100444 (4 mã)
    const inputs = screen.getAllByPlaceholderText(/MSSV người/i) as HTMLInputElement[];
    expect(inputs[1].value).toBe('52100111');
    expect(inputs[2].value).toBe('52100222');
    expect(inputs[3].value).toBe('52100333');
    expect(inputs[4].value).toBe('52100444');

    // Bộ đếm cập nhật: Đã nhập 5/20 MSSV
    expect(screen.getByText(/Đã nhập 5\/20 MSSV/i)).toBeDefined();
  });

  it('cuộn tới ô lỗi đầu tiên và focus khi bấm Xác nhận mà còn thiếu thông tin', async () => {
    renderBookingModal(mockRoom40);

    const submitBtn = screen.getByRole('button', { name: /Xác nhận đặt phòng/i });
    fireEvent.click(submitBtn);

    // Ô MSSV người thứ 2 (id: booking-participant-1) đang trống -> phải có lỗi và scrollIntoView
    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});

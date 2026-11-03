// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IncidentReportPage } from './IncidentReportPage';
import { BookingProvider } from '../../context/BookingContext';
import { mockStore } from '../../api/mock/mockStore';
import * as incidentApi from '../../api/incidentApi';

describe('IncidentReportPage', () => {
  beforeEach(() => {
    mockStore.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (initialState?: { roomId?: string; roomCode?: string }) => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/incident-report', state: initialState }]}>
        <BookingProvider>
          <IncidentReportPage />
        </BookingProvider>
      </MemoryRouter>
    );
  };

  it('cho phép chọn phòng, chọn thiết bị và giữ nguyên giá trị thiết bị khi re-render', async () => {
    renderComponent();

    const roomSelect = screen.getByLabelText(/Chọn Phòng Học Gặp Sự Cố/i) as HTMLSelectElement;
    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;

    // Ban đầu chưa chọn phòng -> device select bị disabled
    expect(roomSelect.value).toBe('');
    expect(deviceSelect.disabled).toBe(true);

    // 1. Chọn phòng r-g01 (L.001)
    fireEvent.change(roomSelect, { target: { value: 'r-g01' } });
    expect(roomSelect.value).toBe('r-g01');

    // Sau khi chọn phòng -> device select enabled và có các options
    await waitFor(() => {
      expect(deviceSelect.disabled).toBe(false);
    });
    expect(deviceSelect.options.length).toBeGreaterThan(1);

    // 2. Chọn thiết bị đầu tiên
    const firstDeviceId = deviceSelect.options[1].value;
    fireEvent.change(deviceSelect, { target: { value: firstDeviceId } });
    expect(deviceSelect.value).toBe(firstDeviceId);

    // 3. Trigger re-render bằng cách gõ vào ô mô tả
    const descriptionInput = screen.getByLabelText(/Mô Tả Hiện Trượng Lỗi/i) as HTMLTextAreaElement;
    fireEvent.change(descriptionInput, { target: { value: 'Điều hòa chảy nước và phát tiếng kêu to' } });

    // 4. KIỂM TRA: Thiết bị đã chọn vẫn giữ nguyên giá trị, KHÔNG bị reset về ''
    expect(deviceSelect.value).toBe(firstDeviceId);
  });

  it('reset thiết bị khi người dùng đổi sang phòng khác', async () => {
    renderComponent();

    const roomSelect = screen.getByLabelText(/Chọn Phòng Học Gặp Sự Cố/i) as HTMLSelectElement;
    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;

    // 1. Chọn phòng r-g01 và chọn thiết bị
    fireEvent.change(roomSelect, { target: { value: 'r-g01' } });
    const firstDeviceId = deviceSelect.options[1].value;
    fireEvent.change(deviceSelect, { target: { value: firstDeviceId } });
    expect(deviceSelect.value).toBe(firstDeviceId);

    // 2. Đổi sang phòng r-101 (L.101)
    fireEvent.change(roomSelect, { target: { value: 'r-101' } });
    expect(roomSelect.value).toBe('r-101');

    // 3. KIỂM TRA: Thiết bị được reset về rỗng
    expect(deviceSelect.value).toBe('');
  });

  it('tự động chọn sẵn phòng khi điều hướng từ thẻ phòng với location.state.roomId', async () => {
    renderComponent({ roomId: 'r-101', roomCode: 'L.101' });

    const roomSelect = screen.getByLabelText(/Chọn Phòng Học Gặp Sự Cố/i) as HTMLSelectElement;
    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;

    // Kiểm tra phòng r-101 đã được chọn sẵn ngay từ đầu
    expect(roomSelect.value).toBe('r-101');
    expect(deviceSelect.disabled).toBe(false);

    // Thiết bị vẫn có thể chọn bình thường và không bị reset
    const deviceId = deviceSelect.options[1].value;
    fireEvent.change(deviceSelect, { target: { value: deviceId } });
    expect(deviceSelect.value).toBe(deviceId);

    // Nhập mô tả re-render lại -> thiết bị vẫn giữ nguyên
    const descInput = screen.getByLabelText(/Mô Tả Hiện Trượng Lỗi/i);
    fireEvent.change(descInput, { target: { value: 'Micro rè' } });
    expect(deviceSelect.value).toBe(deviceId);
  });

  it('hiển thị nhãn "(đang hỏng)" đối với thiết bị BROKEN/REPAIRING và vẫn cho phép chọn', async () => {
    // Cập nhật trạng thái một thiết bị thành BROKEN trong store
    mockStore.update((s) => {
      const room = s.rooms.find((r) => r.id === 'r-g01');
      if (room && room.devices.length > 0) {
        room.devices[0].status = 'BROKEN';
      }
    });

    renderComponent({ roomId: 'r-g01' });

    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;
    const brokenOption = Array.from(deviceSelect.options).find((opt) => opt.text.includes('(đang hỏng)'));

    expect(brokenOption).toBeDefined();
    expect(brokenOption?.disabled).toBe(false);

    // Vẫn cho phép chọn thiết bị đang hỏng
    fireEvent.change(deviceSelect, { target: { value: brokenOption!.value } });
    expect(deviceSelect.value).toBe(brokenOption!.value);
  });

  it('báo lỗi khi chưa chọn thiết bị và reset form sau khi gửi thành công nhưng giữ phòng', async () => {
    renderComponent({ roomId: 'r-g01' });

    const submitBtn = screen.getByRole('button', { name: /Gửi Phản Ánh/i });

    // 1. Gửi khi chưa chọn thiết bị -> báo lỗi
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Vui lòng chọn thiết bị gặp sự cố.')).toBeDefined();

    // 2. Chọn thiết bị và nhập mô tả
    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;
    fireEvent.change(deviceSelect, { target: { value: deviceSelect.options[1].value } });

    const descInput = screen.getByLabelText(/Mô Tả Hiện Trượng Lỗi/i) as HTMLTextAreaElement;
    fireEvent.change(descInput, { target: { value: 'Bàn phím hỏng nút cách' } });

    const createSpy = vi.spyOn(incidentApi, 'createIncidentApi');

    // 3. Gửi form thành công
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(createSpy).toHaveBeenCalledTimes(1);
        // - Thiết bị được reset
        expect(deviceSelect.value).toBe('');
        // - Mô tả được reset
        expect(descInput.value).toBe('');
      },
      { timeout: 3000 }
    );

    // 4. KIỂM TRA: sau khi gửi thành công phòng vẫn giữ nguyên
    const roomSelect = screen.getByLabelText(/Chọn Phòng Học Gặp Sự Cố/i) as HTMLSelectElement;
    expect(roomSelect.value).toBe('r-g01');
  });

  it('hiển thị hai nút Chụp ảnh và Chọn ảnh từ máy', async () => {
    renderComponent({ roomId: 'r-g01' });

    expect(screen.getByRole('button', { name: /Chụp ảnh sự cố/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Chọn ảnh từ máy/i })).toBeTruthy();
  });
});

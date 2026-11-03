// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { IncidentReportForm } from './IncidentReportForm';
import { BookingProvider } from '../../context/BookingContext';
import { mockStore } from '../../api/mock/mockStore';
import * as incidentApi from '../../api/incidentApi';

describe('IncidentReportForm', () => {
  let createObjectURLMock: Mock<[Blob | MediaSource], string>;
  let revokeObjectURLMock: Mock<[string], void>;

  beforeEach(() => {
    mockStore.reset();
    vi.clearAllMocks();

    createObjectURLMock = vi.fn((_obj: Blob | MediaSource) => 'blob:mocked-image-preview-url');
    revokeObjectURLMock = vi.fn((_url: string) => {});
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    cleanup();
  });

  const renderForm = (props: React.ComponentProps<typeof IncidentReportForm> = {}) => {
    return render(
      <BookingProvider>
        <IncidentReportForm {...props} />
      </BookingProvider>
    );
  };

  it('render đầy đủ các trường, nút Chụp ảnh và Chọn ảnh từ máy', () => {
    renderForm();

    expect(screen.getByLabelText(/Chọn Phòng Học Gặp Sự Cố/i)).toBeTruthy();
    expect(screen.getByLabelText(/Thiết Bị Hỏng Hóc/i)).toBeTruthy();
    expect(screen.getByLabelText(/Mô Tả Hiện Trượng Lỗi/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Chụp ảnh sự cố/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Chọn ảnh từ máy/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Gửi Phản Ánh/i })).toBeTruthy();
  });

  it('từ chối file không phải ảnh kèm thông báo lỗi và không giữ file', async () => {
    renderForm({ initialRoomId: 'r-g01' });

    const fileInput = screen.getByLabelText('Tệp ảnh chọn từ máy') as HTMLInputElement;
    const invalidFile = new File(['fake-pdf'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText('Chỉ nhận file ảnh (JPG, PNG, WebP).')).toBeTruthy();
    expect(screen.queryByAltText(/Xem trước ảnh sự cố/i)).toBeNull();
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('từ chối file vượt quá 5 MB kèm thông báo dung lượng cụ thể', async () => {
    renderForm({ initialRoomId: 'r-g01' });

    const fileInput = screen.getByLabelText('Tệp ảnh chọn từ máy') as HTMLInputElement;
    const bigFile = new File([''], 'huge-photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(bigFile, 'size', { value: 6.2 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(
      await screen.findByText('Ảnh 6.2 MB vượt quá giới hạn 5 MB. Vui lòng chọn ảnh nhỏ hơn.')
    ).toBeTruthy();
    expect(screen.queryByAltText(/Xem trước ảnh sự cố/i)).toBeNull();
  });

  it('hiển thị ảnh xem trước khi chọn file hợp lệ và xóa preview khi bấm "Xóa ảnh"', async () => {
    renderForm({ initialRoomId: 'r-g01' });

    const fileInput = screen.getByLabelText('Tệp ảnh chọn từ máy') as HTMLInputElement;
    const validFile = new File(['valid-img-data'], 'hong_may_chieu.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1.5 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Kiểm tra preview hiển thị
    await waitFor(() => {
      const previewImg = screen.getByAltText(/Xem trước ảnh sự cố: hong_may_chieu.jpg/i);
      expect(previewImg).toBeTruthy();
      expect(previewImg.getAttribute('src')).toBe('blob:mocked-image-preview-url');
      expect(screen.getByText('1.5 MB')).toBeTruthy();
    });

    expect(createObjectURLMock).toHaveBeenCalledWith(validFile);

    // Bấm nút "Xóa ảnh"
    const deleteBtn = screen.getByRole('button', { name: /Xóa ảnh/i });
    fireEvent.click(deleteBtn);

    // Preview bị xóa và revokeObjectURL được gọi
    expect(screen.queryByAltText(/Xem trước ảnh sự cố/i)).toBeNull();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mocked-image-preview-url');
  });

  it('gửi form có ảnh đính kèm: createIncidentApi nhận imageFile và onSuccess được gọi', async () => {
    const handleSuccess = vi.fn();
    const createSpy = vi.spyOn(incidentApi, 'createIncidentApi').mockResolvedValueOnce({
      success: true,
      code: 200,
      message: 'Báo cáo sự cố thành công',
      data: { incidentId: 'INC-7777' },
      timestamp: new Date().toISOString(),
    });

    renderForm({ initialRoomId: 'r-g01', onSuccess: handleSuccess, submitLabel: 'Báo Sự Cố' });

    // 1. Chọn thiết bị
    const deviceSelect = screen.getByLabelText(/Thiết Bị Hỏng Hóc/i) as HTMLSelectElement;
    await waitFor(() => expect(deviceSelect.disabled).toBe(false));
    fireEvent.change(deviceSelect, { target: { value: deviceSelect.options[1].value } });

    // 2. Nhập mô tả
    const descInput = screen.getByLabelText(/Mô Tả Hiện Trượng Lỗi/i);
    fireEvent.change(descInput, { target: { value: 'Màn hình máy chiếu không nhận cáp HDMI' } });

    // 3. Đính kèm file ảnh hợp lệ
    const fileInput = screen.getByLabelText('Tệp ảnh chọn từ máy') as HTMLInputElement;
    const photo = new File(['photo-content'], 'camera.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [photo] } });

    await waitFor(() => {
      expect(screen.getByAltText(/Xem trước ảnh sự cố/i)).toBeTruthy();
    });

    // 4. Bấm gửi
    const submitBtn = screen.getByRole('button', { name: 'Báo Sự Cố' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
      const callArg = createSpy.mock.calls[0][0];
      expect(callArg.imageFile).toBe(photo);
      expect(callArg.description).toBe('Màn hình máy chiếu không nhận cáp HDMI');
      expect(handleSuccess).toHaveBeenCalledWith('INC-7777');
    });

    // Preview bị dọn dẹp sau khi gửi thành công
    expect(screen.queryByAltText(/Xem trước ảnh sự cố/i)).toBeNull();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mocked-image-preview-url');
  });

  it('hiển thị nút Hủy và gọi onCancel khi bấm Hủy', () => {
    const handleCancel = vi.fn();
    renderForm({ onCancel: handleCancel });

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    expect(cancelBtn).toBeTruthy();

    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});

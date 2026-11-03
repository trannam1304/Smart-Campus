// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockCreateIncident } from './incidentMock';
import { mockStore } from './mockStore';

vi.mock('../../utils/imageUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/imageUtils')>();
  return {
    ...actual,
    compressImageToDataUrl: vi.fn(async () => 'data:image/jpeg;base64,mock-compressed-data'),
  };
});

describe('mockCreateIncident', () => {
  beforeEach(() => {
    mockStore.reset();
    localStorage.clear();
  });

  it('lưu đúng reporterName, staffCode và imageUrl khi tài khoản là ADMIN', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-admin-01',
        fullName: 'Võ Minh Luân (QTV)',
        email: 'admin@library.edu.vn',
        role: 'ADMIN',
        staffCode: 'STAFF-888',
      })
    );

    const res = await mockCreateIncident({
      roomId: 'r-101',
      description: 'Điều hòa chảy nước ở góc phòng',
      imageUrl: 'https://example.com/ac-broken.jpg',
    });

    expect(res.success).toBe(true);
    expect(res.data?.incidentId).toBeDefined();

    const created = mockStore.getState().incidents.find((i) => i.id === res.data?.incidentId);
    expect(created).toBeDefined();
    expect(created?.reporterName).toBe('Võ Minh Luân (QTV)');
    expect(created?.reporterCode).toBe('STAFF-888');
    expect(created?.imageUrl).toBe('https://example.com/ac-broken.jpg');
    expect(created?.status).toBe('OPEN');
  });

  it('xử lý imageFile khi có ảnh chụp đính kèm và lưu sự cố thành công', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-admin-01',
        fullName: 'Võ Minh Luân (QTV)',
        email: 'admin@library.edu.vn',
        role: 'ADMIN',
        staffCode: 'STAFF-888',
      })
    );

    const file = new File(['fake-image-bytes'], 'broken_chair.jpg', { type: 'image/jpeg' });
    const res = await mockCreateIncident({
      roomId: 'r-101',
      description: 'Ghế xoay gãy chân',
      imageFile: file,
    });

    expect(res.success).toBe(true);
    expect(res.data?.incidentId).toBeDefined();

    const created = mockStore.getState().incidents.find((i) => i.id === res.data?.incidentId);
    expect(created).toBeDefined();
    expect(created?.reporterName).toBe('Võ Minh Luân (QTV)');
    expect(created?.reporterCode).toBe('STAFF-888');
    expect(created?.imageUrl).toBe('data:image/jpeg;base64,mock-compressed-data');
  });

  it('đặt reporterCode rỗng khi admin không có staffCode, KHÔNG dùng mặc định 52100888', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-admin-02',
        fullName: 'Nguyễn Quản Trị',
        email: 'admin2@library.edu.vn',
        role: 'ADMIN',
      })
    );

    const res = await mockCreateIncident({
      roomId: 'r-102',
      description: 'Đèn trần nhấp nháy',
    });

    expect(res.success).toBe(true);
    const created = mockStore.getState().incidents.find((i) => i.id === res.data?.incidentId);
    expect(created).toBeDefined();
    expect(created?.reporterName).toBe('Nguyễn Quản Trị');
    expect(created?.reporterCode).toBe('');
    expect(created?.imageUrl).toBeUndefined();
  });

  it('lưu đúng reporterName và studentCode khi tài khoản là STUDENT', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u-student-01',
        fullName: 'La Thái Thành',
        email: '52100888@student.edu.vn',
        role: 'STUDENT',
        studentCode: '52100888',
      })
    );

    const res = await mockCreateIncident({
      roomId: 'r-103',
      description: 'Loa không có âm thanh',
      imageUrl: 'https://example.com/speaker.png',
    });

    expect(res.success).toBe(true);
    const created = mockStore.getState().incidents.find((i) => i.id === res.data?.incidentId);
    expect(created).toBeDefined();
    expect(created?.reporterName).toBe('La Thái Thành');
    expect(created?.reporterCode).toBe('52100888');
    expect(created?.imageUrl).toBe('https://example.com/speaker.png');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axiosClient from './axiosClient';
import { createIncidentApi } from './incidentApi';

describe('incidentApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ưu tiên gửi JSON gọn nhẹ khi có sẵn imageUrl đã nén thay vì nhân đôi payload multipart', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      success: true,
      code: 201,
      message: 'OK',
      data: { incidentId: 'INC-101' },
      timestamp: '2026-11-25T10:00:00Z',
    });

    const photo = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    const res = await createIncidentApi({
      roomId: 'L.001',
      roomCode: 'L.001',
      equipmentId: 'eq-g01-1',
      equipmentName: 'Máy chiếu',
      description: 'Không lên nguồn',
      imageFile: photo,
      imageUrl: 'data:image/jpeg;base64,COMPRESSED',
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, body] = postSpy.mock.calls[0];
    expect(url).toBe('/incidents');
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toMatchObject({
      roomId: 'L.001',
      roomCode: 'L.001',
      equipmentId: 'eq-g01-1',
      equipmentName: 'Máy chiếu',
      description: 'Không lên nguồn',
      imageUrl: 'data:image/jpeg;base64,COMPRESSED',
    });
    expect(res.data?.incidentId).toBe('INC-101');
  });

  it('gửi FormData khi chỉ có imageFile mà chưa có imageUrl', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      success: true,
      code: 201,
      data: { incidentId: 'INC-102' },
    });

    const photo = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    await createIncidentApi({
      roomId: 'L.002',
      equipmentName: 'Bảng trắng',
      description: 'Bị trầy',
      imageFile: photo,
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, body] = postSpy.mock.calls[0];
    expect(url).toBe('/incidents');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('equipmentName')).toBe('Bảng trắng');
    expect((body as FormData).get('imageUrl')).toBeNull();
  });

  it('không nuốt lỗi 500 hoặc 404 thành thành công giả', async () => {
    vi.spyOn(axiosClient, 'post').mockRejectedValueOnce({ status: 500, message: 'Server Error' });

    await expect(
      createIncidentApi({
        roomId: 'L.001',
        description: 'Hỏng đèn',
      })
    ).rejects.toMatchObject({ status: 500 });
  });
});

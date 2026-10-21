package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.CheckinRequest;
import com.smartcampus.backend.dto.response.CheckinResponse;

/**
 * Nghiệp vụ nhóm Checkin (Điểm danh qua mã QR).
 * Liên quan: FR-5.1 (sinh mã QR), FR-5.2 (quét mã QR nhận phòng), FR-5.3 (tự động hủy quá hạn)
 *
 * <p>Shell controller stub — triển khai chi tiết sau này.
 */
public interface CheckinService {

    // FR-5.1: Lấy mã QR của một lượt đặt
    CheckinResponse getQrCode(Long bookingId);

    // FR-5.2: Quét mã QR nhận phòng (đã triển khai chi tiết ở BookingCheckinController)
    CheckinResponse checkIn(String qrCode);
}

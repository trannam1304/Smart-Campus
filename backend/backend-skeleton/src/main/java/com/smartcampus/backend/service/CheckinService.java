package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.response.CheckinResponse;

/**
 * Nghiệp vụ nhóm Checkin.
 * Liên quan: FR-5.1, FR-5.2, FR-5.3
 */
public interface CheckinService {

    /**
     * Check-in nhận phòng bằng mã QR (FR-5.2).
     */
    CheckinResponse checkIn(String qrCode);

    /**
     * Trả phòng sớm / Check-out kết thúc lượt đặt.
     */
    CheckinResponse checkOut(Long bookingId);

    /**
     * Tự động trả phòng và giải phóng tài nguyên cho các booking quá hạn check-in
     * (+15 phút) hoặc đã kết thúc giờ sử dụng (FR-5.3).
     *
     * @return số lượt đặt đã được tự động xử lý trả phòng/hủy
     */
    int autoReleaseExpiredBookings();
}

package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.response.CheckinResponse;

/**
 * Nghiệp vụ nhóm Checkin.
 * Liên quan: FR-5.1, FR-5.2, FR-5.3
 */
public interface CheckinService {

    /**
     * Check-in nhận phòng bằng mã QR (FR-5.2).
     *
     * <p>Cửa sổ check-in (theo tham số đã chốt):
     * <ul>
     *   <li>Cho phép quét khi now ∈ [start_time − 15 phút, start_time + 15 phút] (P-EARLY-IN / P-LATE-IN)</li>
     *   <li>Quét quá sớm (< start−15m): từ chối "Chưa đến giờ check-in"</li>
     *   <li>Quét quá muộn (> start+15m): auto-release → CANCELLED_AUTO (P-GRACE, FR-5.3)</li>
     * </ul>
     *
     * <p>Optimistic Locking: Booking entity có {@code @Version}. Nếu hai thiết bị quét
     * cùng một QR đồng thời, chỉ một giao dịch thành công; kia nhận 409 Conflict.
     *
     * @param qrCode mã QR quét được (chứa Booking ID)
     * @return CheckinResponse chứa thông tin lượt đặt đã check-in
     */
    CheckinResponse checkIn(String qrCode);
}

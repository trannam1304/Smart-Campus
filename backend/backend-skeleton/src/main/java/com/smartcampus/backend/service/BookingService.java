package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;

/**
 * Nghiệp vụ nhóm Booking.
 * Liên quan: FR-3.1 (Đặt phòng), FR-3.2 (Chống trùng lịch), FR-3.3 (Hạn mức tuần),
 * FR-5.1 (Sinh mã QR định danh), FR-5.3 (Auto-release quá hạn), FR-6.1 (Email xác nhận)
 */
public interface BookingService {

    /**
     * FR-3.1 & FR-5.1 & FR-6.1: Đặt phòng mới, sinh mã QR bảo mật và gửi email xác nhận kèm file ảnh QR.
     */
    BookingResponse createBooking(BookingRequest request, Long userId);

    /**
     * FR-5.3 & FR-6.3: Tự động hủy các lượt đặt phòng quá hạn check-in 15-30 phút (Auto-release),
     * giải phóng phòng về AVAILABLE, cập nhật kỷ luật No-Show và gửi email cảnh báo.
     *
     * @return số lượt đặt phòng đã được tự động hủy
     */
    int autoReleaseOverdueBookings();
}

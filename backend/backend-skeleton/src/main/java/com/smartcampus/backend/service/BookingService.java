package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;

import java.util.List;

/**
 * Nghiệp vụ nhóm Booking.
 * Liên quan: FR-3.1, FR-3.2, FR-3.3
 */
public interface BookingService {

    /**
     * Tạo lượt đặt phòng mới (FR-3.1) với kiểm tra trùng lịch (FR-3.2) và hạn mức (FR-3.3).
     */
    BookingResponse createBooking(BookingRequest request, String ownerEmail);

    /**
     * Lấy danh sách lịch đặt phòng của người dùng hiện tại (chủ phòng hoặc thành viên nhóm).
     */
    List<BookingResponse> getMyBookings(String userEmail);

    /**
     * Lấy danh sách toàn bộ lượt đặt phòng (dành cho Quản trị viên).
     */
    List<BookingResponse> getAllBookings();

    /**
     * Duyệt đơn đặt phòng (QTV).
     */
    BookingResponse approveBooking(Long bookingId, String adminEmail);

    /**
     * Từ chối đơn đặt phòng kèm lý do (QTV).
     */
    BookingResponse rejectBooking(Long bookingId, String reason, String adminEmail);

    /**
     * Lấy danh sách lịch đã đặt của một phòng theo ngày hoặc khoảng ngày (Timeline / Lịch bận).
     */
    List<BookingResponse> getRoomBookings(Long roomId, String date, String startDate, String endDate);
}

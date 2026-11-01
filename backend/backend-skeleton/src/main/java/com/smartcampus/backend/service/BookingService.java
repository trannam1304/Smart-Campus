package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;

/**
 * Nghiệp vụ nhóm Booking.
 * Liên quan: FR-3.1, FR-3.2, FR-3.3
 *
 * <p>createBooking thực hiện chuỗi kiểm tra fail-fast theo SRS:
 * <ol>
 *   <li>Phòng tồn tại, trạng thái AVAILABLE, đúng giờ mở cửa của tầng.</li>
 *   <li>Người dùng tồn tại, trạng thái ACTIVE, không bị khóa no-show.</li>
 *   <li>Khung giờ: start < end; bước 30 phút; duration 90–120 phút (phòng chuẩn).</li>
 *   <li>Sỉ số: ceil(0.5 × capacity) ≤ numberOfPeople ≤ capacity.</li>
 *   <li>Thành viên: số MSSV = số người; mỗi MSSV tồn tại, ACTIVE, không bị khóa.</li>
 *   <li>Hạn mức tuần: tổng giờ đã đặt + giờ mới ≤ 10 giờ/tuần (FR-3.3).</li>
 *   <li>Xung đột phòng: không trùng khung giờ với booking CONFIRMED/IN_USE/PENDING_APPROVAL (FR-3.2).</li>
 *   <li>Xung đột lịch cá nhân: chủ phòng và mỗi thành viên không được trùng 2 lượt (P-CONCURRENT).</li>
 *   <li>Lưu booking trạng thái CONFIRMED, sinh mã QR (FR-5.1).</li>
 * </ol>
 *
 * <p>Optimistic Locking: {@code @Version} trên Booking entity. Khi nhiều request
 * cùng ch disputar phòng, chỉ một giao dịch commit thành công; các giao dịch còn
 * lại bị ném OptimisticLockException → trả về 409 Conflict.
 */
public interface BookingService {

    /**
     * Tạo lượt đặt phòng mới (FR-3.1) với kiểm tra trùng lịch (FR-3.2) và hạn mức (FR-3.3).
     *
     * @param request   yêu cầu đặt phòng
     * @param ownerEmail email của người đặt (lấy từ JWT principal)
     * @return BookingResponse chứa thông tin lượt đặt vừa tạo
     * @throws IllegalStateException nếu vi phạm quy nghiệp vụ (trùng lịch, vượt hạn mức, ...)
     */
    BookingResponse createBooking(BookingRequest request, String ownerEmail);
}

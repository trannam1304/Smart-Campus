package com.smartcampus.backend.service;

import java.time.LocalDateTime;

/**
 * Dịch vụ gửi Email thông báo và nhắc lịch cho hệ thống Smart Campus.
 * Nghiệp vụ liên quan: FR-6.1 (Xác nhận đặt phòng kèm QR), FR-6.2 (Nhắc lịch hẹn 15m),
 * FR-6.3 (Cảnh báo hủy lịch tự động do quá hạn), NFR-01 (Bất đồng bộ @Async)
 */
public interface EmailService {

    /**
     * FR-6.1 & FR-5.1: Gửi email xác nhận đặt phòng thành công kèm mã QR đính kèm/inline.
     *
     * @param toEmail        địa chỉ email người nhận
     * @param recipientName  tên người nhận
     * @param bookingId      mã ID đặt phòng
     * @param roomCode       mã phòng học
     * @param startTime      thời gian bắt đầu
     * @param endTime        thời gian kết thúc
     * @param numberOfPeople số người tham gia
     * @param purpose        mục đích sử dụng
     * @param qrImageBytes   mảng byte hình ảnh mã QR (PNG)
     * @param qrCodeData     chuỗi dữ liệu mã định danh QR
     */
    void sendBookingConfirmationEmail(
            String toEmail,
            String recipientName,
            Long bookingId,
            String roomCode,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int numberOfPeople,
            String purpose,
            byte[] qrImageBytes,
            String qrCodeData
    );

    /**
     * FR-6.2: Gửi email nhắc lịch hẹn trước 15 phút đến giờ check-in.
     *
     * @param toEmail       địa chỉ email người nhận
     * @param recipientName tên người nhận
     * @param bookingId     mã ID đặt phòng
     * @param roomCode      mã phòng học
     * @param startTime     thời gian bắt đầu
     * @param endTime       thời gian kết thúc
     * @param qrImageBytes  ảnh QR đính kèm (nếu có)
     */
    void sendBookingReminderEmail(
            String toEmail,
            String recipientName,
            Long bookingId,
            String roomCode,
            LocalDateTime startTime,
            LocalDateTime endTime,
            byte[] qrImageBytes
    );

    /**
     * FR-6.3 & FR-5.3: Gửi email cảnh báo hủy lịch tự động do quá hạn check-in (Auto-release).
     *
     * @param toEmail       địa chỉ email người nhận
     * @param recipientName tên người nhận
     * @param bookingId     mã ID đặt phòng
     * @param roomCode      mã phòng học
     * @param startTime     thời gian bắt đầu
     * @param graceMinutes  số phút quá hạn cho phép
     * @param noShowCount   tổng số lần vi phạm No-Show
     * @param isLocked      trạng thái tài khoản có bị khóa hay không
     */
    void sendAutoCancelEmail(
            String toEmail,
            String recipientName,
            Long bookingId,
            String roomCode,
            LocalDateTime startTime,
            int graceMinutes,
            int noShowCount,
            boolean isLocked
    );
}


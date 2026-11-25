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

    /**
     * Gửi email xác thực tài khoản (FR-1.1).
     */
    void sendVerificationEmail(String to, String token);

    /**
     * Gửi mã OTP khôi phục mật khẩu (FR-1.4).
     */
    void sendOtpEmail(String to, String otpCode);

    /**
     * Phương thức tương thích ngược gửi thông báo đặt phòng.
     */
    void sendBookingConfirmation(String to, String bookingCode, String qrImageUrl);
}

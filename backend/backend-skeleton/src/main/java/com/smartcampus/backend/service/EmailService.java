package com.smartcampus.backend.service;

import org.springframework.stereotype.Service;

/**
 * Dịch vụ gửi email. Trong môi trường phát triển, implementation này chỉ GHI LOG
 * nội dung email (mã OTP, liên kết xác thực) thay vì gửi thực tế, vì hệ thống
 * chưa cấu hình SMTP. Khi triển khai thật, bổ sung Spring Mail và triển khai lại.
 * Liên quan: FR-1.1 (kích hoạt tài khoản), FR-1.4 (OTP quên mật khẩu).
 */
@Service
public class EmailService {

    public void sendVerificationEmail(String to, String token) {
        // TODO: Thay bằng SMTP gửi email thực tế khi triển khai production
        System.out.println("==============================================");
        System.out.println("[EMAIL SERVICE] Gửi email xác thực đăng ký");
        System.out.println("Người nhận: " + to);
        System.out.println("Mã xác thực: " + token);
        System.out.println("Liên kết xác thực: http://localhost:8088/api/auth/verify-email?token=" + token);
        System.out.println("==============================================");
    }

    public void sendOtpEmail(String to, String otpCode) {
        // TODO: Thay bằng SMTP gửi email thực tế khi triển khai production
        System.out.println("==============================================");
        System.out.println("[EMAIL SERVICE] Gửi mã OTP khôi phục mật khẩu");
        System.out.println("Người nhận: " + to);
        System.out.println("Mã OTP: " + otpCode);
        System.out.println("Hiệu lực: 5 phút");
        System.out.println("==============================================");
    }

    public void sendBookingConfirmation(String to, String bookingCode, String qrImageUrl) {
        System.out.println("==============================================");
        System.out.println("[EMAIL SERVICE] Gửi thông báo xác nhận đặt phòng");
        System.out.println("Người nhận: " + to);
        System.out.println("Mã đặt phòng: " + bookingCode);
        System.out.println("QR code: " + qrImageUrl);
        System.out.println("==============================================");
    }
}

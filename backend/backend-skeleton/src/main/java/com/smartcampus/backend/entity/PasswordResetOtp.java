package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Mã OTP dùng để khôi phục mật khẩu (FR-1.4).
 * Lưu vào bảng password_reset_otp (tạo bởi migration V2).
 */
@Getter
@Setter
@Entity
@Table(name = "password_reset_otp")
public class PasswordResetOtp extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "otp_code", nullable = false, length = 20)
    private String otpCode;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;
}

package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Truy vấn mã OTP khôi phục mật khẩu (bảng password_reset_otp). Liên quan FR-1.4.
 */
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findByOtpCode(String otpCode);

    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetOtp o SET o.isUsed = true WHERE o.id = ?1")
    void markAsUsed(Long id);
}

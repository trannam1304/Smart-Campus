package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// FR-1.4: Khôi phục mật khẩu - nhập OTP + mật khẩu mới
@Getter @Setter
public class ResetPasswordRequest {
    @NotBlank(message = "Vui lòng nhập mã OTP.")
    private String otpCode;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
    @Size(min = 6, message = "Mật khẩu mới phải có ít nhất 6 ký tự.")
    private String newPassword;
}

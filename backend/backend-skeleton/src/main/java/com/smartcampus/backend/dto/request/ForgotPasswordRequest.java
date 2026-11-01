package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// FR-1.4: Quên mật khẩu - gửi mã OTP qua email
@Getter @Setter
public class ForgotPasswordRequest {
    @NotBlank(message = "Vui lòng nhập email trường.")
    @Email(message = "Email không đúng định dạng.")
    private String email; // phải là @student.edu.vn
}

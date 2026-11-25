package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// FR-1.1: Đăng ký tài khoản sinh viên (chỉ sử dụng MSSV)
@Getter @Setter
public class RegisterRequest {
    @NotBlank(message = "Vui lòng nhập họ tên.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập mã số sinh viên (MSSV).")
    private String studentCode;

    // Không bắt buộc email (giữ tương thích ngược nếu cần)
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    private String password;

    private String faculty;
}

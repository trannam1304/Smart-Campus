package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

// FR-1.1
@Getter @Setter
public class RegisterRequest {
    @NotBlank(message = "Vui lòng nhập họ tên.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập mã số sinh viên (MSSV).")
    private String studentCode;

    @NotBlank(message = "Vui lòng email trường.")
    @Email(message = "Email không đúng định dạng.")
    @Pattern(regexp = "^[^@]+@student\\.edu\\.vn$",
            message = "Email phải là email trường có đuôi @student.edu.vn.")
    private String email; // phải là @student.edu.vn

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    private String password;

    private String faculty;
}

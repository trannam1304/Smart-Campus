package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// FR-1.2
@Getter @Setter
public class LoginRequest {
    @NotBlank private String username; // email hoặc MSSV
    private String password;           // để trống nếu đăng nhập bằng SSO Google
    private String googleToken;        // phiên xác thực Google (nếu có)
}

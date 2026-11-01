package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.ForgotPasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.request.ResetPasswordRequest;
import com.smartcampus.backend.dto.request.VerifyEmailRequest;
import com.smartcampus.backend.dto.response.AuthResponse;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * API endpoints nhóm Auth. Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST   /api/auth/register          → Đăng ký tài khoản sinh viên (FR-1.1)</li>
 *   <li>POST   /api/auth/verify-email      → Xác thực email kích hoạt tài khoản (FR-1.1)</li>
 *   <li>POST   /api/auth/login             → Đăng nhập đa phương thức (FR-1.2)</li>
 *   <li>PUT    /api/auth/change-password   → Đổi mật khẩu (yêu cầu đăng nhập) (FR-1.4)</li>
 *   <li>POST   /api/auth/forgot-password   → Gửi mã OTP khôi phục mật khẩu (FR-1.4)</li>
 *   <li>POST   /api/auth/reset-password    → Khôi phục mật khẩu bằng OTP (FR-1.4)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ------------------------------------------------------------------
    // FR-1.1: Đăng ký tài khoản sinh viên
    // Body: { fullName, studentCode, email (@student.edu.vn), password, faculty }
    // ------------------------------------------------------------------
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse result = authService.register(request);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    // ------------------------------------------------------------------
    // FR-1.1: Xác thực email kích hoạt tài khoản
    // Body: { token }
    // ------------------------------------------------------------------
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse result = authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ------------------------------------------------------------------
    // FR-1.2: Đăng nhập đa phương thức (hệ thống & SSO)
    // Body: { username (email hoặc MSSV), password, googleToken? }
    // ------------------------------------------------------------------
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse result = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ------------------------------------------------------------------
    // FR-1.4: Đổi mật khẩu (yêu cầu đã đăng nhập)
    // Header: Authorization: Bearer <JWT>
    // Body: { currentPassword, newPassword }
    // ------------------------------------------------------------------
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<AuthResponse>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = userDetails.getUsername();
        AuthResponse result = authService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ------------------------------------------------------------------
    // FR-1.4: Gửi mã OTP khôi phục mật khẩu
    // Body: { email }
    // ------------------------------------------------------------------
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(message));
    }

    // ------------------------------------------------------------------
    // FR-1.4: Khôi phục mật khẩu bằng OTP
    // Body: { otpCode, newPassword }
    // ------------------------------------------------------------------
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(message));
    }
}

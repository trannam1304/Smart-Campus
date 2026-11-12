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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    // Body: { token } hoặc GET ?token=...
    // ------------------------------------------------------------------
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse result = authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmailGet(@RequestParam String token) {
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setToken(token);
        authService.verifyEmail(request);
        String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Kích hoạt thành công</title>"
                + "<meta http-equiv='refresh' content='3;url=http://localhost:3000/login?verified=true' />"
                + "<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;}"
                + ".card{background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);text-align:center;max-width:400px;}"
                + "h2{color:#16a34a;margin-bottom:0.5rem;}p{color:#64748b;font-size:0.9rem;}"
                + "a{display:inline-block;margin-top:1rem;padding:0.5rem 1rem;background:#2563eb;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:bold;}"
                + "</style></head><body><div class='card'><h2>Kích Hoạt Tài Khoản Thành Công!</h2>"
                + "<p>Tài khoản của bạn đã được kích hoạt thành công. Đang tự động chuyển hướng về trang đăng nhập sau 3 giây...</p>"
                + "<a href='http://localhost:3000/login?verified=true'>Đến trang Đăng Nhập ngay</a></div></body></html>";
        return ResponseEntity.ok().header("Content-Type", "text/html; charset=UTF-8").body(html);
    }

    // ------------------------------------------------------------------
    // FR-1.2: Đăng nhập đa phương thức (hệ thống & SSO)
    // Body: { username (email hoặc MSSV), password, googleToken? }
    // ------------------------------------------------------------------
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse result = authService.login(request);

        if (result.getRefreshToken() != null) {
            ResponseCookie cookie = ResponseCookie.from("refreshToken", result.getRefreshToken())
                    .httpOnly(true)
                    .secure(false) // chạy localhost dev
                    .path("/")
                    .maxAge(7 * 24 * 3600)
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ------------------------------------------------------------------
    // FR-1.2, NFR-03: Cấp mới Access Token bằng Refresh Token (Token Rotation)
    // Cookie: refreshToken HOẶC Body: { refreshToken }
    // ------------------------------------------------------------------
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String token = cookieRefreshToken;
        if (token == null || token.isBlank()) {
            if (httpRequest.getCookies() != null) {
                for (jakarta.servlet.http.Cookie c : httpRequest.getCookies()) {
                    if ("refreshToken".equals(c.getName())) {
                        token = c.getValue();
                        break;
                    }
                }
            }
        }
        if ((token == null || token.isBlank()) && body != null) {
            token = body.get("refreshToken");
        }
        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        AuthResponse result = authService.refreshToken(token, deviceInfo, ipAddress);

        // Xoay vòng Refresh Token mới vào Cookie HttpOnly
        if (result.getRefreshToken() != null) {
            ResponseCookie cookie = ResponseCookie.from("refreshToken", result.getRefreshToken())
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(7 * 24 * 3600)
                    .sameSite("Lax")
                    .build();
            httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ------------------------------------------------------------------
    // FR-1.2, NFR-03: Đăng xuất và thu hồi Refresh Token
    // ------------------------------------------------------------------
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String token = cookieRefreshToken;
        if (token == null || token.isBlank()) {
            if (httpRequest.getCookies() != null) {
                for (jakarta.servlet.http.Cookie c : httpRequest.getCookies()) {
                    if ("refreshToken".equals(c.getName())) {
                        token = c.getValue();
                        break;
                    }
                }
            }
        }
        if ((token == null || token.isBlank()) && body != null) {
            token = body.get("refreshToken");
        }
        authService.logout(token);

        // Hủy cookie Refresh Token
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công."));
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

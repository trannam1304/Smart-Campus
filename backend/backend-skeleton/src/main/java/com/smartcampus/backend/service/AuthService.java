package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.request.VerifyEmailRequest;
import com.smartcampus.backend.dto.response.AuthResponse;

/**
 * Nghiệp vụ nhóm Auth.
 * Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 *
 * <p>Luồng nghiệp vụ theo SRS (ISO/IEC/IEEE 29148):
 * <ul>
 *   <li>register: Kiểm tra MSSV trùng → mã hoá mật khẩu → lưu trạng thái ACTIVE → trả về AuthResponse.</li>
 *   <li>verifyEmail: Tìm user theo mã xác thực → kiểm tra chưa hết hạn →
 *       đổi trạng thái sang ACTIVE → trả về AuthResponse.</li>
 *   <li>login: Xác thực MSSV/tài khoản + mật khẩu → sinh JWT → trả về AuthResponse(token, role, fullName).
 *       Chỉ cho phép tài khoản ACTIVE.</li>
 *   <li>changePassword: Xác thực mật khẩu cũ → mã hoá mật khẩu mới → cập nhật CSDL → trả về AuthResponse.</li>
 * </ul>
 */
public interface AuthService {

    // FR-1.1: Đăng ký tài khoản sinh viên
    AuthResponse register(RegisterRequest request);

    // FR-1.1: Xác thực kích hoạt tài khoản
    AuthResponse verifyEmail(VerifyEmailRequest request);

    // FR-1.2: Đăng nhập hệ thống
    AuthResponse login(LoginRequest request);

    // FR-1.4: Đổi mật khẩu (yêu cầu đã đăng nhập)
    AuthResponse changePassword(String email, ChangePasswordRequest request);

    // FR-1.2, NFR-03: Cấp mới Access Token bằng Refresh Token (Token Rotation)
    AuthResponse refreshToken(String refreshTokenStr, String deviceInfo, String ipAddress);

    // FR-1.2, NFR-03: Đăng xuất và thu hồi Refresh Token
    void logout(String refreshTokenStr);
}

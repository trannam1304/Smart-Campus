package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.ForgotPasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.request.ResetPasswordRequest;
import com.smartcampus.backend.dto.request.VerifyEmailRequest;
import com.smartcampus.backend.dto.response.AuthResponse;

/**
 * Nghiệp vụ nhóm Auth.
 * Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 *
 * <p>Luồng nghiệp vụ theo SRS (ISO/IEC/IEEE 29148):
 * <ul>
 *   <li>register: Kiểm tra email/MSSV trùng → mã hoá mật khẩu → lưu trạng thái PENDING
 *       → sinh mã xác thực → gửi email → trả về AuthResponse.</li>
 *   <li>verifyEmail: Tìm user theo mã xác thực → kiểm tra chưa hết hạn →
 *       đổi trạng thái sang ACTIVE → trả về AuthResponse.</li>
 *   <li>login: Xác thực email/MSSV + mật khẩu → sinh JWT → trả về AuthResponse(token, role, fullName).
 *       Chỉ cho phép tài khoản ACTIVE.</li>
 *   <li>changePassword: Xác thực mật khẩu cũ → mã hoá mật khẩu mới → cập nhật CSDL → trả về AuthResponse.</li>
 *   <li>forgotPassword: Tìm user theo email → sinh OTP 5 phút → lưu password_reset_otp → gửi email → trả về thông điệp.</li>
 *   <li>resetPassword: Kiểm tra OTP chưa hết hạn/chưa dùng → cập nhật mật khẩu mới → đánh dấu OTP đã dùng → trả về thông điệp.</li>
 * </ul>
 */
public interface AuthService {

    // FR-1.1: Đăng ký tài khoản sinh viên
    AuthResponse register(RegisterRequest request);

    // FR-1.1: Xác thực email kích hoạt tài khoản
    AuthResponse verifyEmail(VerifyEmailRequest request);

    // FR-1.2: Đăng nhập đa phương thức (hệ thống & SSO)
    AuthResponse login(LoginRequest request);

    // FR-1.4: Đổi mật khẩu (yêu cầu đã đăng nhập)
    AuthResponse changePassword(String email, ChangePasswordRequest request);

    // FR-1.4: Gửi mã OTP khôi phục mật khẩu (trả về thông điệp)
    String forgotPassword(ForgotPasswordRequest request);

    // FR-1.4: Khôi phục mật khẩu bằng OTP (trả về thông điệp)
    String resetPassword(ResetPasswordRequest request);
}

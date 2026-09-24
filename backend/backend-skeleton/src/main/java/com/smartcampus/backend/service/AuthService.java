package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.response.AuthResponse;

/**
 * Nghiệp vụ nhóm Auth.
 * Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 * TODO: khai báo các method nghiệp vụ tương ứng, ví dụ theo Normal Flow trong SRS.
 */
public interface AuthService {
    // TODO: bổ sung phương thức nghiệp vụ cho FR-1.1, FR-1.2, FR-1.3, FR-1.4

    public void register(RegisterRequest request);
    public AuthResponse login(LoginRequest request);
    public void changePassword(String email, ChangePasswordRequest request);
}

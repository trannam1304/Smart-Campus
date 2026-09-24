package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.response.AuthResponse;
import com.smartcampus.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * API endpoints nhóm Auth. Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 * TODO: bổ sung endpoint (GET/POST/PUT...) tương ứng Đầu vào/Đầu ra trong SRS.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    @Autowired
    private final AuthService authService;

    //POST register
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("code", 201);
        response.put("message", "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //POST login
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authData = authService.login(loginRequest);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("code", 200);
        response.put("message", "Đăng nhập thành công");
        response.put("data", authData);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    //PUT change password
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails userDetails, @Valid @RequestBody ChangePasswordRequest changePasswordRequest) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("code", 200);
        response.put("message", "Đổi mật khẩu thành công");
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

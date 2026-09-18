package com.smartcampus.backend.controller;

import com.smartcampus.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API endpoints nhóm Auth. Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 * TODO: bổ sung endpoint (GET/POST/PUT...) tương ứng Đầu vào/Đầu ra trong SRS.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

}

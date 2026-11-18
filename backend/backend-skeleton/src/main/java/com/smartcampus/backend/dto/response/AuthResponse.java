package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// FR-1.2, FR-1.3, NFR-03
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token; // Access Token (ngắn hạn)
    private String role;
    private String fullName;
    private String refreshToken; // Refresh Token (dài hạn)
    private String studentCode;
    private String email;
    private Long userId;

    public AuthResponse(String token, String role, String fullName) {
        this.token = token;
        this.role = role;
        this.fullName = fullName;
        this.refreshToken = null;
    }

    public AuthResponse(String token, String role, String fullName, String refreshToken) {
        this.token = token;
        this.role = role;
        this.fullName = fullName;
        this.refreshToken = refreshToken;
    }
}

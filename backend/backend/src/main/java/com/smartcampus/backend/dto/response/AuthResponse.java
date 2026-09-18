package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

// FR-1.2, FR-1.3
@Getter @Setter @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String fullName;
}

package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// FR-1.2, FR-1.3
@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
public class AuthResponse { 
    private String accessToken; 
    private String tokenType = "Bearer"; 
    private long expiresIn; 
    private UserInfoDto user; 
    @Data 
    @Builder 
    @NoArgsConstructor 
    @AllArgsConstructor 
    public static class UserInfoDto { 
        private Long id; 
        private String studentCode; 
        private String fullName; 
        private String email; 
        private String role; 
        private boolean libraryTrained; 
        private int noShowCount; 
        private boolean isLocked; 
    } 
}

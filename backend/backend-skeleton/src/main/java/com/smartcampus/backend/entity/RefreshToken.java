package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity Refresh Token dùng để cấp mới Access Token và quản lý phiên đăng nhập (FR-1.2, NFR-03).
 * Lưu vào bảng refresh_tokens.
 */
@Getter
@Setter
@Entity
@Table(name = "refresh_tokens")
@AttributeOverride(name = "id", column = @Column(name = "token_id"))
public class RefreshToken extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_revoked", nullable = false)
    private Boolean isRevoked = false;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}


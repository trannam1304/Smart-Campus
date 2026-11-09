-- Flyway migration: V15__create_refresh_tokens_table.sql
-- Bảng lưu trữ Refresh Token phía máy chủ để quản lý phiên và thu hồi token (NFR-03, FR-1.2)

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,

    CONSTRAINT fk_refresh_token_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_refresh_token_hash (token_hash),
    INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================

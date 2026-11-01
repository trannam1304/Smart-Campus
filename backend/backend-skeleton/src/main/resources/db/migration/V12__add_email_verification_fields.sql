-- Flyway migration: V12__add_email_verification_fields.sql
-- Thêm cột xác thực email vào bảng users (FR-1.1)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS verification_token_expires_at DATETIME NULL;

-- =====================================================================

-- Flyway migration: V14__add_pending_status_to_users.sql
-- Thêm giá trị PENDING vào cột status của bảng users (FR-1.1: Đăng ký tài khoản)

ALTER TABLE users
    MODIFY COLUMN status ENUM('ACTIVE', 'LOCKED', 'PENDING') NOT NULL DEFAULT 'PENDING';

-- =====================================================================


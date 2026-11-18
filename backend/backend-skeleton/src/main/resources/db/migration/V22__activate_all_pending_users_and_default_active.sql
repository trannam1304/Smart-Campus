-- Flyway migration: V22__activate_all_pending_users_and_default_active.sql
-- Bỏ cơ chế duyệt tài khoản: chuyển toàn bộ tài khoản PENDING sang ACTIVE và đặt mặc định là ACTIVE

UPDATE users
SET status = 'ACTIVE', verification_token = NULL, verification_token_expires_at = NULL
WHERE status = 'PENDING';

ALTER TABLE users
    MODIFY COLUMN status ENUM('ACTIVE', 'LOCKED', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

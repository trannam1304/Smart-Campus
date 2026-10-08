-- Flyway migration: V2__create_users_and_authentication.sql
-- Source: SQL_migration1(1).sql

-- 2. NGƯỜI DÙNG & BẢO MẬT (USERS & AUTHENTICATION)
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    student_code VARCHAR(30) NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN', 'STAFF')
        NOT NULL DEFAULT 'STUDENT',
    department VARCHAR(150) NULL,
    google_sso_id VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'LOCKED')
        NOT NULL DEFAULT 'ACTIVE',
    library_trained BOOLEAN NOT NULL DEFAULT FALSE,
    no_show_count INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_student_code UNIQUE (student_code),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_google_sso UNIQUE (google_sso_id),
    CONSTRAINT chk_users_no_show CHECK (no_show_count >= 0),

    -- Sinh viên bắt buộc phải có mã số sinh viên theo ghi chú ERD
    CONSTRAINT chk_users_student_code_required
        CHECK (role != 'STUDENT' OR student_code IS NOT NULL),

    -- Kiểm tra cấu trúc email cơ bản
    CONSTRAINT chk_users_email_format
        CHECK (email LIKE '%_@__%.__%')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_otp (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(20) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_otp_expiry CHECK (expires_at >= created_at),
    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================

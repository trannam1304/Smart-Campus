-- Flyway migration: V21__create_warnings_and_appeals.sql
-- Quản lý vi phạm, cảnh báo, khóa tài khoản và khiếu nại của sinh viên

CREATE TABLE IF NOT EXISTS user_warnings (
    warning_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reason TEXT NOT NULL,
    severity ENUM('WARNING', 'FINAL_WARNING', 'LOCK') NOT NULL DEFAULT 'WARNING',
    status ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    CONSTRAINT fk_warnings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_appeals (
    appeal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    warning_id INT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    admin_response TEXT NULL,
    resolved_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_appeals_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_warning FOREIGN KEY (warning_id) REFERENCES user_warnings(warning_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Khởi tạo cảnh báo mẫu cho sinh viên 52400123 (Trần Hữu Nam) để kiểm thử hiển thị ngay
INSERT INTO user_warnings (user_id, reason, severity, status, created_at)
SELECT user_id, 'Không thực hiện check-in nhận phòng đúng giờ quy định sau 15 phút (Lần 1)', 'WARNING', 'ACTIVE', NOW()
FROM users WHERE student_code = '52400123' LIMIT 1;

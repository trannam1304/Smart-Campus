-- Flyway migration: V4__create_notifications_incidents_discipline_settings.sql
-- Source: SQL_migration1(1).sql

-- 4. THÔNG BÁO, SỰ CỐ, KỶ LUẬT & HỆ THỐNG
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT NULL,
    type ENUM(
        'BOOKING_CONFIRM',
        'REMINDER',
        'CANCEL_WARNING',
        'APPROVAL_RESULT',
        'MAINTENANCE_OVERRIDE'
    ) NOT NULL,
    channel ENUM('EMAIL', 'IN_APP') NOT NULL,
    content TEXT NOT NULL,
    status ENUM('SENT', 'QUEUED', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    sent_at DATETIME NULL,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    reporter_id INT NOT NULL,
    booking_id INT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NULL,
    status ENUM('NEW', 'PROCESSING', 'RESOLVED')
        NOT NULL DEFAULT 'NEW',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_equipment
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_incident_reporter
        FOREIGN KEY (reporter_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_incident_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS discipline_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT NOT NULL,
    reason ENUM('NO_SHOW') NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Mỗi sinh viên chỉ bị xử lý kỷ luật 1 lần cho cùng 1 lượt đặt
    CONSTRAINT uq_discipline_user_booking UNIQUE (user_id, booking_id),

    -- Định dạng niên khóa chuẩn vd: 2025-2026
    CONSTRAINT chk_discipline_academic_year 
        CHECK (academic_year REGEXP '^[0-9]{4}-[0-9]{4}$'),

    CONSTRAINT fk_discipline_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_discipline_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NULL,
    description VARCHAR(500) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================

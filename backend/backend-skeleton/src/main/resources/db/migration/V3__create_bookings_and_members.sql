-- Flyway migration: V3__create_bookings_and_members.sql
-- Source: SQL_migration1(1).sql

-- 3. ĐẶT PHÒNG & THÀNH VIÊN (BOOKINGS & MEMBERS)
-- =====================================================================

CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    num_people INT NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    status ENUM(
        'PENDING_APPROVAL',
        'CONFIRMED',
        'IN_USE',
        'COMPLETED',
        'COMPLETED_FORCE',
        'CANCELLED_USER',
        'CANCELLED_AUTO',
        'CANCELLED_ADMIN'
    ) NOT NULL DEFAULT 'PENDING_APPROVAL',
    qr_code VARCHAR(255) NOT NULL,
    checkin_time DATETIME NULL,
    checkout_time DATETIME NULL,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_bookings_qr_code UNIQUE (qr_code),
    CONSTRAINT chk_bookings_people CHECK (num_people > 0),
    CONSTRAINT chk_bookings_time CHECK (end_time > start_time),

    -- Kiểm tra thứ tự checkout sau checkin
    CONSTRAINT chk_bookings_checkout_time
        CHECK (checkout_time IS NULL OR checkin_time IS NULL OR checkout_time >= checkin_time),

    -- Tính nhất quán của việc phê duyệt lượt đặt
    CONSTRAINT chk_bookings_approval_consistency
        CHECK (
            (approved_by IS NULL AND approved_at IS NULL)
            OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
        ),

    CONSTRAINT fk_bookings_room
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_owner
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    -- SỬA LỖI TƯƠNG THÍCH MariaDB: bản gốc dùng "ON UPDATE CASCADE / ON DELETE SET NULL",
    -- nhưng MariaDB 10.5+ (khác với MySQL 8) CẤM một cột vừa nằm trong CHECK constraint
    -- vừa có FK với hành động tự động CASCADE/SET NULL (lỗi 1901 "Function or expression
    -- 'approved_by' cannot be used in the CHECK clause"), vì CHECK sẽ không được đối soát
    -- lại khi FK tự ý sửa dữ liệu. Đổi cả hai vế sang RESTRICT để tương thích đồng thời
    -- MySQL lẫn MariaDB, và nhất quán với fk_bookings_room/fk_bookings_owner ở trên.
    CONSTRAINT fk_bookings_approver
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_members (
    booking_id INT NOT NULL,
    user_id INT NOT NULL,

    PRIMARY KEY (booking_id, user_id),

    CONSTRAINT fk_booking_members_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_members_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================

-- Flyway migration: V16__add_updated_at_to_users_and_bookings.sql
-- Thêm cột updated_at vào bảng users và bookings để đồng bộ với BaseEntity

ALTER TABLE users
    ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE bookings
    ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


-- Flyway migration: V13__add_version_column_to_bookings.sql
-- Thêm cột version cho Optimistic Locking trên bảng bookings (FR-3.2)

ALTER TABLE bookings
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- =====================================================================

-- Flyway migration: V5__create_performance_indexes.sql
-- Source: SQL_migration1(1).sql

-- 5. CHỈ MỤC TỐI ƯU TRUY VẤN (PERFORMANCE INDEXES)
-- =====================================================================

CREATE INDEX idx_rooms_floor_type 
    ON rooms (floor_id, room_type_id);

CREATE INDEX idx_bookings_conflict_check 
    ON bookings (room_id, booking_date, start_time, end_time, status);

CREATE INDEX idx_bookings_user_quota 
    ON bookings (user_id, booking_date, status);

CREATE INDEX idx_bookings_date_status 
    ON bookings (booking_date, status);

CREATE INDEX idx_discipline_user_year 
    ON discipline_log (user_id, academic_year);

CREATE INDEX idx_notifications_user_status 
    ON notifications (user_id, status);

-- =====================================================================

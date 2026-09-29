package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

// FR-3.1, FR-3.2, FR-3.3, FR-5.2, FR-5.3
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // 1. Thuật toán kiểm tra xung đột thời gian (Conflict Checking) trên cùng 1 phòng
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b 
        WHERE b.room.id = :roomId 
          AND b.startTime < :endTime 
          AND b.endTime > :startTime 
          AND b.status IN :activeStatuses
    """)
    boolean existsOverlappingBooking(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("activeStatuses") List<BookingStatus> activeStatuses
    );

    // 2. Kiểm tra trùng lịch cá nhân sinh viên (Một sinh viên không đặt 2 phòng cùng giờ)
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b 
        WHERE b.user.id = :userId 
          AND b.startTime < :endTime 
          AND b.endTime > :startTime 
          AND b.status IN :activeStatuses
    """)
    boolean existsOverlappingUserBooking(
            @Param("userId") Long userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("activeStatuses") List<BookingStatus> activeStatuses
    );

    // 3. Tính tổng số giờ sinh viên đã đăng ký trong tuần (Giới hạn Quota 10h/tuần)
    @Query("""
        SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, b.startTime, b.endTime)), 0) / 60.0 
        FROM Booking b 
        WHERE b.user.id = :userId
          AND b.startTime >= :startOfWeek 
          AND b.endTime <= :endOfWeek
          AND b.status IN :activeStatuses
    """)
    double calculateWeeklyHours(
            @Param("userId") Long userId,
            @Param("startOfWeek") LocalDateTime startOfWeek,
            @Param("endOfWeek") LocalDateTime endOfWeek,
            @Param("activeStatuses") List<BookingStatus> activeStatuses
    );
}

package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Truy vấn lượt đặt phòng (bookings). Liên quan: FR-3.1, FR-3.2, FR-3.3, FR-5.2, FR-5.3
 *
 * <p>FR-3.2 Chống trùng lịch: hai lượt đặt xâm nhau nếu
 * {@code start_new < existing_end AND end_new > existing_start} với cùng phòng
 * và trạng thái đang hiệu lực (CONFIRMED / IN_USE / PENDING_APPROVAL).
 *
 * <p>FR-3.3 Hạn mức: tổng giờ đặt trong tuần của một MSSV (các booking
 * CONFIRMED / IN_USE / COMPLETED).
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // ------------------------------------------------------------------
    // FR-3.2: Kiểm tra trùng lịch trên một phòng
    // ------------------------------------------------------------------
    @Query("""
        SELECT b FROM Booking b
        WHERE b.room.id = :roomId
          AND b.status IN (:statuses)
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """)
    List<Booking> findConflictingBookings(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") List<BookingStatus> statuses);

    // ------------------------------------------------------------------
    // FR-3.2: Kiểm tra trùng lịch cá nhân (một MSSV không trùng 2 lượt)
    // ------------------------------------------------------------------
    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :userId
          AND b.status IN (:statuses)
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """)
    List<Booking> findConflictingBookingsByUser(
            @Param("userId") Long userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") List<BookingStatus> statuses);

    // ------------------------------------------------------------------
    // FR-3.3: Tổng giờ đặt trong tuần của một user (status hiệu lực)
    // ------------------------------------------------------------------
    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :userId
          AND b.status IN (:statuses)
          AND b.startTime >= :weekStart
          AND b.startTime < :weekEnd
        """)
    List<Booking> findActiveBookingsInWeek(
            @Param("userId") Long userId,
            @Param("weekStart") LocalDateTime weekStart,
            @Param("weekEnd") LocalDateTime weekEnd,
            @Param("statuses") List<BookingStatus> statuses);

    // ------------------------------------------------------------------
    // FR-5.3: Các booking CONFIRMED quá hạn để auto-release
    // ------------------------------------------------------------------
    List<Booking> findByRoomIdAndStartTimeBetween(Long roomId, LocalDateTime from, LocalDateTime to);

    @Transactional
    @Query("UPDATE Booking b SET b.status = :status WHERE b.id = :id")
    int updateStatusById(Long id, BookingStatus status);
}

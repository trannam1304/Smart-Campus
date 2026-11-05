package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho thực thể Booking.
 * Nghiệp vụ liên quan: FR-3.1, FR-3.2, FR-3.3, FR-5.1, FR-5.2, FR-5.3, FR-6.1, FR-6.2, FR-6.3, NFR-01
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRoomIdAndStartTimeBetween(Long roomId, LocalDateTime from, LocalDateTime to);

    Optional<Booking> findByQrCode(String qrCode);

    /**
     * FR-5.3 & NFR-01: Truy vấn các booking quá hạn check-in để tự động hủy và giải phóng tài nguyên.
     * Sử dụng JOIN FETCH nạp Room và User trong 1 query tránh N+1.
     */
    @Query("""
        SELECT b FROM Booking b 
        JOIN FETCH b.room r 
        LEFT JOIN FETCH b.user u 
        WHERE b.status IN (:statuses) 
          AND b.checkinTime IS NULL 
          AND b.startTime <= :cutoffTime
    """)
    List<Booking> findOverdueBookings(
        @Param("statuses") List<Booking.BookingStatus> statuses,
        @Param("cutoffTime") LocalDateTime cutoffTime
    );

    /**
     * FR-6.2 & NFR-01: Quét các booking chuẩn bị diễn ra trong vòng 15 phút tới chưa được gửi nhắc nhở.
     * Lọc b.status = CONFIRMED, b.reminderSent = false (hoặc null), và startTime nằm trong khoảng window [now, now + 15m].
     * Dùng JOIN FETCH để nạp User và Room tránh N+1 query.
     */
    @Query("""
        SELECT b FROM Booking b 
        JOIN FETCH b.room r 
        JOIN FETCH b.user u 
        WHERE b.status = :status 
          AND (b.reminderSent = false OR b.reminderSent IS NULL) 
          AND b.startTime >= :windowStart 
          AND b.startTime <= :windowEnd
    """)
    List<Booking> findBookingsNeedingReminder(
        @Param("status") Booking.BookingStatus status,
        @Param("windowStart") LocalDateTime windowStart,
        @Param("windowEnd") LocalDateTime windowEnd
    );

    /**
     * NFR-01: Kiểm tra xem phòng có còn lượt đặt nào khác đang kích hoạt trong khung giờ hiện tại hay không.
     */
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b 
        WHERE b.room.id = :roomId 
          AND b.id <> :excludeBookingId 
          AND b.status IN ('CONFIRMED', 'IN_USE') 
          AND :now BETWEEN b.startTime AND b.endTime
    """)
    boolean hasActiveBookingsForRoom(
        @Param("roomId") Long roomId,
        @Param("excludeBookingId") Long excludeBookingId,
        @Param("now") LocalDateTime now
    );
}

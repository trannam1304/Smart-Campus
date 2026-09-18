package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

// FR-3.1, FR-3.2, FR-3.3, FR-5.2, FR-5.3
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // TODO (Nhóm 3 - Booking): query kiểm tra trùng lịch (FR-3.2)
    // TODO (Nhóm 3 - Booking): query tính tổng giờ đặt trong tuần theo user (FR-3.3)
    // TODO (Nhóm 5 - Checkin): query các booking CONFIRMED quá hạn để auto-release (FR-5.3)
    List<Booking> findByRoomIdAndStartTimeBetween(Long roomId, LocalDateTime from, LocalDateTime to);
}

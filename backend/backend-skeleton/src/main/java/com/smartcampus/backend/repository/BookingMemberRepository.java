package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.BookingMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Truy vấn thành viên lượt đặt (booking_members). Liên quan: FR-3.1, FR-3.2, FR-3.3.
 */
public interface BookingMemberRepository extends JpaRepository<BookingMember, Long> {

    List<BookingMember> findByBookingId(Long bookingId);

    List<BookingMember> findByUserId(Long userId);
}

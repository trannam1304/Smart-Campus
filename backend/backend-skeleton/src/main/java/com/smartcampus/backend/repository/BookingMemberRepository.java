package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.BookingMember;
import com.smartcampus.backend.entity.BookingMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Truy vấn thành viên lượt đặt (booking_members). Liên quan: FR-3.1, FR-3.2, FR-3.3.
 */
@Repository
public interface BookingMemberRepository extends JpaRepository<BookingMember, BookingMemberId> {

    List<BookingMember> findByBookingId(Long bookingId);

    List<BookingMember> findByUserId(Long userId);
}

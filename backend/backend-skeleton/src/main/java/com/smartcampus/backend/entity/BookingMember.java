package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Thành viên tham gia lượt đặt phòng (booking_members).
 * Bảng liên kết nhiều-nhiều giữa bookings và users với khóa chính kép (booking_id, user_id).
 */
@Getter
@Setter
@Entity
@Table(name = "booking_members")
@IdClass(BookingMemberId.class)
public class BookingMember {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}

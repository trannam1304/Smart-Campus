package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Thành viên tham gia lượt đặt phòng (booking_members).
 * Dùng để kiểm tra P-MEMBERS (số MSSV thành viên = số người khai báo)
 * và P-CONCURRENT (một MSSV không thể trùng 2 lượt đặt).
 * Liên quan: FR-3.1, FR-3.2, FR-3.3.
 */
@Getter
@Setter
@Entity
@Table(name = "booking_members")
public class BookingMember extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}

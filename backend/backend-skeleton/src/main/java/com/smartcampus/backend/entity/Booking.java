package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Entity Lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-3.1 (đặt phòng), FR-3.2 (chống trùng lịch), FR-3.3 (hạn mức tuần),
 * FR-5.1/5.2/5.3 (QR check-in, auto-release)
 * TODO (Nhóm 3 - Booking / Nhóm 5 - Checkin): bổ sung field theo ERD thực tế.
 */
@Getter
@Setter
@Entity
@Table(name = "bookings")
public class Booking extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "room_id")
    private Room room;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer numberOfPeople;
    private String purpose; // Mục đích sử dụng

    private String qrCode; // FR-5.1

    @Enumerated(EnumType.STRING)
    private BookingStatus status; // CONFIRMED / IN_USE / CANCELLED_AUTO / COMPLETED

    public enum BookingStatus { CONFIRMED, IN_USE, CANCELLED_AUTO, COMPLETED }
}

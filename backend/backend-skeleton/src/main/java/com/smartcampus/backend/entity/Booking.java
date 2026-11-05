package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Entity Lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-3.1 (đặt phòng), FR-3.2 (chống trùng lịch), FR-3.3 (hạn mức tuần),
 * FR-5.1/5.2/5.3 (QR check-in, auto-release), FR-6.1/6.2/6.3 (Email xác nhận, nhắc hẹn, cảnh báo)
 */
@Getter
@Setter
@Entity
@Table(name = "bookings")
@AttributeOverride(name = "id", column = @Column(name = "booking_id"))
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer numberOfPeople;
    private String purpose; // Mục đích sử dụng

    private String qrCode; // FR-5.1

    private LocalDateTime checkinTime;
    private LocalDateTime checkoutTime;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false; // FR-6.2: Cờ đánh dấu đã gửi email nhắc hẹn trước 15 phút

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    public enum BookingStatus {
        PENDING,
        PENDING_APPROVAL,
        CONFIRMED,
        IN_USE,
        CANCELLED_AUTO,
        COMPLETED,
        CANCELLED_USER,
        CANCELLED_ADMIN,
        CANCELLED,
        EXPIRED
    }
}

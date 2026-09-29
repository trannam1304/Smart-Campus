package com.smartcampus.backend.entity;

import com.smartcampus.backend.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Entity Lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-3.1 (đặt phòng), FR-3.2 (chống trùng lịch), FR-3.3 (hạn mức tuần),
 * FR-5.1/5.2/5.3 (QR check-in, auto-release)
 * TODO (Nhóm 3 - Booking / Nhóm 5 - Checkin): bổ sung field theo ERD thực tế.
 */
@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_booking_time_room", columnList = "room_id, start_time, end_time, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "number_of_people", nullable = false)
    private Integer numberOfPeople;

    private String purpose;

    @Column(name = "qr_code", unique = true)
    private String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.CONFIRMED;
}
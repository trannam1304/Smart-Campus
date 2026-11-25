package com.smartcampus.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Entity Thông báo hệ thống.
 * Nghiệp vụ liên quan: FR-6.1 (xác nhận đặt phòng), FR-6.2 (nhắc lịch), FR-6.3 (cảnh báo huỷ/bảo trì)
 */
@Getter
@Setter
@Entity
@Table(name = "notifications")
@AttributeOverride(name = "id", column = @Column(name = "notification_id"))
public class Notification extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    private String title;
    private String content;

    @Enumerated(EnumType.STRING)
    private NotificationType type; // BOOKING_CONFIRM / REMINDER / CANCEL_WARNING

    @Enumerated(EnumType.STRING)
    private Channel channel = Channel.EMAIL;

    @Enumerated(EnumType.STRING)
    private Status status = Status.SENT;

    private LocalDateTime sentAt;

    @Column(name = "is_read")
    private boolean isRead = false;

    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    public Long getBookingId() {
        return booking != null ? booking.getId() : null;
    }

    public enum NotificationType {
        BOOKING_CONFIRM,
        BOOKING_CONFIRMED,
        REMINDER,
        CANCEL_WARNING,
        APPROVAL_RESULT,
        MAINTENANCE_OVERRIDE
    }

    public enum Channel {
        EMAIL,
        IN_APP
    }

    public enum Status {
        SENT,
        QUEUED,
        FAILED
    }
}

package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity Thông báo hệ thống.
 * Nghiệp vụ liên quan: FR-6.1 (xác nhận đặt phòng), FR-6.2 (nhắc lịch), FR-6.3 (cảnh báo huỷ/bảo trì)
 * TODO (Nhóm 6 - Notification): bổ sung field theo ERD thực tế.
 */
@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String title;
    private String content;

    @Enumerated(EnumType.STRING)
    private NotificationType type; // BOOKING_CONFIRMED / REMINDER / CANCEL_WARNING

    private boolean isRead = false;

    public enum NotificationType { BOOKING_CONFIRMED, REMINDER, CANCEL_WARNING }
}

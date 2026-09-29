package com.smartcampus.backend.entity;

import com.smartcampus.backend.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity Thông báo hệ thống.
 * Nghiệp vụ liên quan: FR-6.1 (xác nhận đặt phòng), FR-6.2 (nhắc lịch), FR-6.3 (cảnh báo huỷ/bảo trì)
 * TODO (Nhóm 6 - Notification): bổ sung field theo ERD thực tế.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
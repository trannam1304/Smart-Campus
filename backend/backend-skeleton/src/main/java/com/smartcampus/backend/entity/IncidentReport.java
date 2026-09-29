package com.smartcampus.backend.entity;

import com.smartcampus.backend.entity.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity Báo cáo sự cố thiết bị.
 * Nghiệp vụ liên quan: FR-4.2 (gửi báo cáo sự cố)
 * TODO (Nhóm 4 - Device): bổ sung field hình ảnh đính kèm theo ERD thực tế.
 */
@Entity
@Table(name = "incident_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IncidentReport extends BaseEntity {

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hardware_resource_id")
    private HardwareResource hardwareResource;
}

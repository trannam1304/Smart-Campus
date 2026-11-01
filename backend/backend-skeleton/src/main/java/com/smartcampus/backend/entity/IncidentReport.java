package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity Báo cáo sự cố thiết bị.
 * Nghiệp vụ liên quan: FR-4.2 (gửi báo cáo sự cố)
 * TODO (Nhóm 4 - Device): bổ sung field hình ảnh đính kèm theo ERD thực tế.
 */
@Getter
@Setter
@Entity
@Table(name = "incident_reports")
public class IncidentReport extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne
    @JoinColumn(name = "hardware_id")
    private HardwareResource hardware;

    @ManyToOne
    @JoinColumn(name = "reported_by")
    private User reportedBy;

    private String description;
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private TicketStatus status; // OPEN / IN_PROGRESS / RESOLVED

    public enum TicketStatus { OPEN, IN_PROGRESS, RESOLVED }
}

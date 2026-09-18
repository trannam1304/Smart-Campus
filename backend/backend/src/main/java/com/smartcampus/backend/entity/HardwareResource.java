package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity Thiết bị phần cứng trong phòng (máy chiếu, loa, bảng...).
 * Nghiệp vụ liên quan: FR-4.1 (hiển thị danh mục), FR-4.3 (tự động loại bỏ phòng lỗi thiết bị)
 * TODO (Nhóm 4 - Device): bổ sung field theo ERD thực tế.
 */
@Getter
@Setter
@Entity
@Table(name = "hardware_resources")
public class HardwareResource extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "room_id")
    private Room room;

    private String deviceName;

    @Enumerated(EnumType.STRING)
    private DeviceStatus status; // GOOD / BROKEN / REPAIRING

    public enum DeviceStatus { GOOD, BROKEN, REPAIRING }
}

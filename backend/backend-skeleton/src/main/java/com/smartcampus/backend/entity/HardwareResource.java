package com.smartcampus.backend.entity;

import com.smartcampus.backend.entity.enums.DeviceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity Thiết bị phần cứng trong phòng (máy chiếu, loa, bảng...).
 * Nghiệp vụ liên quan: FR-4.1 (hiển thị danh mục), FR-4.3 (tự động loại bỏ phòng lỗi thiết bị)
 * TODO (Nhóm 4 - Device): bổ sung field theo ERD thực tế.
 */
@Entity
@Table(name = "hardware_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HardwareResource extends BaseEntity {

    @Column(name = "device_name", nullable = false)
    private String deviceName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status = DeviceStatus.GOOD;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @OneToMany(mappedBy = "hardwareResource", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IncidentReport> incidentReports = new ArrayList<>();
}

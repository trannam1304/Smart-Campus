package com.smartcampus.backend.entity;

import com.smartcampus.backend.entity.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity Phòng học tự học.
 * Nghiệp vụ liên quan: FR-2.1 (lịch trạng thái), FR-2.2 (sơ đồ tầng), FR-2.3 (bộ lọc), FR-2.4 (mã màu trạng thái)
 * TODO (Nhóm 2/4 - Room & Device): bổ sung field toạ độ SVG, sức chứa, tòa nhà/tầng theo ERD.
 */
@Getter
@Setter
@Entity
@Table(name = "rooms")

@NoArgsConstructor
@AllArgsConstructor
public class Room extends BaseEntity {
    @Column(name= "room_code", nullable = false, unique = true)
    private String roomCode;

    @Column(nullable = false)
    private String building;   // Tòa nhà

    @Column(nullable = false)
    private Integer floor;     // Tầng

    @Column(nullable = false)
    private Integer capacity;  // Sức chứa

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status = RoomStatus.AVAILABLE; // AVAILABLE / BOOKED / MAINTENANCE / SELF_BOOKED - FR-2.4

    @Version
    private Long version;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings =  new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IncidentReport> incidentReports =  new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL,  fetch = FetchType.LAZY)
    private List<HardwareResource> hardwareResources = new ArrayList<>(); // FR-4.1, FR-4.3

}

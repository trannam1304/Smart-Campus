package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

/**
 * Entity Phòng học tự học.
 * Nghiệp vụ liên quan: FR-2.1 (lịch trạng thái), FR-2.2 (sơ đồ tầng), FR-2.3 (bộ lọc), FR-2.4 (mã màu trạng thái)
 */
@Getter
@Setter
@Entity
@Table(name = "rooms")
@AttributeOverride(name = "id", column = @Column(name = "room_id"))
public class Room extends BaseEntity {

    private String roomCode;
    private String building;   // Tòa nhà
    private Integer floor;     // Tầng
    private Integer capacity;  // Sức chứa

    @Enumerated(EnumType.STRING)
    private RoomStatus status; // AVAILABLE / BOOKED / MAINTENANCE / SELF_BOOKED - FR-2.4

    @OneToMany(mappedBy = "room")
    private List<HardwareResource> hardwareResources; // FR-4.1, FR-4.3

    public enum RoomStatus { AVAILABLE, BOOKED, MAINTENANCE, SELF_BOOKED }
}

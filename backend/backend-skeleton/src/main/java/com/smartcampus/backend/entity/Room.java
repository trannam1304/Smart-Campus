package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

/**
 * Entity Phòng học tự học.
 * Nghiệp vụ liên quan: FR-2.1, FR-2.2, FR-2.3, FR-2.4
 */
@Getter
@Setter
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @Column(name = "room_code")
    private String roomCode;

    @Transient
    private String building;   // Tòa nhà

    @Transient
    private Integer floor;     // Tầng

    @Column(name = "capacity")
    private Integer capacity;  // Sức chứa

    @Enumerated(EnumType.STRING)
    @Column(name = "base_status")
    private RoomStatus status; // AVAILABLE / BOOKED / MAINTENANCE / SELF_BOOKED - FR-2.4

    @Transient
    private List<HardwareResource> hardwareResources; // FR-4.1, FR-4.3

    public enum RoomStatus { AVAILABLE, BOOKED, MAINTENANCE, SELF_BOOKED }
}

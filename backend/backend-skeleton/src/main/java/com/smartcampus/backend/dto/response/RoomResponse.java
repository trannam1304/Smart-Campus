package com.smartcampus.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

// FR-2.1, FR-2.2, FR-2.4
@Getter @Setter
public class RoomResponse {
    private Long id;
    private String roomCode;
    private String building;
    private Integer floor;
    private Integer capacity;
    private String status; // dùng để map màu sắc FE (FR-2.4)
}

package com.smartcampus.backend.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

// FR-2.3
@Getter @Setter
public class RoomFilterRequest {
    private LocalDateTime from;
    private LocalDateTime to;
    private Integer minCapacity;
    private String building;
    private List<String> requiredDevices; // vd: "PROJECTOR", "AIRCON"
}

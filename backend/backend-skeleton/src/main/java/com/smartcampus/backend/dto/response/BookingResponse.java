package com.smartcampus.backend.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// FR-3.1, FR-5.1
@Getter @Setter
public class BookingResponse {
    private Long id;
    private String roomCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String qrCodeUrl; // FR-5.1
}

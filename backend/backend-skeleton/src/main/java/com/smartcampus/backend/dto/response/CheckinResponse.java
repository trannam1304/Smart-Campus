package com.smartcampus.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// FR-5.2: Kết quả check-in
@Getter @Setter
public class CheckinResponse {
    private Long bookingId;
    private String roomCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status; // IN_USE
    private LocalDateTime checkinTime;
    private String message;
}

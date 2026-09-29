package com.smartcampus.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponse {
    private Long bookingId;
    private String roomCode;
    private String building;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer numberOfPeople;
    private String qrCode;
    private String status;
    private String checkInWindowStart;
    private String checkInWindowEnd;
}

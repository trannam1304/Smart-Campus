package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// FR-3.1
@Getter @Setter
public class BookingRequest {
    @NotNull private Long roomId;
    @NotNull private LocalDateTime startTime;
    @NotNull private LocalDateTime endTime;
    private Integer numberOfPeople;
    private String purpose;
}

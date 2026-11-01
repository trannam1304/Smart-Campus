package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RoomUpsertRequest(
        @NotBlank @Size(max = 30) String roomCode,
        @NotNull @Min(1) Long buildingId,
        @NotNull Integer floorNumber,
        @NotBlank @Size(max = 30) String roomTypeCode,
        @NotNull @Min(1) Integer capacity,
        @NotBlank @Pattern(regexp = "AVAILABLE|MAINTENANCE") String status
) {
}

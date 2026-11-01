package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EquipmentRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 100) String type,
        @NotBlank @Pattern(regexp = "GOOD|BROKEN|REPAIRING") String status
) {
}

package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// FR-4.2
@Getter @Setter
public class IncidentReportRequest {
    @NotNull private Long roomId;
    @NotNull private Long hardwareId;
    private String description;
    private String imageUrl;
}

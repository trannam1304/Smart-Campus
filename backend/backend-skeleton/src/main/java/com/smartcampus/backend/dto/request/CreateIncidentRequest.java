package com.smartcampus.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateIncidentRequest {
    private String roomId;
    private String equipmentId;
    private String description;
    private String imageUrl;
}

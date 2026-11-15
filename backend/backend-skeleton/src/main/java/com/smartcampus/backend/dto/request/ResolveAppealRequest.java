package com.smartcampus.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveAppealRequest {
    private String status;
    private String adminResponse;
}

package com.smartcampus.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppealRequest {
    private Long warningId;
    private String reason;
}

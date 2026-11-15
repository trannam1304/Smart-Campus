package com.smartcampus.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WarnUserRequest {
    private Long userId;
    private String studentCode;
    private String reason;
    private String severity;
    private Boolean lockAccount;
}

package com.smartcampus.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LockUserRequest {
    private Long userId;
    private String studentCode;
    private String status;
}

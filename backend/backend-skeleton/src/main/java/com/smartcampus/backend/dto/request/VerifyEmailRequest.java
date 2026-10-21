package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// FR-1.1: Xác thực email qua mã token gửi về
@Getter @Setter
public class VerifyEmailRequest {
    @NotBlank(message = "Vui lòng mã thông báo xác thực.")
    private String token;
}

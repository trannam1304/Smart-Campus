package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckinQrRequest {

    @NotBlank(message = "qrData không được để trống.")
    private String qrData;

    private String scannedAt;

    private String deviceLocation;
}

package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// FR-5.2: Quét mã QR nhận phòng
@Getter @Setter
public class CheckinRequest {
    @NotBlank(message = "Vui lòng quét mã QR.")
    private String qrCode; // Mã QR quét từ thiết bị cửa hoặc app
}

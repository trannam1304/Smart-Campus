package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QrCodeDetailResponse {
    private String bookingId;
    private String roomCode;
    private String qrCodeData;
    private String qrCodeImageBase64;
    private CheckInWindow checkInWindow;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckInWindow {
        private String allowEarlyFrom;
        private String deadlineAt;
    }
}

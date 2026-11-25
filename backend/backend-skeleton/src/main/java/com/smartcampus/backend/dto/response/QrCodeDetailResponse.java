package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO trả về thông tin chi tiết mã QR của lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-5.1, FR-6.1
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QrCodeDetailResponse {

    private String bookingCode;
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

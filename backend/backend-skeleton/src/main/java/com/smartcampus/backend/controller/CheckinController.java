package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.CheckinRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.CheckinResponse;
import com.smartcampus.backend.service.CheckinService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API endpoints nhóm Checkin (Điểm danh qua mã QR).
 * Liên quan: FR-5.1, FR-5.2, FR-5.3
 *
 * <p>Shell controller — FR-5.2 đã triển khai chi tiết tại
 * {@link com.smartcampus.backend.controller.BookingCheckinController}.
 * Các endpoint FR-5.1 và FR-5.3 chưa triển khai nghiệp vụ.
 */
@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

    // ------------------------------------------------------------------
    // FR-5.1: Lấy mã QR của một lượt đặt (để hiển thị trên app sinh viên)
    // GET /api/checkin/qr/{bookingId}
    // ------------------------------------------------------------------
    @GetMapping("/qr/{bookingId}")
    public ResponseEntity<ApiResponse<CheckinResponse>> getQrCode(@PathVariable Long bookingId) {
        throw new UnsupportedOperationException("FR-5.1 chưa triển khai.");
    }

    // ------------------------------------------------------------------
    // FR-5.2: Quét mã QR nhận phòng
    // POST /api/checkin/scan
    // Body: CheckinRequest { qrCode }
    // Ghi chú: nghiệp vụ chính đã triển khai tại POST /api/bookings/check-in.
    // ------------------------------------------------------------------
    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<CheckinResponse>> scanQrCode(
            @RequestBody CheckinRequest request) {
        throw new UnsupportedOperationException("FR-5.2 dùng endpoint /api/bookings/check-in.");
    }

    // ------------------------------------------------------------------
    // FR-5.3: Tự động hủy lượt đặt quá hạn (auto-release)
    // Chạy dưới dạng Cron Job hệ thống, không có endpoint public.
    // ------------------------------------------------------------------
}

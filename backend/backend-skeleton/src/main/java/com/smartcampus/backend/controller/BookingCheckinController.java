package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.CheckinRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.CheckinResponse;
import com.smartcampus.backend.service.CheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API endpoints nhóm Checkin (FR-5.1, FR-5.2, FR-5.3).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST   /api/bookings/check-in → Quét mã QR nhận phòng, cập nhật trạng thái phòng thành Active (FR-5.2)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingCheckinController {

    private final CheckinService checkinService;

    // ------------------------------------------------------------------
    // FR-5.2: Quét mã QR nhận phòng (Check-in)
    // Header: Authorization: Bearer <JWT> (tùy chọn, nếu hệ thống yêu cầu xác thực người quét)
    // Body: { qrCode }
    // ------------------------------------------------------------------
    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<CheckinResponse>> checkIn(@Valid @RequestBody CheckinRequest request) {
        CheckinResponse result = checkinService.checkIn(request.getQrCode());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

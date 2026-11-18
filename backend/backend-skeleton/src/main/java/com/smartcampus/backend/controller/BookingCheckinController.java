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

    // ------------------------------------------------------------------
    // Trả phòng sớm / Check-out kết thúc lượt đặt
    // Body: { bookingId } hoặc PathVariable: /{id}/checkout
    // ------------------------------------------------------------------
    @PostMapping({"/check-out", "/checkout", "/{id}/checkout", "/{id}/check-out"})
    public ResponseEntity<ApiResponse<CheckinResponse>> checkOut(
            @PathVariable(required = false) Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @RequestParam(required = false) Long bookingId) {

        Long targetId = id;
        if (targetId == null && bookingId != null) {
            targetId = bookingId;
        }
        if (targetId == null && body != null) {
            Object raw = body.get("bookingId");
            if (raw == null) raw = body.get("id");
            if (raw != null) {
                String numeric = raw.toString().replaceAll("[^0-9]", "").trim();
                if (!numeric.isEmpty()) {
                    try {
                        targetId = Long.parseLong(numeric);
                    } catch (Exception ignored) {}
                }
            }
        }
        if (targetId == null) {
            throw new IllegalArgumentException("Thiếu bookingId để trả phòng.");
        }
        CheckinResponse result = checkinService.checkOut(targetId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

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
 * API endpoints nhóm Checkin. Liên quan: FR-5.1, FR-5.2, FR-5.3
 */
@RestController
@RequestMapping({"/api/checkin", "/api/v1/checkin"})
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

    @PostMapping({"/check-in", "/checkin"})
    public ResponseEntity<ApiResponse<CheckinResponse>> checkIn(@Valid @RequestBody CheckinRequest request) {
        CheckinResponse result = checkinService.checkIn(request.getQrCode());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

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

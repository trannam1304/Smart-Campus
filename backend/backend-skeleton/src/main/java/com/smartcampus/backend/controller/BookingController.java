package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * API endpoints nhóm Booking. Liên quan: FR-3.1, FR-3.2, FR-3.3
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST   /api/bookings → Tạo lượt đặt phòng mới (FR-3.1) với kiểm tra trùng lịch (FR-3.2)
 *       và hạn mức tuần (FR-3.3). Yêu cầu đăng nhập (JWT).</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final JwtTokenProvider jwtTokenProvider;

    // ------------------------------------------------------------------
    // FR-3.1: Tạo lượt đặt phòng mới
    // Header: Authorization: Bearer <JWT>
    // Body: { roomId, startTime, endTime, numberOfPeople, purpose, memberCodes: [...] }
    // ------------------------------------------------------------------
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingRequest request) {

        String ownerEmail = userDetails.getUsername();
        BookingResponse result = bookingService.createBooking(request, ownerEmail);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}

package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.request.RejectBookingRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.dto.response.CheckinResponse;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.CheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API endpoints nhóm Booking. Liên quan: FR-3.1, FR-3.2, FR-3.3
 */
@RestController
@RequestMapping({"/api/v1/bookings", "/api/bookings"})
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final CheckinService checkinService;
    private final JwtTokenProvider jwtTokenProvider;

    // ------------------------------------------------------------------
    // FR-3.1: Tạo lượt đặt phòng mới
    // ------------------------------------------------------------------
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingRequest request) {

        checkinService.autoReleaseExpiredBookings();
        String ownerEmail = userDetails.getUsername();
        BookingResponse result = bookingService.createBooking(request, ownerEmail);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    // ------------------------------------------------------------------
    // Lấy danh sách lịch đặt phòng của tôi
    // ------------------------------------------------------------------
    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails) {

        checkinService.autoReleaseExpiredBookings();
        String userEmail = userDetails.getUsername();
        List<BookingResponse> list = bookingService.getMyBookings(userEmail);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    // ------------------------------------------------------------------
    // Lấy toàn bộ danh sách đặt phòng (dành cho Admin / Staff)
    // ------------------------------------------------------------------
    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        checkinService.autoReleaseExpiredBookings();
        List<BookingResponse> list = bookingService.getAllBookings();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    // ------------------------------------------------------------------
    // Duyệt đơn đặt phòng (QTV)
    // ------------------------------------------------------------------
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<BookingResponse>> approveBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        BookingResponse result = bookingService.approveBooking(id, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ------------------------------------------------------------------
    // Từ chối đơn đặt phòng (QTV)
    // ------------------------------------------------------------------
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BookingResponse>> rejectBooking(
            @PathVariable Long id,
            @RequestBody(required = false) RejectBookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        String reason = request != null && request.getReason() != null ? request.getReason() : "Từ chối bởi Quản trị viên";
        BookingResponse result = bookingService.rejectBooking(id, reason, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

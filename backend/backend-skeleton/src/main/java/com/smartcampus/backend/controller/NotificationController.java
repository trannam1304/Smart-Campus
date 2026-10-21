package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.NotificationResponse;
import com.smartcampus.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API endpoints nhóm Thông báo.
 * Liên quan: FR-6.1, FR-6.2, FR-6.3
 *
 * <p>Shell controller — các endpoint có khai báo mapping nhưng thân method
 * đang ném UnsupportedOperationException (chưa triển khai nghiệp vụ).
 */
@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ------------------------------------------------------------------
    // FR-6.1: Lấy danh sách thông báo xác nhận đặt phòng của người dùng
    // GET /api/notification/confirmations?userId=...
    // ------------------------------------------------------------------
    @GetMapping("/confirmations")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getBookingConfirmations(
            @RequestParam Long userId) {
        throw new UnsupportedOperationException("FR-6.1 chưa triển khai.");
    }

    // ------------------------------------------------------------------
    // FR-6.2: Lấy danh sách thông báo nhắc lịch hẹn
    // GET /api/notification/reminders?userId=...
    // ------------------------------------------------------------------
    @GetMapping("/reminders")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getReminders(
            @RequestParam Long userId) {
        throw new UnsupportedOperationException("FR-6.2 chưa triển khai.");
    }

    // ------------------------------------------------------------------
    // FR-6.3: Lấy danh sách cảnh báo hủy lịch & bảo trì
    // GET /api/notification/alerts?userId=...
    // ------------------------------------------------------------------
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getCancellationAndMaintenanceAlerts(
            @RequestParam Long userId) {
        throw new UnsupportedOperationException("FR-6.3 chưa triển khai.");
    }
}

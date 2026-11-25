package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API endpoints nhóm Notification & Hỗ trợ Kiểm thử Email khi chưa có Frontend.
 * Nghiệp vụ liên quan: FR-6.1, FR-6.2, FR-6.3
 */
@RestController
@RequestMapping({"/api/notifications", "/api/notification", "/notifications"})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách lịch sử thông báo của người dùng
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        List<Notification> list = notificationService.getNotificationsByUserId(userId);
        return ApiResponse.ok(list, "Lấy danh sách thông báo thành công.");
    }

    /**
     * Endpoint hỗ trợ kích hoạt gửi email thử nghiệm trực tiếp từ Swagger UI / cURL khi chưa có Frontend
     * @param email địa chỉ email người nhận (ví dụ: student@gmail.com)
     * @param type  loại email: "CONFIRMATION", "REMINDER", "CANCEL"
     */
    @PostMapping("/test-email")
    public ApiResponse<String> sendTestEmail(
            @RequestParam String email,
            @RequestParam(defaultValue = "CONFIRMATION") String type) {
        notificationService.sendTestEmail(email, type);
        return ApiResponse.ok("Đã kích hoạt gửi email kiểm thử loại [" + type + "] tới " + email + ". Vui lòng kiểm tra hộp thư hoặc log console.");
    }
}

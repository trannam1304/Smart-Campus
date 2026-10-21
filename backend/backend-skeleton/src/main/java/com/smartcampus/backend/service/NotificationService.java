package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.response.NotificationResponse;
import java.util.List;

/**
 * Nghiệp vụ nhóm Thông báo.
 * Liên quan: FR-6.1 (thông báo xác nhận đặt), FR-6.2 (nhắc lịch hẹn), FR-6.3 (cảnh báo hủy & bảo trì)
 *
 * <p>Shell controller stub — triển khai chi tiết sau này.
 */
public interface NotificationService {

    // FR-6.1: Lấy danh sách thông báo xác nhận đặt phòng của người dùng
    List<NotificationResponse> getBookingConfirmations(Long userId);

    // FR-6.2: Lấy danh sách thông báo nhắc lịch hẹn
    List<NotificationResponse> getReminders(Long userId);

    // FR-6.3: Lấy danh sách cảnh báo hủy lịch & bảo trì
    List<NotificationResponse> getCancellationAndMaintenanceAlerts(Long userId);
}

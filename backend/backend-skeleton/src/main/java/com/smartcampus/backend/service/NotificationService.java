package com.smartcampus.backend.service;

import com.smartcampus.backend.entity.Notification;
import java.util.List;

/**
 * Nghiệp vụ nhóm Notification & Email thông báo.
 * Liên quan: FR-6.1, FR-6.2, FR-6.3
 */
public interface NotificationService {

    /**
     * Lấy danh sách lịch sử thông báo của một người dùng.
     */
    List<Notification> getNotificationsByUserId(Long userId);

    /**
     * Gửi email thử nghiệm (phục vụ testing khi chưa có Frontend).
     */
    void sendTestEmail(String toEmail, String testType);
}

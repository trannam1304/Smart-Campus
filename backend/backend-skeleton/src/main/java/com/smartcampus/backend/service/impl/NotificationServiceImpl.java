package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.response.NotificationResponse;
import com.smartcampus.backend.service.NotificationService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Triển khai nghiệp vụ nhóm Thông báo. Liên quan: FR-6.1, FR-6.2, FR-6.3
 * Shell stub — triển khai chi tiết sau này.
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public List<NotificationResponse> getBookingConfirmations(Long userId) {
        throw new UnsupportedOperationException("FR-6.1 chưa triển khai.");
    }

    @Override
    public List<NotificationResponse> getReminders(Long userId) {
        throw new UnsupportedOperationException("FR-6.2 chưa triển khai.");
    }

    @Override
    public List<NotificationResponse> getCancellationAndMaintenanceAlerts(Long userId) {
        throw new UnsupportedOperationException("FR-6.3 chưa triển khai.");
    }
}

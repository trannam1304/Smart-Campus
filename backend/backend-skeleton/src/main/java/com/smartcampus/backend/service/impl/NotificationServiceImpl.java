package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.service.EmailService;
import com.smartcampus.backend.service.NotificationService;
import com.smartcampus.backend.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final QrCodeService qrCodeService;

    @Override
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public void sendTestEmail(String toEmail, String testType) {
        log.info("[TEST EMAIL] Bắt đầu kích hoạt gửi email kiểm thử loại '{}' tới {}", testType, toEmail);
        LocalDateTime now = LocalDateTime.now();

        if ("REMINDER".equalsIgnoreCase(testType)) {
            byte[] qrBytes = qrCodeService.generateQrImage("TEST_QR_REMINDER", 200, 200);
            emailService.sendBookingReminderEmail(toEmail, "Sinh viên Test", 9999L, "A3.01", now.plusMinutes(15), now.plusMinutes(135), qrBytes);
        } else if ("CANCEL".equalsIgnoreCase(testType) || "AUTO_CANCEL".equalsIgnoreCase(testType)) {
            emailService.sendAutoCancelEmail(toEmail, "Sinh viên Test", 9999L, "A3.01", now.minusMinutes(20), 15, 1, false);
        } else {
            // Mặc định là CONFIRMATION
            byte[] qrBytes = qrCodeService.generateQrImage("BK-20261105-9999_SEC_TEST12", 240, 240);
            emailService.sendBookingConfirmationEmail(
                    toEmail,
                    "Sinh viên Test",
                    9999L,
                    "A3.01",
                    now.plusHours(1),
                    now.plusHours(3),
                    4,
                    "Thử nghiệm gửi email xác nhận đặt phòng kèm mã QR",
                    qrBytes,
                    "BK-20261105-9999_SEC_TEST12"
            );
        }
    }
}

package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Triển khai dịch vụ gửi Email thông báo qua Spring Mail & JavaMailSender.
 * Nghiệp vụ liên quan: FR-6.1, FR-6.2, FR-6.3, NFR-01 (Bất đồng bộ @Async)
 */
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Value("${app.mail.from:smartcampus.notification@gmail.com}")
    private String mailFrom;

    @Value("${app.mail.sender-name:Smart Campus Facility Reservation}")
    private String senderName;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Override
    @Async("mailTaskExecutor")
    public void sendBookingConfirmationEmail(
            String toEmail,
            String recipientName,
            Long bookingId,
            String roomCode,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int numberOfPeople,
            String purpose,
            byte[] qrImageBytes,
            String qrCodeData) {

        String subject = String.format("[Smart Campus] Xác nhận đặt phòng %s thành công - Mã vé: #%d", roomCode, bookingId);
        String htmlContent = buildConfirmationHtml(recipientName, bookingId, roomCode, startTime, endTime, numberOfPeople, purpose, qrCodeData);

        sendMimeEmail(toEmail, subject, htmlContent, "booking-qr-" + bookingId + ".png", qrImageBytes, Notification.NotificationType.BOOKING_CONFIRM, bookingId);
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendBookingReminderEmail(
            String toEmail,
            String recipientName,
            Long bookingId,
            String roomCode,
            LocalDateTime startTime,
            LocalDateTime endTime,
            byte[] qrImageBytes) {

        String subject = String.format("[Smart Campus] Nhắc hẹn: Bạn có lịch sử dụng phòng %s lúc %s",
                roomCode, startTime.format(TIME_FORMATTER));
        String htmlContent = buildReminderHtml(recipientName, bookingId, roomCode, startTime, endTime);

        sendMimeEmail(toEmail, subject, htmlContent, "booking-qr-" + bookingId + ".png", qrImageBytes, Notification.NotificationType.REMINDER, bookingId);
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendAutoCancelEmail(
            String toEmail,
            String recipientName,
            Long bookingId,
            String roomCode,
            LocalDateTime startTime,
            int graceMinutes,
            int noShowCount,
            boolean isLocked) {

        String subject = String.format("[Smart Campus] CẢNH BÁO: Lịch đặt phòng %s đã bị tự động hủy do quá hạn", roomCode);
        String htmlContent = buildAutoCancelHtml(recipientName, bookingId, roomCode, startTime, graceMinutes, noShowCount, isLocked);

        sendMimeEmail(toEmail, subject, htmlContent, null, null, Notification.NotificationType.CANCEL_WARNING, bookingId);
    }

    private void sendMimeEmail(
            String toEmail,
            String subject,
            String htmlContent,
            String attachmentName,
            byte[] attachmentBytes,
            Notification.NotificationType notiType,
            Long bookingId) {

        if (!mailEnabled) {
            log.info("[MOCK EMAIL] Tính năng gửi mail đang tắt (app.mail.enabled=false). Giả lập gửi thành công tới {}", toEmail);
            recordNotificationHistory(toEmail, subject, htmlContent, notiType, bookingId, Notification.Status.SENT);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom, senderName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            // Đính kèm file ảnh QR nếu có
            if (attachmentBytes != null && attachmentBytes.length > 0 && attachmentName != null) {
                ByteArrayResource resource = new ByteArrayResource(attachmentBytes);
                helper.addAttachment(attachmentName, resource, "image/png");
                // Inline content cho thẻ <img src="cid:qrCodeImage">
                helper.addInline("qrCodeImage", resource, "image/png");
            }

            mailSender.send(message);
            log.info("[MAIL SUCCESS] Đã gửi thành công email '{}' tới {}", subject, toEmail);
            recordNotificationHistory(toEmail, subject, htmlContent, notiType, bookingId, Notification.Status.SENT);

        } catch (MessagingException | MailException e) {
            log.error("[MAIL ERROR] Gửi email '{}' tới {} thất bại: {}", subject, toEmail, e.getMessage(), e);
            recordNotificationHistory(toEmail, subject, htmlContent, notiType, bookingId, Notification.Status.FAILED);
        } catch (Exception e) {
            log.error("[MAIL UNEXPECTED ERROR] Lỗi không xác định khi gửi mail tới {}: {}", toEmail, e.getMessage(), e);
            recordNotificationHistory(toEmail, subject, htmlContent, notiType, bookingId, Notification.Status.FAILED);
        }
    }

    private void recordNotificationHistory(
            String email,
            String title,
            String content,
            Notification.NotificationType type,
            Long bookingId,
            Notification.Status status) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isPresent()) {
                Notification noti = new Notification();
                noti.setUser(userOpt.get());
                noti.setTitle(title);
                noti.setContent(title + " (Chi tiết xem qua hòm thư điện tử)");
                noti.setType(type);
                noti.setChannel(Notification.Channel.EMAIL);
                noti.setStatus(status);
                noti.setSentAt(LocalDateTime.now());
                notificationRepository.save(noti);
            }
        } catch (Exception e) {
            log.debug("Không thể ghi log notification vào DB: {}", e.getMessage());
        }
    }

    // ==================== TEMPLATES HTML ====================

    private String buildConfirmationHtml(
            String name, Long id, String room, LocalDateTime start, LocalDateTime end, int people, String purpose, String qrData) {
        String template = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: #0056b3; color: #fff; padding: 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; }
                .content { padding: 24px; line-height: 1.6; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .info-label { font-weight: 600; color: #64748b; }
                .info-value { font-weight: 600; color: #0f172a; }
                .qr-section { text-align: center; margin: 24px 0; }
                .qr-box { display: inline-block; padding: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
                .footer { background: #f1f5f9; padding: 16px; font-size: 12px; text-align: center; color: #64748b; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; background: #dcfce7; color: #166534; }
                .warning { color: #b91c1c; font-size: 13px; margin-top: 10px; font-weight: 500; }
            </style></head>
            <body>
            <div class="container">
                <div class="header">
                    <h1>SMART CAMPUS - THƯ VIỆN ĐẠI HỌC</h1>
                    <p style="margin: 4px 0 0; font-size: 14px;">Xác nhận đặt phòng học nhóm thành công</p>
                </div>
                <div class="content">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Yêu cầu đặt phòng học của bạn đã được hệ thống ghi nhận thành công với trạng thái <span class="badge">ĐÃ XÁC NHẬN</span>.</p>
                    <div class="card">
                        <div class="info-row"><span class="info-label">Mã đặt phòng:</span> <span class="info-value">#%d</span></div>
                        <div class="info-row"><span class="info-label">Phòng học:</span> <span class="info-value">%s</span></div>
                        <div class="info-row"><span class="info-label">Ngày sử dụng:</span> <span class="info-value">%s</span></div>
                        <div class="info-row"><span class="info-label">Khung giờ:</span> <span class="info-value">%s - %s</span></div>
                        <div class="info-row"><span class="info-label">Sĩ số đăng ký:</span> <span class="info-value">%d người</span></div>
                        <div class="info-row"><span class="info-label">Mục đích:</span> <span class="info-value">%s</span></div>
                    </div>
                    <div class="qr-section">
                        <p style="margin-bottom: 8px; font-weight: 600;">MÃ QR ĐIỂM DANH NHẬN PHÒNG</p>
                        <div class="qr-box">
                            <img src="cid:qrCodeImage" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
                        </div>
                        <p style="font-size: 12px; color: #64748b; margin-top: 6px;">Mã định danh: <code>%s</code></p>
                    </div>
                    <p class="warning">⚠️ Lưu ý quan trọng (FR-5.2 & FR-5.3): Vui lòng có mặt và quét mã QR tại thiết bị cửa phòng trong vòng <strong>15 phút</strong> (từ %s đến %s). Quá 15 phút không check-in, lượt đặt sẽ bị tự động hủy và tính 01 lần vi phạm No-Show.</p>
                </div>
                <div class="footer">
                    Email tự động từ Hệ thống Đặt phòng Smart Campus TDTU. Vui lòng không trả lời thư này.
                </div>
            </div>
            </body>
            </html>
            """;

        return template.formatted(
                escape(name),
                id,
                escape(room),
                start.format(DATE_FORMATTER),
                start.format(TIME_FORMATTER),
                end.format(TIME_FORMATTER),
                people,
                escape(purpose),
                escape(qrData),
                start.minusMinutes(15).format(TIME_FORMATTER),
                start.plusMinutes(15).format(TIME_FORMATTER)
        );
    }

    private String buildReminderHtml(
            String name, Long id, String room, LocalDateTime start, LocalDateTime end) {
        String template = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: #f59e0b; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 24px; line-height: 1.6; }
                .highlight-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin: 16px 0; border-radius: 4px; }
                .footer { background: #f1f5f9; padding: 16px; font-size: 12px; text-align: center; color: #64748b; }
            </style></head>
            <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin:0;">⏰ NHẮC LỊCH: SẮP ĐẾN GIỜ NHẬN PHÒNG</h2>
                </div>
                <div class="content">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Hệ thống Smart Campus xin nhắc bạn có lịch sử dụng phòng học sắp diễn ra trong vòng <strong>15 phút tới</strong>:</p>
                    <div class="highlight-box">
                        <p style="margin: 4px 0;"><strong>Phòng:</strong> %s</p>
                        <p style="margin: 4px 0;"><strong>Thời gian:</strong> %s - %s (Ngày %s)</p>
                        <p style="margin: 4px 0;"><strong>Hạn chót check-in:</strong> %s</p>
                    </div>
                    <p>Vui lòng chuẩn bị sẵn mã QR trên ứng dụng hoặc email xác nhận để quét mở cửa phòng đúng giờ.</p>
                    <p style="color: #b91c1c; font-size: 13px;">* Lưu ý: Nếu không check-in trước <strong>%s</strong>, hệ thống sẽ tự động hủy lượt đặt để nhường phòng cho sinh viên khác.</p>
                </div>
                <div class="footer">Smart Campus TDTU - Hệ thống Quản lý Không gian Học tập</div>
            </div>
            </body>
            </html>
            """;

        return template.formatted(
                escape(name),
                escape(room),
                start.format(TIME_FORMATTER),
                end.format(TIME_FORMATTER),
                start.format(DATE_FORMATTER),
                start.plusMinutes(15).format(TIME_FORMATTER),
                start.plusMinutes(15).format(TIME_FORMATTER)
        );
    }

    private String buildAutoCancelHtml(
            String name, Long id, String room, LocalDateTime start, int graceMinutes, int noShowCount, boolean isLocked) {
        String lockNotice = isLocked
                ? "<div style='background:#fee2e2; border:1px solid #f87171; padding:12px; border-radius:6px; color:#991b1b; margin-top:12px; font-weight:bold;'>🚫 TÀI KHOẢN CỦA BẠN ĐÃ BỊ TẠM KHÓA QUYỀN ĐẶT PHÒNG 90 NGÀY do đạt ngưỡng vi phạm " + noShowCount + " lần No-Show theo Quy chế Thư viện.</div>"
                : "<p style='color:#dc2626; font-size:13px;'>Bạn hiện đã vi phạm <strong>" + noShowCount + "</strong> lần No-Show. Theo quy chế, nếu vi phạm từ 2 lần trở lên trong năm học, tài khoản sẽ bị khóa quyền đặt phòng 90 ngày.</p>";

        String template = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: #ef4444; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 24px; line-height: 1.6; }
                .danger-card { background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0; }
                .footer { background: #f1f5f9; padding: 16px; font-size: 12px; text-align: center; color: #64748b; }
            </style></head>
            <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin:0;">THÔNG BÁO TỰ ĐỘNG HỦY LỊCH ĐẶT PHÒNG</h2>
                </div>
                <div class="content">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Lịch đặt phòng <strong>%s</strong> (Bắt đầu lúc: %s ngày %s) đã bị hệ thống <strong style="color:#ef4444;">TỰ ĐỘNG HỦY (Auto-Release)</strong> do quá hạn check-in %d phút mà không có người quét mã nhận phòng.</p>
                    <div class="danger-card">
                        <p style="margin: 4px 0;"><strong>Mã đơn bị hủy:</strong> #%d</p>
                        <p style="margin: 4px 0;"><strong>Lý do:</strong> Quá hạn check-in (No-Show)</p>
                        <p style="margin: 4px 0;"><strong>Hành động hệ thống:</strong> Phòng đã được tự động giải phóng về trạng thái TRỐNG (AVAILABLE) cho các nhóm sinh viên khác sử dụng.</p>
                    </div>
                    %s
                    <p style="margin-top: 16px;">Mọi thắc mắc xin vui lòng liên hệ trực tiếp Quầy Dịch vụ Thông tin Thư viện để được giải quyết.</p>
                </div>
                <div class="footer">Smart Campus TDTU - Hệ thống Quản lý Không gian Học tập</div>
            </div>
            </body>
            </html>
            """;

        return template.formatted(
                escape(name),
                escape(room),
                start.format(TIME_FORMATTER),
                start.format(DATE_FORMATTER),
                graceMinutes,
                id,
                lockNotice
        );
    }

    private String escape(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}

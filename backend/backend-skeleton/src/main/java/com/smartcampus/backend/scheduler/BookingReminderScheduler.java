package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.service.EmailService;
import com.smartcampus.backend.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Tác vụ chạy ngầm định kỳ quét CSDL để gửi email nhắc hẹn trước 15 phút.
 * Nghiệp vụ liên quan: FR-6.2 (Nhắc lịch), NFR-01 (Hiệu năng), NFR-03 (Chống trùng lặp gửi)
 */
@Component
@RequiredArgsConstructor
public class BookingReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingReminderScheduler.class);

    private final BookingRepository bookingRepository;
    private final EmailService emailService;
    private final QrCodeService qrCodeService;

    @Value("${app.booking.reminder-lead-minutes:15}")
    private int reminderLeadMinutes;

    /**
     * Chạy định kỳ mỗi phút một lần để quét các booking sắp diễn ra trong vòng 15 phút tới.
     * Cú pháp cron: "0 * * * * *" -> Chạy ở giây 0 của mỗi phút.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void scanAndSendBookingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusMinutes(reminderLeadMinutes);

        try {
            // NFR-01: Truy vấn có index kết hợp JOIN FETCH User và Room
            List<Booking> upcomingBookings = bookingRepository.findBookingsNeedingReminder(
                    Booking.BookingStatus.CONFIRMED,
                    now,
                    windowEnd
            );

            if (upcomingBookings.isEmpty()) {
                log.debug("[REMINDER CRON] Không có lịch đặt phòng nào cần gửi nhắc nhở tại {}", now);
                return;
            }

            log.info("[REMINDER CRON] Tìm thấy {} lịch đặt phòng sắp diễn ra cần gửi email nhắc nhở", upcomingBookings.size());
            int sentCount = 0;

            for (Booking booking : upcomingBookings) {
                try {
                    User user = booking.getUser();
                    Room room = booking.getRoom();

                    if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
                        byte[] qrBytes = null;
                        try {
                            qrBytes = qrCodeService.getBookingQrImage(booking.getId(), 200, 200);
                        } catch (Exception ex) {
                            log.warn("[REMINDER] Không thể lấy ảnh QR cho bookingId={}: {}", booking.getId(), ex.getMessage());
                        }

                        emailService.sendBookingReminderEmail(
                                user.getEmail(),
                                user.getFullName() != null ? user.getFullName() : "Sinh viên",
                                booking.getId(),
                                room != null ? room.getRoomCode() : "N/A",
                                booking.getStartTime(),
                                booking.getEndTime(),
                                qrBytes
                        );

                        // FR-6.2 / NFR-03: Đánh dấu cờ reminderSent = true để chống gửi trùng lặp
                        booking.setReminderSent(true);
                        bookingRepository.save(booking);

                        sentCount++;
                        log.info("[REMINDER] Đã kích hoạt email nhắc nhở cho bookingId={} (userId={})", booking.getId(), user.getId());
                    }
                } catch (Exception e) {
                    log.error("[REMINDER ERROR] Lỗi khi xử lý nhắc nhở cho bookingId={}: {}", booking.getId(), e.getMessage(), e);
                }
            }

            log.info("[REMINDER CRON] Hoàn thành tác vụ: Đã xử lý gửi {}/{} email nhắc nhở.", sentCount, upcomingBookings.size());

        } catch (Exception e) {
            log.error("[REMINDER CRON FATAL] Lỗi trong tác vụ quét nhắc nhở: {}", e.getMessage(), e);
        }
    }
}


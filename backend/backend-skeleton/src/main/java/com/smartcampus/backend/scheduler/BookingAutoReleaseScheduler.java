package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tác vụ chạy ngầm định kỳ quét CSDL để tự động hủy các lượt đặt phòng quá hạn check-in (Auto-Release).
 * Nghiệp vụ liên quan: FR-5.3 (Auto-release sau 15-30 phút không check-in), FR-6.3 (Email cảnh báo hủy),
 * NFR-01 (Hiệu năng), NFR-03 (Độ tin cậy)
 */
@Component
@RequiredArgsConstructor
public class BookingAutoReleaseScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingAutoReleaseScheduler.class);
    private final BookingService bookingService;

    /**
     * Quét cơ sở dữ liệu mỗi 5 phút một lần để tự động hủy đặt phòng, giải phóng phòng và gửi email cảnh báo.
     * Cú pháp Cron: "0 * / 5 * * * *" -> Chạy ở giây thứ 0 của mỗi 5 phút.
     */
    @Scheduled(cron = "0 */5 * * * *")
    public void scanAndAutoReleaseOverdueBookings() {
        log.info("[CRON] Bắt đầu tác vụ quét tự động hủy lượt đặt phòng quá hạn check-in (FR-5.3)...");
        try {
            int releasedCount = bookingService.autoReleaseOverdueBookings();
            if (releasedCount > 0) {
                log.info("[CRON] Đã tự động hủy và giải phóng phòng thành công cho {} lượt đặt phòng quá hạn.", releasedCount);
            } else {
                log.debug("[CRON] Không có lượt đặt phòng nào quá hạn check-in.");
            }
        } catch (Exception e) {
            log.error("[CRON] Lỗi trong quá trình thực thi tác vụ auto-release: {}", e.getMessage(), e);
        }
    }
}

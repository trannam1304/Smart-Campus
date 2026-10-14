package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.service.CheckinService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tác vụ chạy ngầm định kỳ quét CSDL để tự động hủy các lượt đặt phòng quá hạn check-in (Auto-Release).
 * Liên quan: FR-5.3 (Auto-release sau 15 phút không check-in)
 */
@Component
@RequiredArgsConstructor
public class BookingAutoReleaseScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingAutoReleaseScheduler.class);
    private final CheckinService checkinService;

    /**
     * Mặc định quét mỗi 5 phút một lần (hoặc cấu hình qua app.booking.auto-release-cron)
     */
    @Scheduled(cron = "${app.booking.auto-release-cron:0 */5 * * * *}")
    public void scanAndAutoReleaseOverdueBookings() {
        log.info("Bắt đầu tác vụ quét tự động hủy lượt đặt phòng quá hạn check-in (FR-5.3)...");
        try {
            int releasedCount = checkinService.autoReleaseOverdueBookings();
            if (releasedCount > 0) {
                log.info("Đã tự động hủy thành công {} lượt đặt phòng quá hạn check-in.", releasedCount);
            } else {
                log.debug("Không có lượt đặt phòng nào quá hạn check-in.");
            }
        } catch (Exception e) {
            log.error("Lỗi trong quá trình thực thi tác vụ auto-release: {}", e.getMessage(), e);
        }
    }
}

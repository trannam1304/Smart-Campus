package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.service.CheckinService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tiến trình nền tự động trả phòng và giải phóng tài nguyên (FR-5.3).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Tự động hủy và trả phòng cho các đơn CONFIRMED quá 15 phút sau giờ bắt đầu mà chưa có ai check-in.</li>
 *   <li>Tự động hoàn tất (trả phòng) cho các đơn IN_USE khi đã hết giờ kết thúc (endTime &lt; now).</li>
 *   <li>Tự động hủy các đơn PENDING_APPROVAL quá giờ bắt đầu mà chưa được duyệt.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingAutoReleaseScheduler {

    private final CheckinService checkinService;

    // Chạy định kỳ mỗi 30 giây
    @Scheduled(fixedRate = 30000)
    public void scheduleAutoRelease() {
        try {
            int count = checkinService.autoReleaseExpiredBookings();
            if (count > 0) {
                log.info("FR-5.3 Auto-Release: Đã tự động trả phòng / giải phóng {} lượt đặt phòng quá hạn.", count);
            }
        } catch (Exception ex) {
            log.error("Lỗi trong quá trình tự động trả phòng định kỳ: {}", ex.getMessage(), ex);
        }
    }
}

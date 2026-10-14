package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.CheckinQrRequest;
import com.smartcampus.backend.dto.request.CheckoutRequest;
import com.smartcampus.backend.dto.response.CheckinQrResponse;
import com.smartcampus.backend.dto.response.CheckoutResponse;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.service.CheckinService;
import com.smartcampus.backend.util.QrCodeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Time;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Service
public class CheckinServiceImpl implements CheckinService {

    private static final Logger log = LoggerFactory.getLogger(CheckinServiceImpl.class);
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter ISO_OFFSET_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final NamedParameterJdbcTemplate jdbc;

    public CheckinServiceImpl(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public CheckinQrResponse checkinByQr(CheckinQrRequest request) {
        String qrData = request.getQrData().trim();

        // 1. Tìm thông tin lượt đặt phòng theo qr_code (hoặc public booking ID)
        BookingInfo booking = findBookingByQrOrId(qrData);
        if (booking == null) {
            throw new ResourceNotFoundException("Mã QR hoặc Mã đặt phòng không hợp lệ.");
        }

        // 2. Kiểm tra trạng thái booking
        String status = booking.status();
        if ("IN_USE".equalsIgnoreCase(status)) {
            throw new ConflictException("Lịch đặt phòng này đã được check-in trước đó.");
        }
        if ("COMPLETED".equalsIgnoreCase(status) || "COMPLETED_FORCE".equalsIgnoreCase(status)) {
            throw new ConflictException("Lịch đặt phòng này đã hoàn thành phiên sử dụng.");
        }
        if ("CANCELLED_AUTO".equalsIgnoreCase(status)) {
            throw new ConflictException("Lịch đặt phòng đã bị tự động hủy do quá hạn check-in.");
        }
        if (status.toUpperCase().startsWith("CANCELLED")) {
            throw new ConflictException("Lịch đặt phòng đã bị hủy.");
        }
        if (!"CONFIRMED".equalsIgnoreCase(status)) {
            throw new ConflictException("Trạng thái đặt phòng (" + status + ") không hợp lệ để check-in.");
        }

        // 3. Phân tích thời điểm quét so với khung giờ đặt phòng
        LocalDateTime scannedDateTime = parseScannedAt(request.getScannedAt());
        LocalDateTime startDateTime = LocalDateTime.of(booking.bookingDate(), booking.startTime());

        // Kiểm tra đúng ngày
        if (!booking.bookingDate().equals(scannedDateTime.toLocalDate())) {
            throw new ConflictException(String.format("Lịch đặt phòng vào ngày %s, không thể check-in vào ngày %s.",
                    booking.bookingDate(), scannedDateTime.toLocalDate()));
        }

        // Cửa sổ cho phép điểm danh: [Start - 15m, Start + 15m]
        int earlyLimitMinutes = getSettingInt("checkin.early_minutes", 15);
        int graceMinutes = getSettingInt("checkin.grace_minutes", 15);

        LocalDateTime earlyWindowStart = startDateTime.minusMinutes(earlyLimitMinutes);
        LocalDateTime graceWindowEnd = startDateTime.plusMinutes(graceMinutes);

        if (scannedDateTime.isBefore(earlyWindowStart)) {
            throw new ConflictException(String.format("Chưa đến giờ check-in! Bạn chỉ có thể check-in từ %s (trước tối đa %d phút).",
                    formatOffsetDateTime(earlyWindowStart), earlyLimitMinutes));
        }

        if (scannedDateTime.isAfter(graceWindowEnd)) {
            throw new ConflictException(String.format("Đã quá thời gian cho phép check-in (quá %d phút). Lịch đặt phòng đã hết hạn.",
                    graceMinutes));
        }

        // 4. Cập nhật trạng thái thành IN_USE và lưu checkin_time
        jdbc.update("""
                UPDATE bookings
                SET status = 'IN_USE', checkin_time = :checkinTime
                WHERE booking_id = :bookingId
                """, new MapSqlParameterSource()
                .addValue("bookingId", booking.bookingId())
                .addValue("checkinTime", java.sql.Timestamp.valueOf(scannedDateTime)));

        String publicBookingId = QrCodeUtil.formatPublicBookingId(booking.bookingId(), booking.bookingDate());
        String checkinTimeIso = formatOffsetDateTime(scannedDateTime);

        log.info("Check-in thành công cho bookingId={} phòng={}", publicBookingId, booking.roomCode());
        return new CheckinQrResponse(publicBookingId, "IN_USE", checkinTimeIso);
    }

    @Override
    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request) {
        String bookingIdInput = request.getBookingId().trim();
        Long numericId = QrCodeUtil.parseInternalBookingId(bookingIdInput);

        BookingInfo booking = null;
        if (numericId != null) {
            booking = findBookingById(numericId);
        }
        if (booking == null) {
            booking = findBookingByQrOrId(bookingIdInput);
        }
        if (booking == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin lượt đặt phòng với mã: " + bookingIdInput);
        }

        String status = booking.status();
        if ("COMPLETED".equalsIgnoreCase(status) || "COMPLETED_FORCE".equalsIgnoreCase(status)) {
            throw new ConflictException("Lịch đặt phòng này đã kết thúc trước đó.");
        }
        if (!"IN_USE".equalsIgnoreCase(status)) {
            throw new ConflictException("Lịch đặt phòng chưa được check-in, không thể checkout.");
        }

        LocalDateTime now = LocalDateTime.now(DEFAULT_ZONE);
        jdbc.update("""
                UPDATE bookings
                SET status = 'COMPLETED', checkout_time = :checkoutTime
                WHERE booking_id = :bookingId
                """, new MapSqlParameterSource()
                .addValue("bookingId", booking.bookingId())
                .addValue("checkoutTime", java.sql.Timestamp.valueOf(now)));

        String publicBookingId = QrCodeUtil.formatPublicBookingId(booking.bookingId(), booking.bookingDate());
        String checkoutTimeIso = formatOffsetDateTime(now);

        log.info("Checkout thành công cho bookingId={} phòng={}", publicBookingId, booking.roomCode());
        return new CheckoutResponse(publicBookingId, "COMPLETED", checkoutTimeIso);
    }

    @Override
    @Transactional
    public QrCodeDetailResponse getQrDetail(String bookingIdInput) {
        Long numericId = QrCodeUtil.parseInternalBookingId(bookingIdInput);
        BookingInfo booking = numericId != null ? findBookingById(numericId) : findBookingByQrOrId(bookingIdInput);
        if (booking == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin lượt đặt phòng.");
        }

        String qrCode = booking.qrCode();
        if (qrCode == null || qrCode.isBlank()) {
            qrCode = QrCodeUtil.generateUniqueQrData(booking.bookingId(), booking.bookingDate());
            jdbc.update("UPDATE bookings SET qr_code = :qrCode WHERE booking_id = :bookingId",
                    new MapSqlParameterSource()
                            .addValue("qrCode", qrCode)
                            .addValue("bookingId", booking.bookingId()));
        }

        String base64Image = QrCodeUtil.generateQrCodeBase64(qrCode, 240, 240);
        LocalDateTime startDateTime = LocalDateTime.of(booking.bookingDate(), booking.startTime());
        int earlyLimit = getSettingInt("checkin.early_minutes", 15);
        int graceMinutes = getSettingInt("checkin.grace_minutes", 15);

        String allowEarlyFrom = formatOffsetDateTime(startDateTime.minusMinutes(earlyLimit));
        String deadlineAt = formatOffsetDateTime(startDateTime.plusMinutes(graceMinutes));

        String publicId = QrCodeUtil.formatPublicBookingId(booking.bookingId(), booking.bookingDate());
        return new QrCodeDetailResponse(
                publicId,
                booking.roomCode(),
                qrCode,
                base64Image,
                new QrCodeDetailResponse.CheckInWindow(allowEarlyFrom, deadlineAt)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getQrImage(String bookingIdInput, int width, int height) {
        Long numericId = QrCodeUtil.parseInternalBookingId(bookingIdInput);
        BookingInfo booking = numericId != null ? findBookingById(numericId) : findBookingByQrOrId(bookingIdInput);
        if (booking == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin lượt đặt phòng.");
        }

        String qrCode = booking.qrCode();
        if (qrCode == null || qrCode.isBlank()) {
            qrCode = QrCodeUtil.generateUniqueQrData(booking.bookingId(), booking.bookingDate());
        }
        return QrCodeUtil.generateQrCode(qrCode, width > 0 ? width : 240, height > 0 ? height : 240);
    }

    @Override
    @Transactional
    public int autoReleaseOverdueBookings() {
        int graceMinutes = getSettingInt("checkin.grace_minutes", 15);
        int maxNoShow = getSettingInt("discipline.max_no_show", 2);
        int lockDays = getSettingInt("discipline.lock_days", 90);

        // Quét các booking CONFIRMED quá hạn check-in
        List<Map<String, Object>> overdueList = jdbc.queryForList("""
                SELECT b.booking_id, b.room_id, b.user_id, b.booking_date, b.start_time, r.room_code
                FROM bookings b
                JOIN rooms r ON r.room_id = b.room_id
                WHERE b.status = 'CONFIRMED'
                  AND b.checkin_time IS NULL
                  AND (
                      b.booking_date < CURRENT_DATE()
                      OR (
                          b.booking_date = CURRENT_DATE()
                          AND CURRENT_TIME() > ADDTIME(b.start_time, SEC_TO_TIME(:graceSeconds))
                      )
                  )
                """, new MapSqlParameterSource().addValue("graceSeconds", graceMinutes * 60));

        if (overdueList.isEmpty()) {
            return 0;
        }

        String currentAcademicYear = computeCurrentAcademicYear();
        int cancelledCount = 0;

        for (Map<String, Object> row : overdueList) {
            long bookingId = ((Number) row.get("booking_id")).longValue();
            long roomId = ((Number) row.get("room_id")).longValue();
            long userId = ((Number) row.get("user_id")).longValue();
            String roomCode = (String) row.get("room_code");
            Date bDate = (Date) row.get("booking_date");
            Time sTime = (Time) row.get("start_time");

            // 1. Cập nhật booking thành CANCELLED_AUTO
            jdbc.update("""
                    UPDATE bookings
                    SET status = 'CANCELLED_AUTO'
                    WHERE booking_id = :bookingId AND status = 'CONFIRMED'
                    """, new MapSqlParameterSource().addValue("bookingId", bookingId));

            // 2. Nhả phòng (đảm bảo base_status là AVAILABLE)
            jdbc.update("""
                    UPDATE rooms
                    SET base_status = 'AVAILABLE'
                    WHERE room_id = :roomId
                    """, new MapSqlParameterSource().addValue("roomId", roomId));

            // 3. Ghi log kỷ luật NO_SHOW
            jdbc.update("""
                    INSERT IGNORE INTO discipline_log (user_id, booking_id, reason, academic_year, occurred_at)
                    VALUES (:userId, :bookingId, 'NO_SHOW', :academicYear, NOW())
                    """, new MapSqlParameterSource()
                    .addValue("userId", userId)
                    .addValue("bookingId", bookingId)
                    .addValue("academicYear", currentAcademicYear));

            // 4. Tăng số lần no-show của user và khóa tài khoản nếu vượt ngưỡng
            jdbc.update("""
                    UPDATE users
                    SET no_show_count = no_show_count + 1
                    WHERE user_id = :userId
                    """, new MapSqlParameterSource().addValue("userId", userId));

            // Kiểm tra tổng số lần no-show
            Integer noShowCount = jdbc.queryForObject(
                    "SELECT no_show_count FROM users WHERE user_id = :userId",
                    new MapSqlParameterSource().addValue("userId", userId),
                    Integer.class
            );

            if (noShowCount != null && noShowCount >= maxNoShow) {
                jdbc.update("""
                        UPDATE users
                        SET status = 'LOCKED',
                            locked_until = DATE_ADD(NOW(), INTERVAL :lockDays DAY)
                        WHERE user_id = :userId
                        """, new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("lockDays", lockDays));
                log.warn("Tài khoản userId={} đã bị khóa {} ngày do vi phạm no-show {} lần.", userId, lockDays, noShowCount);
            }

            // 5. Gửi thông báo cảnh báo (in-app notification)
            String content = String.format(
                    "Lịch đặt phòng %s lúc %s ngày %s đã bị tự động hủy do quá hạn check-in %d phút. Bạn bị ghi nhận 1 lần vắng mặt (No-show).",
                    roomCode, sTime != null ? sTime.toString() : "", bDate != null ? bDate.toString() : "", graceMinutes
            );
            jdbc.update("""
                    INSERT INTO notifications (user_id, booking_id, type, channel, content, status, sent_at)
                    VALUES (:userId, :bookingId, 'CANCEL_WARNING', 'IN_APP', :content, 'SENT', NOW())
                    """, new MapSqlParameterSource()
                    .addValue("userId", userId)
                    .addValue("bookingId", bookingId)
                    .addValue("content", content));

            cancelledCount++;
            log.info("Auto-release thành công bookingId={} của userId={}", bookingId, userId);
        }

        return cancelledCount;
    }

    private BookingInfo findBookingByQrOrId(String identifier) {
        try {
            return jdbc.queryForObject("""
                    SELECT b.booking_id, b.room_id, b.user_id, b.booking_date, b.start_time, b.end_time,
                           b.status, b.qr_code, r.room_code
                    FROM bookings b
                    JOIN rooms r ON r.room_id = b.room_id
                    WHERE b.qr_code = :identifier
                    """, new MapSqlParameterSource().addValue("identifier", identifier),
                    (rs, rowNum) -> new BookingInfo(
                            rs.getLong("booking_id"),
                            rs.getLong("room_id"),
                            rs.getLong("user_id"),
                            rs.getDate("booking_date").toLocalDate(),
                            rs.getTime("start_time").toLocalTime(),
                            rs.getTime("end_time").toLocalTime(),
                            rs.getString("status"),
                            rs.getString("qr_code"),
                            rs.getString("room_code")
                    ));
        } catch (EmptyResultDataAccessException e) {
            // Thử parse ID nội bộ
            Long numericId = QrCodeUtil.parseInternalBookingId(identifier);
            if (numericId != null) {
                return findBookingById(numericId);
            }
            return null;
        }
    }

    private BookingInfo findBookingById(long bookingId) {
        try {
            return jdbc.queryForObject("""
                    SELECT b.booking_id, b.room_id, b.user_id, b.booking_date, b.start_time, b.end_time,
                           b.status, b.qr_code, r.room_code
                    FROM bookings b
                    JOIN rooms r ON r.room_id = b.room_id
                    WHERE b.booking_id = :bookingId
                    """, new MapSqlParameterSource().addValue("bookingId", bookingId),
                    (rs, rowNum) -> new BookingInfo(
                            rs.getLong("booking_id"),
                            rs.getLong("room_id"),
                            rs.getLong("user_id"),
                            rs.getDate("booking_date").toLocalDate(),
                            rs.getTime("start_time").toLocalTime(),
                            rs.getTime("end_time").toLocalTime(),
                            rs.getString("status"),
                            rs.getString("qr_code"),
                            rs.getString("room_code")
                    ));
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private int getSettingInt(String key, int defaultValue) {
        try {
            String val = jdbc.queryForObject(
                    "SELECT setting_value FROM system_settings WHERE setting_key = :key",
                    new MapSqlParameterSource().addValue("key", key),
                    String.class
            );
            return val != null ? Integer.parseInt(val.trim()) : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private LocalDateTime parseScannedAt(String scannedAt) {
        if (scannedAt == null || scannedAt.isBlank()) {
            return LocalDateTime.now(DEFAULT_ZONE);
        }
        try {
            return OffsetDateTime.parse(scannedAt.trim()).atZoneSameInstant(DEFAULT_ZONE).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(scannedAt.trim());
            } catch (DateTimeParseException ex) {
                log.warn("Không thể parse scannedAt='{}', sử dụng giờ hiện tại.", scannedAt);
                return LocalDateTime.now(DEFAULT_ZONE);
            }
        }
    }

    private String formatOffsetDateTime(LocalDateTime ldt) {
        ZonedDateTime zdt = ldt.atZone(DEFAULT_ZONE);
        return zdt.format(ISO_OFFSET_FORMATTER);
    }

    private String computeCurrentAcademicYear() {
        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        int year = today.getYear();
        int month = today.getMonthValue();
        if (month >= 9) {
            return String.format("%d-%d", year, year + 1);
        } else {
            return String.format("%d-%d", year - 1, year);
        }
    }

    private record BookingInfo(
            long bookingId,
            long roomId,
            long userId,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            String status,
            String qrCode,
            String roomCode
    ) {
    }
}

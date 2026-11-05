package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.RoomRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.EmailService;
import com.smartcampus.backend.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Triển khai nghiệp vụ nhóm Booking.
 * Liên quan: FR-3.1 (Đặt phòng), FR-3.2 (Chống trùng lịch), FR-5.1 (Sinh mã QR),
 * FR-5.3 (Auto-release quá hạn), FR-6.1 (Email xác nhận), FR-6.3 (Email cảnh báo hủy)
 */
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final QrCodeService qrCodeService;
    private final EmailService emailService;

    @Value("${app.booking.auto-release-minutes:15}")
    private int graceMinutes;

    @Value("${app.booking.max-no-show:2}")
    private int maxNoShow;

    @Value("${app.booking.lock-days:90}")
    private int lockDays;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Long userId) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng với ID: " + request.getRoomId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        // FR-3.2: Kiểm tra chống trùng lịch đặt phòng
        List<Booking> conflicts = bookingRepository.findByRoomIdAndStartTimeBetween(
                request.getRoomId(), request.getStartTime(), request.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new ConflictException("Phòng đã có người đặt trong khung giờ này.");
        }

        Booking booking = new Booking();
        booking.setRoom(room);
        booking.setUser(user);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setNumberOfPeople(request.getNumberOfPeople());
        booking.setPurpose(request.getPurpose());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setReminderSent(false);

        // Lưu trước để lấy ID
        booking = bookingRepository.save(booking);

        // FR-5.1: Sinh mã QR định danh bảo mật cho lượt đặt phòng
        String qrToken = qrCodeService.generateSecureBookingToken(booking.getId());
        booking.setQrCode(qrToken);
        booking = bookingRepository.save(booking);

        // Cập nhật trạng thái phòng
        room.setStatus(Room.RoomStatus.BOOKED);
        roomRepository.save(room);

        // FR-6.1: Gửi Email xác nhận đặt phòng thành công kèm mã QR đính kèm (Async)
        try {
            byte[] qrBytes = qrCodeService.generateQrImage(qrToken, 240, 240);
            emailService.sendBookingConfirmationEmail(
                    user.getEmail(),
                    user.getFullName() != null ? user.getFullName() : "Sinh viên",
                    booking.getId(),
                    room.getRoomCode(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getNumberOfPeople() != null ? booking.getNumberOfPeople() : 1,
                    booking.getPurpose() != null ? booking.getPurpose() : "Tự học",
                    qrBytes,
                    qrToken
            );
        } catch (Exception e) {
            log.error("[BOOKING MAIL FAIL] Không thể kích hoạt gửi email xác nhận: {}", e.getMessage(), e);
        }

        // Tạo thông báo in-app
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setBooking(booking);
        notification.setTitle("Đặt phòng thành công");
        notification.setContent(String.format("Lịch đặt phòng %s từ %s đến %s đã được xác nhận. Vui lòng check-in bằng mã QR đúng giờ.",
                room.getRoomCode(), booking.getStartTime(), booking.getEndTime()));
        notification.setType(Notification.NotificationType.BOOKING_CONFIRM);
        notification.setChannel(Notification.Channel.IN_APP);
        notificationRepository.save(notification);

        log.info("Tạo booking thành công: id={}, room={}, qrCode={}", booking.getId(), room.getRoomCode(), qrToken);

        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setRoomCode(room.getRoomCode());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setStatus(booking.getStatus().name());
        response.setQrCodeUrl("/api/bookings/" + booking.getId() + "/qr-code");

        return response;
    }

    @Override
    @Transactional
    public int autoReleaseOverdueBookings() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoffTime = now.minusMinutes(graceMinutes);

        List<Booking.BookingStatus> pendingStatuses = List.of(
                Booking.BookingStatus.CONFIRMED,
                Booking.BookingStatus.PENDING_APPROVAL,
                Booking.BookingStatus.PENDING
        );

        // NFR-01: Truy vấn index kết hợp JOIN FETCH Room và User tránh N+1 và tránh lock toàn bảng
        List<Booking> overdueBookings = bookingRepository.findOverdueBookings(pendingStatuses, cutoffTime);

        if (overdueBookings.isEmpty()) {
            log.debug("[AUTO-RELEASE] Không có lượt đặt phòng nào quá hạn check-in tại {}", now);
            return 0;
        }

        log.info("[AUTO-RELEASE] Tìm thấy {} lượt đặt phòng quá hạn check-in cần giải phóng", overdueBookings.size());
        int releasedCount = 0;

        for (Booking booking : overdueBookings) {
            try {
                // 1. Cập nhật trạng thái booking thành CANCELLED_AUTO (FR-5.3)
                booking.setStatus(Booking.BookingStatus.CANCELLED_AUTO);
                bookingRepository.save(booking);

                // 2. Giải phóng phòng về AVAILABLE nếu không còn booking nào khác đang active
                Room room = booking.getRoom();
                if (room != null) {
                    boolean hasOtherActive = bookingRepository.hasActiveBookingsForRoom(room.getId(), booking.getId(), now);
                    if (!hasOtherActive) {
                        room.setStatus(Room.RoomStatus.AVAILABLE);
                        roomRepository.save(room);
                        log.info("[AUTO-RELEASE] Đã giải phóng phòng [{}] về trạng thái AVAILABLE", room.getRoomCode());
                    }
                }

                // 3. Xử lý kỷ luật người dùng (No-Show)
                User user = booking.getUser();
                if (user != null) {
                    int currentNoShow = user.getNoShowCount() != null ? user.getNoShowCount() + 1 : 1;
                    user.setNoShowCount(currentNoShow);
                    boolean isLocked = false;
                    if (currentNoShow >= maxNoShow) {
                        user.setStatus(User.AccountStatus.LOCKED);
                        user.setLockedUntil(now.plusDays(lockDays));
                        isLocked = true;
                        log.warn("[AUTO-RELEASE] Tài khoản user [{}] bị khóa {} ngày do vi phạm {} lần No-Show",
                                user.getEmail(), lockDays, currentNoShow);
                    }
                    userRepository.save(user);

                    // 4. FR-6.3: Kích hoạt gửi email thông báo/cảnh báo lịch đã bị tự động hủy (@Async)
                    try {
                        emailService.sendAutoCancelEmail(
                                user.getEmail(),
                                user.getFullName() != null ? user.getFullName() : "Sinh viên",
                                booking.getId(),
                                room != null ? room.getRoomCode() : "N/A",
                                booking.getStartTime(),
                                graceMinutes,
                                currentNoShow,
                                isLocked
                        );
                    } catch (Exception ex) {
                        log.error("[AUTO-CANCEL MAIL FAIL] Lỗi khi gửi email hủy cho user {}: {}", user.getEmail(), ex.getMessage());
                    }

                    // Gửi thông báo in-app
                    Notification warningNoti = new Notification();
                    warningNoti.setUser(user);
                    warningNoti.setBooking(booking);
                    warningNoti.setTitle("Cảnh báo hủy lịch đặt phòng quá hạn");
                    warningNoti.setContent(String.format(
                            "Lịch đặt phòng %s lúc %s ngày %s đã bị tự động hủy do quá hạn check-in %d phút. Bạn bị ghi nhận 1 lần No-Show.",
                            room != null ? room.getRoomCode() : "N/A",
                            booking.getStartTime() != null ? booking.getStartTime().toLocalTime() : "",
                            booking.getStartTime() != null ? booking.getStartTime().toLocalDate() : "",
                            graceMinutes
                    ));
                    warningNoti.setType(Notification.NotificationType.CANCEL_WARNING);
                    warningNoti.setChannel(Notification.Channel.IN_APP);
                    notificationRepository.save(warningNoti);
                }

                releasedCount++;
                log.info("[AUTO-RELEASE] Tự động hủy thành công bookingId={} của userId={}",
                        booking.getId(), user != null ? user.getId() : "null");
            } catch (Exception e) {
                log.error("[AUTO-RELEASE] Lỗi khi xử lý hủy bookingId={}: {}", booking.getId(), e.getMessage(), e);
            }
        }

        return releasedCount;
    }
}

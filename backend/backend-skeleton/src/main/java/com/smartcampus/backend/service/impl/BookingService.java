package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.entity.enums.BookingStatus;
import com.smartcampus.backend.entity.enums.RoomStatus;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.RoomRepository;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;


@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    private static final List<BookingStatus> ACTIVE_STATUSES = List.of(
            BookingStatus.CONFIRMED, BookingStatus.IN_USE
    );

    @Retryable(
            retryFor = { OptimisticLockingFailureException.class },
            maxAttempts = 3,
            backoff = @Backoff(delay = 100)
    )
    @Transactional
    public BookingResponse createBooking(String userEmail, BookingRequest request) {

        // 1. Kiểm tra tài khoản người dùng
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản."));

        // 2. Kiểm tra thông tin phòng
        Room room = roomRepository.findById(BookingRequest.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Phòng tự học không tồn tại."));

        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new IllegalStateException("Phòng đang trong thời gian bảo trì, không thể đặt.");
        }

        // 3. Kiểm tra sĩ số tối thiểu (>= 50% sức chứa)
        int minOccupancy = (int) Math.ceil(room.getCapacity() * 0.5);
        if (request.getNumberOfPeople() < minOccupancy) {
            throw new IllegalArgumentException(
                    String.format("Số người đăng ký (%d) không đạt tối thiểu 50%% sức chứa phòng (%d người).",
                            request.getNumberOfPeople(), minOccupancy)
            );
        }

        // 4. Kiểm tra thời lượng lượt đặt (Cho phép 90 phút hoặc 120 phút)
        long durationMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        if (durationMinutes != 90 && durationMinutes != 120) {
            throw new IllegalArgumentException("Thời lượng đặt phòng phải đúng 90 phút hoặc 120 phút.");
        }

        // 5. Kiểm tra hạn mức giờ theo tuần (Tối đa 10 giờ/tuần)
        LocalDateTime startOfWeek = request.getStartTime().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toLocalDate().atStartOfDay();
        LocalDateTime endOfWeek = request.getStartTime().with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).toLocalDate().atTime(23, 59, 59);

        double currentWeeklyHours = bookingRepository.calculateWeeklyHours(user.getId(), startOfWeek, endOfWeek, ACTIVE_STATUSES);
        double requestedHours = durationMinutes / 60.0;
        if (currentWeeklyHours + requestedHours > 10.0) {
            throw new IllegalStateException(
                    String.format("Bạn đã vượt quá hạn mức 10 giờ/tuần (Đã đặt: %.1fh, Đăng ký thêm: %.1fh).",
                            currentWeeklyHours, requestedHours)
            );
        }

        // 6. THUẬT TOÁN CONFLICT CHECKING (Kiểm tra xung đột trùng lịch phòng & cá nhân)
        boolean isRoomBusy = bookingRepository.existsOverlappingBooking(
                room.getId(), request.getStartTime(), request.getEndTime(), ACTIVE_STATUSES
        );
        if (isRoomBusy) {
            throw new IllegalStateException("Phòng đã có người khác đặt trong khung giờ này.");
        }

        boolean isUserBusy = bookingRepository.existsOverlappingUserBooking(
                user.getId(), request.getStartTime(), request.getEndTime(), ACTIVE_STATUSES
        );
        if (isUserBusy) {
            throw new IllegalStateException("Bạn đã có một lịch đặt phòng khác bị trùng khung giờ này.");
        }

        // 7. Kích hoạt Optimistic Locking trên thực thể Room để chống tranh chấp đồng thời
        roomRepository.save(room);

        // 8. Tạo và lưu Booking
        String qrCode = "QR_BK_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setNumberOfPeople(request.getNumberOfPeople());
        booking.setPurpose(request.getPurpose());
        booking.setQrCode(qrCode);
        booking.setStatus(BookingStatus.CONFIRMED);

        bookingRepository.save(booking);

        // 9. Trả về kết quả
        return BookingResponse.builder()
                .bookingId(booking.getId())
                .roomCode(room.getRoomCode())
                .building(room.getBuilding())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .numberOfPeople(booking.getNumberOfPeople())
                .qrCode(booking.getQrCode())
                .status(booking.getStatus().name())
                .checkInWindowStart(booking.getStartTime().minusMinutes(15).toString())
                .checkInWindowEnd(booking.getStartTime().plusMinutes(15).toString())
                .build();
    }
}
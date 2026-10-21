package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Booking.BookingStatus;
import com.smartcampus.backend.entity.BookingMember;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingMemberRepository;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.RoomRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Triển khai nghiệp vụ Booking. Liên quan: FR-3.1, FR-3.2, FR-3.3.
 *
 * <p>Thuật toán kiểm tra trùng lịch (FR-3.2):
 * Hai khoảng thời gian [startA, endA) và [startB, endB) xâm nhau nếu và chỉ nếu:
 * {@code startA < endB && startB < endA}
 *
 * <p>Optimistic Locking (@Version):
 * Entity Booking có trường {@code @Version}. Khi cập nhật một booking đã tồn tại
 * (ví dụ check-in/check-out, hủy), JPA sinh câu SQL UPDATE với điều kiện
 * {@code version = ?}. Nếu giao dịch khác đã đổi version → 0 dòng bị ảnh hưởng
 * → ném {@link OptimisticLockingFailureException} → bắt lại và trả về 409 Conflict.
 *
 * <p>Để tránh hai request cùng INSERT phòng trống (race condition trên insert mới),
 * dùng khóa pessimistic_WRITE trên hàng phòng qua {@link RoomRepository#findByIdForUpdate}.
 * Điều này serialize toàn bộ chuỗi kiểm tra-trùng-lịch → lưu cho mỗi phòng.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final ZoneId TZ = ZoneId.of("Asia/Ho_Chi_Minh");

    // Tham số nghiệp vụ (P-*) — mặc định theo kết quả chốt trong khảo sát TDTU
    private static final int WEEKLY_QUOTA_HOURS = 10;                  // P-QUOTA-WEEK
    private static final int SLOT_MINUTES = 30;                        // P-SLOT
    private static final int MIN_DURATION_MINUTES = 90;                // P-MIN-DUR
    private static final int MAX_DURATION_STANDARD_MINUTES = 120;      // P-MAX-DUR-STD

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final BookingMemberRepository bookingMemberRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    // ------------------------------------------------------------------
    // FR-3.1: Tạo lượt đặt phòng (fail-fast chain)
    // ------------------------------------------------------------------
    @Override
    public BookingResponse createBooking(BookingRequest request, String ownerEmail) {

        // Bước 1: Tìm người dùng chủ phòng
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản: " + ownerEmail));

        if (owner.getStatus() == User.AccountStatus.LOCKED) {
            throw new ConflictException("Tài khoản của bạn đang bị khóa. Vui lòng liên hệ Ban quản lý.");
        }
        if (owner.getStatus() == User.AccountStatus.PENDING) {
            throw new ConflictException("Tài khoản chưa kích hoạt email. Vui lòng xác thực email trước khi đặt phòng.");
        }

        // Bước 2: Khóa phòng (pessimistic WRITE) để serialize kiểm tra trùng lịch
        Room room = roomRepository.findByIdForUpdate(request.getRoomId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy phòng có mã: " + request.getRoomId()));

        if (room.getStatus() != Room.RoomStatus.AVAILABLE) {
            throw new ConflictException("Phòng " + room.getRoomCode() + " không khả dụng (trạng thái: " + room.getStatus() + ").");
        }

        // Bước 3: Validate khung giờ
        validateTimeSlot(request.getStartTime(), request.getEndTime(), room);

        // Bước 4: Validate sỉ số (P-OCC-MIN / P-OCC-MAX)
        validateOccupancy(request.getNumberOfPeople(), room);

        // Bước 5: Validate danh sách thành viên (P-MEMBERS)
        List<User> members = validateMembers(request.getMemberCodes(), request.getNumberOfPeople(), room);

        // Bước 6: Kiểm tra hạn mức tuần của chủ phòng (FR-3.3)
        checkWeeklyQuota(owner, request.getStartTime(), request.getEndTime());

        // Bước 7: Kiểm tra xung đột lịch cá nhân của chủ phòng (P-CONCURRENT)
        checkPersonalConflict(owner.getId(), request.getStartTime(), request.getEndTime());

        // Bước 8: Kiểm tra xung đột lịch của từng thành viên (P-CONCURRENT)
        for (User member : members) {
            if (!member.getId().equals(owner.getId())) {
                checkPersonalConflict(member.getId(), request.getStartTime(), request.getEndTime());
            }
        }

        // Bước 9: Kiểm tra xung đột phòng (FR-3.2)
        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.CONFIRMED,
                BookingStatus.IN_USE,
                BookingStatus.PENDING_APPROVAL
        );
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                room.getId(), request.getStartTime(), request.getEndTime(), activeStatuses);
        if (!conflicts.isEmpty()) {
            throw new ConflictException(
                    "Phòng " + room.getRoomCode() + " đã có người đặt trong khung giờ này. Vui lòng chọn thời gian khác.");
        }

        // Bước 10: Tạo booking (trạng thái CONFIRMED, sinh mã QR)
        Booking booking = new Booking();
        booking.setUser(owner);
        booking.setRoom(room);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setNumberOfPeople(request.getNumberOfPeople());
        booking.setPurpose(request.getPurpose());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setQrCode("QR-" + UUID.randomUUID().toString().substring(0, 12));

        // Thêm thành viên (bao gồm cả chủ phòng)
        for (User member : members) {
            booking.addMember(member);
        }

        try {
            booking = bookingRepository.save(booking);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException(
                    "Phòng " + room.getRoomCode() + " vừa được người khác đặt. Vui lòng chọn khung giờ khác.");
        }

        // Gửi email xác nhận (dev: chỉ ghi log)
        emailService.sendBookingConfirmation(owner.getEmail(), booking.getQrCode(), null);

        return toResponse(booking);
    }

    // ------------------------------------------------------------------
    // Helper: validate khung giờ (P-SLOT, P-MIN-DUR, P-MAX-DUR-STD, giờ mở cửa)
    // ------------------------------------------------------------------
    private void validateTimeSlot(LocalDateTime start, LocalDateTime end, Room room) {
        if (start == null || end == null) {
            throw new ConflictException("Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc.");
        }
        if (!start.isBefore(end)) {
            throw new ConflictException("Giờ kết thúc phải sau giờ bắt đầu.");
        }

        // Bước khung giờ 30 phút
        if (start.getMinute() % SLOT_MINUTES != 0 || end.getMinute() % SLOT_MINUTES != 0) {
            throw new ConflictException("Vui lòng chọn giờ bắt đầu/kết thúc theo bước 30 phút.");
        }

        long durationMinutes = java.time.Duration.between(start, end).toMinutes();

        // Tối thiểu 90 phút
        if (durationMinutes < MIN_DURATION_MINUTES) {
            throw new ConflictException("Thời gian đặt phòng tối thiểu là 1 giờ 30 phút.");
        }

        // Tối đa 120 phút với phòng chuẩn
        if (durationMinutes > MAX_DURATION_STANDARD_MINUTES) {
            throw new ConflictException("Thời gian đặt phòng tối đa là 2 giờ mỗi lượt.");
        }

        // Giờ mở cửa của tầng (P-OPEN-F12 / P-OPEN-F345)
        Integer floor = room.getFloor();
        LocalTime openTime, closeTime;
        if (floor != null && floor <= 2) {
            openTime = LocalTime.of(7, 30);
            closeTime = LocalTime.of(20, 0);
        } else if (floor != null && floor >= 3) {
            openTime = LocalTime.of(7, 30);
            closeTime = LocalTime.of(17, 0);
        } else {
            openTime = LocalTime.of(7, 30);
            closeTime = LocalTime.of(20, 0);
        }

        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();

        if (startTime.isBefore(openTime) || endTime.isAfter(closeTime)) {
            throw new ConflictException(
                    "Khung giờ nằm ngoài giờ phục vụ của tầng (" + openTime + " – " + closeTime + ").");
        }
    }

    // ------------------------------------------------------------------
    // Helper: validate sỉ số (ceil(0.5 * capacity) ≤ n ≤ capacity)
    // ------------------------------------------------------------------
    private void validateOccupancy(Integer numberOfPeople, Room room) {
        Integer capacity = room.getCapacity();
        if (capacity == null || capacity <= 0) {
            throw new ConflictException("Phòng này chưa có thông tin sức chứa.");
        }
        int minOccupancy = (int) Math.ceil(0.5 * capacity);
        if (numberOfPeople < minOccupancy) {
            throw new ConflictException(
                    "Số người tối thiểu để đặt phòng này là " + minOccupancy + " (50% sức chứa " + capacity + ").");
        }
        if (numberOfPeople > capacity) {
            throw new ConflictException(
                    "Số người không được vượt quá sức chứa phòng (" + capacity + ").");
        }
    }

    // ------------------------------------------------------------------
    // Helper: validate danh sách thành viên (P-MEMBERS)
    // ------------------------------------------------------------------
    private List<User> validateMembers(List<String> memberCodes, Integer numberOfPeople, Room room) {
        if (memberCodes == null || memberCodes.isEmpty()) {
            throw new ConflictException("Vui lòng nhập danh sách mã số sinh viên thành viên.");
        }

        // Nếu phòng sức chứa >= 2, số MSSV phải bằng số người khai báo
        if (room.getCapacity() != null && room.getCapacity() >= 2) {
            if (memberCodes.size() != numberOfPeople) {
                throw new ConflictException(
                        "Số mã số sinh viên (" + memberCodes.size() + ") phải bằng số người khai báo (" + numberOfPeople + ").");
            }
        }

        List<User> members = memberCodes.stream()
                .map(code -> userRepository.findByStudentCode(code.trim())
                        .orElseThrow(() ->
                                new ConflictException("MSSV không tồn tại: " + code)))
                .collect(Collectors.toList());

        // Mỗi thành viên phải ACTIVE và không bị khóa
        for (User member : members) {
            if (member.getStatus() == User.AccountStatus.LOCKED) {
                throw new ConflictException("Thành viên " + member.getStudentCode() + " đang bị khóa quyền đặt phòng.");
            }
            if (member.getStatus() == User.AccountStatus.PENDING) {
                throw new ConflictException("Thành viên " + member.getStudentCode() + " chưa kích hoạt email.");
            }
        }

        return members;
    }

    // ------------------------------------------------------------------
    // Helper: kiểm tra hạn mức tuần (FR-3.3, P-QUOTA-WEEK)
    // ------------------------------------------------------------------
    private void checkWeeklyQuota(User owner, LocalDateTime start, LocalDateTime end) {
        LocalDateTime[] weekRange = getWeekRange(start);
        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.CONFIRMED,
                BookingStatus.IN_USE,
                BookingStatus.COMPLETED
        );
        List<Booking> weekBookings = bookingRepository.findActiveBookingsInWeek(
                owner.getId(), weekRange[0], weekRange[1], activeStatuses);

        long usedMinutes = weekBookings.stream()
                .mapToLong(b -> java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes())
                .sum();

        long newDurationMinutes = java.time.Duration.between(start, end).toMinutes();
        long totalMinutes = usedMinutes + newDurationMinutes;
        long totalHours = totalMinutes / 60;

        if (totalHours > WEEKLY_QUOTA_HOURS) {
            long usedHours = usedMinutes / 60;
            long remainingHours = WEEKLY_QUOTA_HOURS - usedHours;
            throw new ConflictException(
                    "Bạn đã dùng hết hạn mức đặt phòng trong tuần này (tối đa 10 giờ/tuần). " +
                            "Đã dùng: " + usedHours + " giờ, còn lại: " + Math.max(0, remainingHours) + " giờ.");
        }
    }

    // ------------------------------------------------------------------
    // Helper: kiểm tra xung đột lịch cá nhân (P-CONCURRENT)
    // ------------------------------------------------------------------
    private void checkPersonalConflict(Long userId, LocalDateTime start, LocalDateTime end) {
        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.CONFIRMED,
                BookingStatus.IN_USE,
                BookingStatus.PENDING_APPROVAL
        );
        List<Booking> conflicts = bookingRepository.findConflictingBookingsByUser(
                userId, start, end, activeStatuses);
        if (!conflicts.isEmpty()) {
            throw new ConflictException(
                    "Bạn hoặc thành viên trong nhóm đã có lịch phòng khác trùng khung giờ này.");
        }
    }

    // ------------------------------------------------------------------
    // Helper: tính khoảng tuần (Thứ Hai 00:00 → Chủ Nhật 23:59:59 Asia/Ho_Chi_Minh)
    // ------------------------------------------------------------------
    private LocalDateTime[] getWeekRange(LocalDateTime anchor) {
        ZonedDateTime zdt = ZonedDateTime.of(anchor, TZ);
        LocalDateTime weekStart = zdt.toLocalDate()
                .with(DayOfWeek.MONDAY)
                .atStartOfDay();
        LocalDateTime weekEnd = zdt.toLocalDate()
                .with(DayOfWeek.SUNDAY)
                .atTime(23, 59, 59);
        return new LocalDateTime[]{weekStart, weekEnd};
    }

    // ------------------------------------------------------------------
    // Helper: chuyển Entity sang Response
    // ------------------------------------------------------------------
    private BookingResponse toResponse(Booking booking) {
        BookingResponse res = new BookingResponse();
        res.setId(booking.getId());
        res.setRoomCode(booking.getRoom() != null ? booking.getRoom().getRoomCode() : null);
        res.setStartTime(booking.getStartTime());
        res.setEndTime(booking.getEndTime());
        res.setStatus(booking.getStatus().name());
        res.setQrCodeUrl(booking.getQrCode());
        return res;
    }
}

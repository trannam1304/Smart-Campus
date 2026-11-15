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
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    private final PasswordEncoder passwordEncoder;
    private final NamedParameterJdbcTemplate jdbc;

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

        // Bước 10: Phân loại phòng:
        // - Chỉ phòng hội nghị (CONFERENCE) mới cần Ban quản lý/Admin duyệt (PENDING_APPROVAL, chưa cấp QR).
        // - Các phòng khác (học nhóm, phòng tự học, xem phim...): nếu trống sẽ cho đặt ngay (CONFIRMED) và cấp mã QR tự động.
        boolean isConference = isConferenceRoom(room.getId(), room.getRoomCode());

        Booking booking = new Booking();
        booking.setUser(owner);
        booking.setRoom(room);
        booking.setBookingDate(request.getStartTime().toLocalDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setNumberOfPeople(request.getNumberOfPeople());
        String purpose = request.getPurpose();
        if (purpose == null || purpose.isBlank()) {
            purpose = isConference ? "Hội thảo chuyên đề" : "Học nhóm";
        }
        booking.setPurpose(purpose);

        if (isConference) {
            booking.setStatus(BookingStatus.PENDING_APPROVAL);
            booking.setQrCode(null);
        } else {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setQrCode("QR-" + UUID.randomUUID().toString().substring(0, 12));
        }

        // Thêm thành viên (bao gồm cả chủ phòng, tránh trùng lặp)
        Set<Long> addedUserIds = new HashSet<>();
        if (owner != null && addedUserIds.add(owner.getId())) {
            booking.addMember(owner);
        }
        for (User member : members) {
            if (addedUserIds.add(member.getId())) {
                booking.addMember(member);
            }
        }

        try {
            booking = bookingRepository.save(booking);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException(
                    "Phòng " + room.getRoomCode() + " vừa được người khác đặt. Vui lòng chọn khung giờ khác.");
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED && owner != null && owner.getEmail() != null) {
            emailService.sendBookingConfirmation(owner.getEmail(), booking.getQrCode(), null);
        }

        return toResponse(booking);
    }

    private boolean isConferenceRoom(Long roomId, String roomCode) {
        if (roomCode != null && (roomCode.equalsIgnoreCase("L.106") || roomCode.equalsIgnoreCase("L.506") || roomCode.equalsIgnoreCase("H5.01"))) {
            return true;
        }
        if (roomId == null) return false;
        try {
            List<String> types = jdbc.query(
                    "SELECT rt.type_code FROM rooms r JOIN room_types rt ON rt.room_type_id = r.room_type_id WHERE r.room_id = :id",
                    java.util.Map.of("id", roomId),
                    (rs, rowNum) -> rs.getString("type_code")
            );
            if (!types.isEmpty()) {
                String code = types.get(0);
                return "CONFERENCE".equalsIgnoreCase(code) || (code != null && code.toUpperCase().contains("CONFERENCE"));
            }
        } catch (Exception ex) {
            // fallback kiểm tra theo tên phòng
        }
        return false;
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

        // Không cho phép đặt phòng trong quá khứ (đệm 1 phút cho độ trễ truyền dữ liệu mạng)
        if (start.isBefore(LocalDateTime.now(TZ).minusMinutes(1))) {
            throw new ConflictException("Không thể đặt phòng trong quá khứ. Giờ bắt đầu phải sau thời điểm hiện tại.");
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
                .map(code -> {
                    String trimmedCode = code.trim();
                    return userRepository.findByStudentCode(trimmedCode)
                            .orElseGet(() -> {
                                User stub = new User();
                                stub.setStudentCode(trimmedCode);
                                stub.setEmail(trimmedCode + "@student.edu.vn");
                                stub.setFullName("Sinh viên " + trimmedCode);
                                stub.setPassword(passwordEncoder.encode("Student@" + trimmedCode));
                                stub.setRole(User.Role.STUDENT);
                                stub.setStatus(User.AccountStatus.ACTIVE);
                                stub.setFaculty("Chung");
                                return userRepository.save(stub);
                            });
                })
                .collect(Collectors.toList());

        // Mỗi thành viên phải ACTIVE và không bị khóa
        for (User member : members) {
            if (member.getStatus() == User.AccountStatus.LOCKED) {
                throw new ConflictException("Thành viên " + member.getStudentCode() + " đang bị khóa quyền đặt phòng.");
            }
            if (member.getStatus() == User.AccountStatus.PENDING) {
                member.setStatus(User.AccountStatus.ACTIVE);
                userRepository.save(member);
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

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + userEmail));
        List<Booking> bookings = bookingRepository.findAllUserBookings(user.getId());
        return bookings.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAllByOrderByStartTimeDesc();
        return bookings.stream().map(this::toResponse).toList();
    }

    @Override
    public BookingResponse approveBooking(Long bookingId, String adminEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng: " + bookingId));

        booking.setStatus(BookingStatus.CONFIRMED);
        if (booking.getQrCode() == null || booking.getQrCode().isEmpty()) {
            booking.setQrCode("QR-" + UUID.randomUUID().toString().substring(0, 12));
        }

        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);
        if (adminOpt.isPresent()) {
            booking.setApprovedBy(adminOpt.get());
            booking.setApprovedAt(LocalDateTime.now());
        }

        Booking saved = bookingRepository.save(booking);
        if (saved.getUser() != null && saved.getUser().getEmail() != null) {
            emailService.sendBookingConfirmation(saved.getUser().getEmail(), saved.getQrCode(), null);
        }
        return toResponse(saved);
    }

    @Override
    public BookingResponse rejectBooking(Long bookingId, String reason, String adminEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng: " + bookingId));

        booking.setStatus(BookingStatus.CANCELLED_ADMIN);

        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);
        if (adminOpt.isPresent()) {
            booking.setApprovedBy(adminOpt.get());
            booking.setApprovedAt(LocalDateTime.now());
        }

        Booking saved = bookingRepository.save(booking);
        BookingResponse res = toResponse(saved);
        res.setCancelReason(reason);
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getRoomBookings(Long roomId, String date, String startDate, String endDate) {
        LocalDateTime start;
        LocalDateTime end;

        if (date != null && !date.trim().isEmpty()) {
            LocalDate d = LocalDate.parse(date.trim());
            start = d.atStartOfDay();
            end = d.atTime(23, 59, 59);
        } else if (startDate != null && endDate != null) {
            start = LocalDate.parse(startDate.trim()).atStartOfDay();
            end = LocalDate.parse(endDate.trim()).atTime(23, 59, 59);
        } else {
            LocalDate today = LocalDate.now();
            start = today.atStartOfDay();
            end = today.plusDays(7).atTime(23, 59, 59);
        }

        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.CONFIRMED,
                BookingStatus.IN_USE,
                BookingStatus.PENDING_APPROVAL
        );

        List<Booking> bookings = bookingRepository.findRoomBookingsByRange(roomId, start, end, activeStatuses);
        return bookings.stream().map(this::toResponse).toList();
    }

    // ------------------------------------------------------------------
    // Helper: chuyển Entity sang Response
    // ------------------------------------------------------------------
    private BookingResponse toResponse(Booking booking) {
        BookingResponse res = new BookingResponse();
        res.setId(booking.getId());
        res.setBookingId(String.valueOf(booking.getId()));

        Room room = booking.getRoom();
        if (room != null) {
            res.setRoomId("ROOM-" + room.getId());
            res.setRoomCode(room.getRoomCode());
            int floorNum = 0;
            if (room.getRoomCode() != null && room.getRoomCode().startsWith("L.")) {
                try {
                    String part = room.getRoomCode().substring(2);
                    if (part.length() >= 3) {
                        floorNum = Integer.parseInt(part.substring(0, 1));
                    }
                } catch (Exception ignored) {}
            }
            res.setFloor(floorNum);
            res.setFloorCode(floorNum == 0 ? "G - Floor" : floorNum == 1 ? "1st - Floor" : floorNum == 2 ? "2nd - Floor" : floorNum == 3 ? "3rd - Floor" : floorNum + "th - Floor");
            res.setBuilding("Thư viện Tòa L");
            res.setRoomType(room.getRoomCode() != null && (room.getRoomCode().endsWith("06") || room.getRoomCode().endsWith("03")) ? "Phòng hội nghị" : "Phòng học nhóm");
        }

        User owner = booking.getUser();
        if (owner != null) {
            res.setStudentId(String.valueOf(owner.getId()));
            res.setStudentName(owner.getFullName());
            res.setStudentCode(owner.getStudentCode());
        }

        LocalDate bDate = booking.getBookingDate() != null ? booking.getBookingDate() :
                (booking.getStartTime() != null ? booking.getStartTime().toLocalDate() : LocalDate.now());
        res.setDate(bDate.toString());

        if (booking.getStartTime() != null) {
            LocalTime sTime = booking.getStartTime().toLocalTime();
            LocalDateTime startDt = LocalDateTime.of(bDate, sTime);
            res.setStartTime(startDt);
        }
        if (booking.getEndTime() != null) {
            LocalTime eTime = booking.getEndTime().toLocalTime();
            LocalDateTime endDt = LocalDateTime.of(bDate, eTime);
            res.setEndTime(endDt);
        }

        res.setNumberOfPeople(booking.getNumberOfPeople());
        res.setOccupancy(booking.getNumberOfPeople());
        res.setPurpose(booking.getPurpose());
        res.setStatus(booking.getStatus() != null ? booking.getStatus().name() : "PENDING_APPROVAL");
        res.setBookingStatus(res.getStatus());

        boolean isApproved = (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.IN_USE);
        if (isApproved && booking.getQrCode() != null && !booking.getQrCode().isEmpty()) {
            res.setQrCode(booking.getQrCode());
            res.setQrCodeUrl(booking.getQrCode());
            res.setQrCodeData(booking.getQrCode());
        } else {
            res.setQrCode(null);
            res.setQrCodeUrl(null);
            res.setQrCodeData(null);
        }

        int totalMembers = (booking.getBookingMembers() != null && !booking.getBookingMembers().isEmpty())
                ? booking.getBookingMembers().size()
                : (booking.getNumberOfPeople() != null ? booking.getNumberOfPeople() : 1);
        res.setTotalMembers(totalMembers);

        boolean isUsed = (booking.getStatus() == BookingStatus.IN_USE || booking.getStatus() == BookingStatus.COMPLETED);
        int checkedCount = isUsed ? 1 : 0;
        res.setCheckedInCount(checkedCount);

        if (booking.getCheckinTime() != null) {
            res.setCheckInTime(booking.getCheckinTime().toString());
        }

        if (booking.getBookingMembers() != null && !booking.getBookingMembers().isEmpty()) {
            List<BookingResponse.MemberInfo> members = booking.getBookingMembers().stream()
                    .filter(bm -> bm.getUser() != null)
                    .map(bm -> {
                        boolean isLeader = isUsed && (
                                (booking.getUser() != null && booking.getUser().getId().equals(bm.getUser().getId()))
                                || booking.getBookingMembers().get(0).getUser().getId().equals(bm.getUser().getId())
                        );
                        return BookingResponse.MemberInfo.builder()
                                .studentCode(bm.getUser().getStudentCode())
                                .studentName(bm.getUser().getFullName())
                                .qrCode(isApproved ? ("SMART-CAMPUS-" + booking.getId() + "-" + bm.getUser().getStudentCode()) : null)
                                .checkedInAt(isLeader && booking.getCheckinTime() != null ? booking.getCheckinTime().toString() : null)
                                .build();
                    })
                    .toList();
            res.setMembers(members);
        }

        return res;
    }
}

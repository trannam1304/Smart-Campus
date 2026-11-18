package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.response.CheckinResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Booking.BookingStatus;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.RoomRepository;
import com.smartcampus.backend.service.CheckinService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Triển khai nghiệp vụ Checkin. Liên quan: FR-5.2 (quét mã QR nhận phòng).
 *
 * <p>Luồng check-in theo SRS FR-5.2:
 * <ol>
 *   <li>Tìm booking theo mã QR quét được.</li>
 *   <li>Kiểm tra trạng thái phải là CONFIRMED (chưa check-in, chưa hủy).</li>
 *   <li>Kiểm tra cửa sổ thời gian: now ∈ [start−15m, start+15m].
 *       Quét sớm hơn start−15m → từ chối. Quét muộn hơn start+15m → auto-release.</li>
 *   <li>Cập nhật booking thành IN_USE, ghi nhận checkinTime.</li>
 *   <li>Cập nhật phòng sang trạng thái đang sử dụng (BOOKED).</li>
 * </ol>
 *
 * <p>Optimistic Locking (@Version trên Booking) xử lý trường hợp nhiều sinh viên
 * cùng quét QR cùng một lượt đặt tại giờ cao điểm.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CheckinServiceImpl implements CheckinService {

    // Cửa sổ check-in: 15 phút trước và 15 phút sau giờ hẹn (P-EARLY-IN / P-LATE-IN / P-GRACE)
    private static final int CHECKIN_WINDOW_MINUTES = 15;

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;

    @Override
    public CheckinResponse checkIn(String qrCode) {
        // Bước 1: Tìm booking qua mã QR hoặc mã đặt phòng (hỗ trợ nhiều định dạng mã)
        Booking booking = null;
        String scannedStudentCode = null;
        String trimmed = qrCode != null ? qrCode.trim() : "";

        // 1.1 Tìm theo qrCode trực tiếp trong bảng bookings
        booking = bookingRepository.findByQrCode(trimmed).orElse(null);

        // 1.2 Thử tìm theo mã QR nếu người dùng gõ thiếu tiền tố "QR-"
        if (booking == null && !trimmed.isEmpty()) {
            if (!trimmed.startsWith("QR-")) {
                booking = bookingRepository.findByQrCode("QR-" + trimmed).orElse(null);
            }
        }

        // 1.3 Nếu là mã cá nhân của thành viên: SMART-CAMPUS-{bookingId}-{studentCode}
        if (booking == null && trimmed.startsWith("SMART-CAMPUS-")) {
            String[] parts = trimmed.split("-");
            if (parts.length >= 3) {
                try {
                    Long bId = Long.parseLong(parts[2]);
                    booking = bookingRepository.findById(bId).orElse(null);
                    if (parts.length >= 4) {
                        scannedStudentCode = parts[3];
                    }
                } catch (NumberFormatException ignored) {}
            }
        }

        // 1.4 Nếu là mã đặt phòng dạng số (ID), BK-{id}, BOOKING-{id} hoặc #id
        if (booking == null && !trimmed.isEmpty()) {
            String numericOnly = trimmed.replaceAll("[^0-9]", "");
            if (!numericOnly.isEmpty() && numericOnly.length() <= 10) {
                try {
                    Long bId = Long.parseLong(numericOnly);
                    booking = bookingRepository.findById(bId).orElse(null);
                } catch (Exception ignored) {}
            }
        }

        if (booking == null) {
            throw new ResourceNotFoundException("Mã đặt phòng hoặc mã QR không hợp lệ. Vui lòng kiểm tra lại.");
        }

        // Bước 2: Kiểm tra trạng thái lượt đặt
        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.IN_USE) {
            if (booking.getStatus() == BookingStatus.CANCELLED_AUTO ||
                booking.getStatus() == BookingStatus.CANCELLED_USER ||
                booking.getStatus() == BookingStatus.CANCELLED_ADMIN) {
                throw new ConflictException("Lượt đặt này đã bị hủy, không thể nhận phòng.");
            }
            if (booking.getStatus() == BookingStatus.COMPLETED ||
                booking.getStatus() == BookingStatus.COMPLETED_FORCE) {
                throw new ConflictException("Lượt đặt này đã kết thúc sử dụng.");
            }
            if (booking.getStatus() == BookingStatus.PENDING_APPROVAL) {
                throw new ConflictException("Đơn đặt phòng đang chờ Ban quản lý duyệt, chưa thể nhận phòng.");
            }
            throw new ConflictException(
                    "Lượt đặt này không ở trạng thái hợp lệ để nhận phòng (trạng thái hiện tại: " + booking.getStatus() + ").");
        }

        // Bước 3: Kiểm tra cửa sổ thời gian check-in (cho phép từ sớm 15 phút đến trễ tối đa 15 phút)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = booking.getStartTime();
        LocalDateTime endTime = booking.getEndTime();
        LocalDateTime earliestCheckin = startTime.minusMinutes(CHECKIN_WINDOW_MINUTES);
        LocalDateTime latestCheckin = startTime.plusMinutes(CHECKIN_WINDOW_MINUTES);

        LocalDate today = now.toLocalDate();
        LocalDate bookingDate = booking.getBookingDate() != null ? booking.getBookingDate() : startTime.toLocalDate();

        if (today.isBefore(bookingDate)) {
            throw new ConflictException(
                    "Chưa đến ngày check-in. Lượt đặt của bạn vào ngày " + bookingDate +
                    " từ " + startTime.toLocalTime() + ".");
        }

        if (now.isBefore(earliestCheckin)) {
            throw new ConflictException(
                    "Chưa đến giờ check-in hôm nay. Bạn có thể nhận phòng từ " +
                    earliestCheckin.toLocalTime() + " (sớm 15 phút trước giờ bắt đầu " + startTime.toLocalTime() + ").");
        }

        // Nếu quá 15 phút sau giờ hẹn mà chưa check-in -> Tự động hủy và trả phòng
        if (booking.getStatus() == BookingStatus.CONFIRMED && now.isAfter(latestCheckin)) {
            booking.setStatus(BookingStatus.CANCELLED_AUTO);
            bookingRepository.save(booking);
            throw new ConflictException(
                    "Đã quá thời hạn check-in (+15 phút so với giờ hẹn lúc " + startTime.toLocalTime() +
                    "). Lượt đặt phòng này đã được hệ thống tự động hủy và trả phòng để nhường cho người khác.");
        }

        if (now.isAfter(endTime)) {
            throw new ConflictException(
                    "Lượt đặt này đã quá hạn thời gian sử dụng (kết thúc lúc " + endTime.toLocalTime() + " ngày " + bookingDate + ").");
        }

        // Bước 4: Check-in thành công → IN_USE
        booking.setStatus(BookingStatus.IN_USE);
        if (booking.getCheckinTime() == null) {
            booking.setCheckinTime(now);
        }

        try {
            booking = bookingRepository.save(booking);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException(
                    "Lượt đặt này vừa được người khác check-in. Vui lòng quét lại.");
        }

        // Bước 5: Kiểm tra trạng thái phòng (không ghi đè BOOKED vào base_status ENUM('AVAILABLE','MAINTENANCE'))
        Room room = booking.getRoom();
        if (room != null && room.getStatus() == Room.RoomStatus.MAINTENANCE) {
            throw new ConflictException("Phòng đang ở trạng thái bảo trì, không thể nhận phòng.");
        }

        return toResponse(booking, scannedStudentCode);
    }

    @Override
    @Transactional
    public CheckinResponse checkOut(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đặt với ID: " + bookingId));

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.COMPLETED_FORCE) {
            CheckinResponse res = toResponse(booking);
            res.setStatus(BookingStatus.COMPLETED.name());
            res.setMessage("Lượt đặt này đã được hoàn tất hoặc đã trả phòng trước đó.");
            return res;
        }

        if (booking.getStatus() == BookingStatus.CANCELLED_AUTO ||
            booking.getStatus() == BookingStatus.CANCELLED_USER ||
            booking.getStatus() == BookingStatus.CANCELLED_ADMIN) {
            CheckinResponse res = toResponse(booking);
            res.setMessage("Lượt đặt này đã bị hủy trước đó.");
            return res;
        }

        // Cập nhật trạng thái thành COMPLETED (hoàn tất / trả phòng thành công)
        booking.setStatus(BookingStatus.COMPLETED);
        if (booking.getEndTime() != null && LocalDateTime.now().isBefore(booking.getEndTime())) {
            booking.setEndTime(LocalDateTime.now());
        }
        booking = bookingRepository.save(booking);

        CheckinResponse res = toResponse(booking);
        res.setStatus(BookingStatus.COMPLETED.name());
        res.setMessage("Trả phòng thành công. Cảm ơn bạn đã sử dụng dịch vụ!");
        return res;
    }

    @Override
    @Transactional
    public int autoReleaseExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        // Cửa sổ check-in muộn tối đa: quá 15 phút sau giờ bắt đầu
        LocalDateTime checkinCutoff = now.minusMinutes(CHECKIN_WINDOW_MINUTES);

        int count = 0;

        // 1. Tự động hủy và trả phòng cho các booking CONFIRMED quá 15 phút mà chưa ai check-in
        List<Booking> overdueConfirmed = bookingRepository.findByStatusAndStartTimeBefore(BookingStatus.CONFIRMED, checkinCutoff);
        for (Booking b : overdueConfirmed) {
            b.setStatus(BookingStatus.CANCELLED_AUTO);
            bookingRepository.save(b);
            count++;
        }

        // 2. Tự động trả phòng cho các booking IN_USE đã hết giờ sử dụng (endTime < now)
        List<Booking> overdueInUse = bookingRepository.findByStatusAndEndTimeBefore(BookingStatus.IN_USE, now);
        for (Booking b : overdueInUse) {
            b.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(b);
            count++;
        }

        // 3. Tự động hủy các booking PENDING_APPROVAL quá giờ bắt đầu (+15 phút) mà chưa được duyệt
        List<Booking> overduePending = bookingRepository.findByStatusAndStartTimeBefore(BookingStatus.PENDING_APPROVAL, checkinCutoff);
        for (Booking b : overduePending) {
            b.setStatus(BookingStatus.CANCELLED_AUTO);
            bookingRepository.save(b);
            count++;
        }

        return count;
    }

    private CheckinResponse toResponse(Booking booking) {
        return toResponse(booking, null);
    }

    private CheckinResponse toResponse(Booking booking, String scannedStudentCode) {
        CheckinResponse res = new CheckinResponse();
        res.setBookingId(booking.getId());
        res.setRoomCode(booking.getRoom() != null ? booking.getRoom().getRoomCode() : null);
        res.setStartTime(booking.getStartTime());
        res.setEndTime(booking.getEndTime());
        res.setStatus(booking.getStatus().name());
        res.setCheckinTime(booking.getCheckinTime());
        res.setMessage("Check-in thành công. Phòng đang được sử dụng.");

        String studentCode = scannedStudentCode;
        String studentName = null;
        if (scannedStudentCode != null && booking.getBookingMembers() != null) {
            for (var bm : booking.getBookingMembers()) {
                if (bm.getUser() != null && scannedStudentCode.equalsIgnoreCase(bm.getUser().getStudentCode())) {
                    studentName = bm.getUser().getFullName();
                    break;
                }
            }
        }
        if (studentName == null && booking.getUser() != null) {
            studentName = booking.getUser().getFullName();
            if (studentCode == null) {
                studentCode = booking.getUser().getStudentCode();
            }
        }

        res.setStudentCode(studentCode);
        res.setStudentName(studentName);
        int totalMembers = (booking.getBookingMembers() != null && !booking.getBookingMembers().isEmpty())
                ? booking.getBookingMembers().size()
                : (booking.getNumberOfPeople() != null ? booking.getNumberOfPeople() : 1);
        res.setTotalMembers(totalMembers);
        res.setCheckedInCount(1);
        return res;
    }
}

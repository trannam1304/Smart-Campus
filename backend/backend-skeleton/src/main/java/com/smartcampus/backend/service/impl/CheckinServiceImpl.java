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

import java.time.LocalDateTime;

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
        // Bước 1: Tìm booking qua mã QR
        Booking booking = bookingRepository.findByQrCode(qrCode)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mã QR không hợp lệ hoặc không tìm thấy lượt đặt."));

        // Bước 2: Chỉ cho phép check-in khi trạng là CONFIRMED
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException(
                    "Lượt đặt này không ở trạng thái chờ check-in (trạng thái hiện tại: " + booking.getStatus() + ").");
        }

        // Bước 3: Kiểm tra cửa sổ thời gian check-in
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = booking.getStartTime();
        LocalDateTime earliestCheckin = startTime.minusMinutes(CHECKIN_WINDOW_MINUTES);
        LocalDateTime latestCheckin = startTime.plusMinutes(CHECKIN_WINDOW_MINUTES);

        if (now.isBefore(earliestCheckin)) {
            throw new ConflictException(
                    "Chưa đến giờ check-in. Bạn được nhận phòng từ " +
                            earliestCheckin.toLocalTime().toString() + ".");
        }

        if (now.isAfter(latestCheckin)) {
            // Quá thời gian grace → auto-release (FR-5.3)
            booking.setStatus(BookingStatus.CANCELLED_AUTO);
            try {
                booking = bookingRepository.save(booking);
            } catch (OptimisticLockingFailureException ex) {
                throw new ConflictException("Lượt đặt này đã được xử lý bởi giao dịch khác.");
            }
            throw new ConflictException(
                    "Lượt đặt đã hết hạn check-in (quá " + CHECKIN_WINDOW_MINUTES +
                            " phút sau giờ hẹn) và đã bị hủy tự động. Phòng đã được giải phóng.");
        }

        // Bước 4: Check-in thành công → IN_USE
        booking.setStatus(BookingStatus.IN_USE);
        booking.setCheckinTime(now);

        try {
            booking = bookingRepository.save(booking);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException(
                    "Lượt đặt này vừa được người khác check-in. Vui lòng quét lại.");
        }

        // Bước 5: Cập nhật phòng sang trạng thái đang sử dụng (Active / BOOKED)
        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(Room.RoomStatus.BOOKED);
            roomRepository.save(room);
        }

        return toResponse(booking);
    }

    private CheckinResponse toResponse(Booking booking) {
        CheckinResponse res = new CheckinResponse();
        res.setBookingId(booking.getId());
        res.setRoomCode(booking.getRoom() != null ? booking.getRoom().getRoomCode() : null);
        res.setStartTime(booking.getStartTime());
        res.setEndTime(booking.getEndTime());
        res.setStatus(booking.getStatus().name());
        res.setCheckinTime(booking.getCheckinTime());
        res.setMessage("Check-in thành công. Phòng đang được sử dụng.");
        return res;
    }
}

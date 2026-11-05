package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.RoomRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private QrCodeService qrCodeService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bookingService, "graceMinutes", 15);
        ReflectionTestUtils.setField(bookingService, "maxNoShow", 2);
        ReflectionTestUtils.setField(bookingService, "lockDays", 90);
    }

    @Test
    void createBookingGeneratesQrAndSendsConfirmationEmail() {
        Room room = new Room();
        room.setId(1L);
        room.setRoomCode("A3.01");

        User user = new User();
        user.setId(2L);
        user.setEmail("student@smartcampus.edu.vn");
        user.setFullName("Nguyễn Văn A");

        BookingRequest request = new BookingRequest();
        request.setRoomId(1L);
        request.setStartTime(LocalDateTime.now().plusDays(1).withHour(9).withMinute(0));
        request.setEndTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0));
        request.setNumberOfPeople(4);
        request.setPurpose("Học nhóm môn CNPM");

        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(bookingRepository.findByRoomIdAndStartTimeBetween(eq(1L), any(), any())).thenReturn(Collections.emptyList());

        Booking savedBooking = new Booking();
        savedBooking.setId(101L);
        savedBooking.setRoom(room);
        savedBooking.setUser(user);
        savedBooking.setStatus(Booking.BookingStatus.CONFIRMED);
        savedBooking.setStartTime(request.getStartTime());
        savedBooking.setEndTime(request.getEndTime());
        savedBooking.setNumberOfPeople(4);
        savedBooking.setPurpose("Học nhóm môn CNPM");

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        when(qrCodeService.generateSecureBookingToken(101L)).thenReturn("BK-20261105-0101_SEC_992182");
        when(qrCodeService.generateQrImage("BK-20261105-0101_SEC_992182", 240, 240)).thenReturn(new byte[]{1, 2, 3});

        BookingResponse response = bookingService.createBooking(request, 2L);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("A3.01", response.getRoomCode());

        // Xác minh gọi emailService gửi mail kèm QR đính kèm
        verify(emailService, times(1)).sendBookingConfirmationEmail(
                eq("student@smartcampus.edu.vn"),
                eq("Nguyễn Văn A"),
                eq(101L),
                eq("A3.01"),
                any(),
                any(),
                eq(4),
                eq("Học nhóm môn CNPM"),
                any(),
                eq("BK-20261105-0101_SEC_992182")
        );
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void autoReleaseOverdueBookingsWhenNoOverdueReturnsZero() {
        when(bookingRepository.findOverdueBookings(any(), any())).thenReturn(Collections.emptyList());

        int result = bookingService.autoReleaseOverdueBookings();

        assertEquals(0, result);
        verify(bookingRepository, never()).save(any());
        verify(roomRepository, never()).save(any());
        verify(emailService, never()).sendAutoCancelEmail(any(), any(), any(), any(), any(), anyInt(), anyInt(), anyBoolean());
    }

    @Test
    void autoReleaseOverdueBookingsReleasesRoomPenalizesUserAndSendsWarningEmail() {
        Room room = new Room();
        room.setId(1L);
        room.setRoomCode("B2.04");
        room.setStatus(Room.RoomStatus.BOOKED);

        User user = new User();
        user.setId(5L);
        user.setEmail("student@smartcampus.edu.vn");
        user.setFullName("Nguyễn Văn B");
        user.setNoShowCount(0);
        user.setStatus(User.AccountStatus.ACTIVE);

        Booking booking = new Booking();
        booking.setId(100L);
        booking.setRoom(room);
        booking.setUser(user);
        booking.setStartTime(LocalDateTime.now().minusMinutes(25));
        booking.setStatus(Booking.BookingStatus.CONFIRMED);

        when(bookingRepository.findOverdueBookings(any(), any())).thenReturn(List.of(booking));
        when(bookingRepository.hasActiveBookingsForRoom(eq(1L), eq(100L), any())).thenReturn(false);

        int released = bookingService.autoReleaseOverdueBookings();

        assertEquals(1, released);
        assertEquals(Booking.BookingStatus.CANCELLED_AUTO, booking.getStatus());
        assertEquals(Room.RoomStatus.AVAILABLE, room.getStatus());
        assertEquals(1, user.getNoShowCount());

        verify(bookingRepository, times(1)).save(booking);
        verify(roomRepository, times(1)).save(room);
        verify(userRepository, times(1)).save(user);

        // Xác minh gửi email cảnh báo auto-cancel
        verify(emailService, times(1)).sendAutoCancelEmail(
                eq("student@smartcampus.edu.vn"),
                eq("Nguyễn Văn B"),
                eq(100L),
                eq("B2.04"),
                any(),
                eq(15),
                eq(1),
                eq(false)
        );
    }

    @Test
    void autoReleaseOverdueBookingsLocksUserWhenMaxNoShowExceeded() {
        Room room = new Room();
        room.setId(1L);
        room.setRoomCode("B2.04");

        User user = new User();
        user.setId(5L);
        user.setEmail("student@smartcampus.edu.vn");
        user.setFullName("Nguyễn Văn C");
        user.setNoShowCount(1); // 1 + 1 = 2 >= maxNoShow (2)
        user.setStatus(User.AccountStatus.ACTIVE);

        Booking booking = new Booking();
        booking.setId(101L);
        booking.setRoom(room);
        booking.setUser(user);
        booking.setStartTime(LocalDateTime.now().minusMinutes(30));
        booking.setStatus(Booking.BookingStatus.CONFIRMED);

        when(bookingRepository.findOverdueBookings(any(), any())).thenReturn(List.of(booking));
        when(bookingRepository.hasActiveBookingsForRoom(eq(1L), eq(101L), any())).thenReturn(false);

        int released = bookingService.autoReleaseOverdueBookings();

        assertEquals(1, released);
        assertEquals(2, user.getNoShowCount());
        assertEquals(User.AccountStatus.LOCKED, user.getStatus());
        assertNotNull(user.getLockedUntil());

        // Xác minh gửi email với cờ isLocked = true
        verify(emailService, times(1)).sendAutoCancelEmail(
                eq("student@smartcampus.edu.vn"),
                eq("Nguyễn Văn C"),
                eq(101L),
                eq("B2.04"),
                any(),
                eq(15),
                eq(2),
                eq(true)
        );
    }
}

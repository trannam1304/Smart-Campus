package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.service.EmailService;
import com.smartcampus.backend.service.QrCodeService;
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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingReminderSchedulerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private QrCodeService qrCodeService;

    @InjectMocks
    private BookingReminderScheduler scheduler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(scheduler, "reminderLeadMinutes", 15);
    }

    @Test
    void scanAndSendBookingRemindersSendsEmailAndSetsFlag() {
        User user = new User();
        user.setId(10L);
        user.setEmail("student@smartcampus.edu.vn");
        user.setFullName("Nguyễn Văn A");

        Room room = new Room();
        room.setRoomCode("A3.01");

        Booking booking = new Booking();
        booking.setId(42L);
        booking.setUser(user);
        booking.setRoom(room);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setStartTime(LocalDateTime.now().plusMinutes(12));
        booking.setEndTime(LocalDateTime.now().plusMinutes(132));
        booking.setReminderSent(false);

        when(bookingRepository.findBookingsNeedingReminder(eq(Booking.BookingStatus.CONFIRMED), any(), any()))
                .thenReturn(List.of(booking));
        when(qrCodeService.getBookingQrImage(42L, 200, 200)).thenReturn(new byte[]{1, 2, 3});

        scheduler.scanAndSendBookingReminders();

        verify(emailService, times(1)).sendBookingReminderEmail(
                eq("student@smartcampus.edu.vn"),
                eq("Nguyễn Văn A"),
                eq(42L),
                eq("A3.01"),
                any(),
                any(),
                any()
        );
        assertTrue(booking.getReminderSent());
        verify(bookingRepository, times(1)).save(booking);
    }

    @Test
    void scanAndSendBookingRemindersWhenNoBookingsDoesNothing() {
        when(bookingRepository.findBookingsNeedingReminder(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        scheduler.scanAndSendBookingReminders();

        verify(emailService, never()).sendBookingReminderEmail(any(), any(), any(), any(), any(), any(), any());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void scanAndSendBookingRemindersHandlesExceptionsGracefully() {
        when(bookingRepository.findBookingsNeedingReminder(any(), any(), any()))
                .thenThrow(new RuntimeException("DB Connection Timeout"));

        assertDoesNotThrow(() -> scheduler.scanAndSendBookingReminders());
    }
}


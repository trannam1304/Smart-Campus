package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingAutoReleaseSchedulerTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingAutoReleaseScheduler scheduler;

    @Test
    void scanAndAutoReleaseOverdueBookingsInvokesService() {
        when(bookingService.autoReleaseOverdueBookings()).thenReturn(3);

        scheduler.scanAndAutoReleaseOverdueBookings();

        verify(bookingService, times(1)).autoReleaseOverdueBookings();
    }

    @Test
    void scanAndAutoReleaseOverdueBookingsHandlesExceptionGracefully() {
        when(bookingService.autoReleaseOverdueBookings()).thenThrow(new RuntimeException("Database timeout"));

        assertDoesNotThrow(() -> {
            scheduler.scanAndAutoReleaseOverdueBookings();
        });

        verify(bookingService, times(1)).autoReleaseOverdueBookings();
    }
}


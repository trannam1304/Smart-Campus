package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.Room;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.service.impl.QrCodeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QrCodeServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private QrCodeServiceImpl qrCodeService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(qrCodeService, "hmacSecret", "TEST_SECRET_KEY_MIN_32_CHARACTERS_FOR_HMAC");
        ReflectionTestUtils.setField(qrCodeService, "earlyLimitMinutes", 15);
        ReflectionTestUtils.setField(qrCodeService, "graceMinutes", 15);
    }

    @Test
    void generateQrImageGeneratesValidPngBytes() {
        byte[] bytes = qrCodeService.generateQrImage("BK-20261105-0001_SEC_TEST", 200, 200);
        assertNotNull(bytes);
        assertTrue(bytes.length > 0);
        assertEquals((byte) 0x89, bytes[0]);
        assertEquals((byte) 0x50, bytes[1]);
        assertEquals((byte) 0x4E, bytes[2]);
        assertEquals((byte) 0x47, bytes[3]);
    }

    @Test
    void generateQrBase64GeneratesValidDataUrl() {
        String base64 = qrCodeService.generateQrBase64("BK-20261105-0001_SEC_TEST", 200, 200);
        assertNotNull(base64);
        assertTrue(base64.startsWith("data:image/png;base64,"));
    }

    @Test
    void generateSecureBookingTokenProducesSignedFormat() {
        String token = qrCodeService.generateSecureBookingToken(123L);
        assertNotNull(token);
        assertTrue(token.contains("-0123_SEC_"));
    }

    @Test
    void getBookingQrDetailReturnsValidDetailResponse() {
        Room room = new Room();
        room.setRoomCode("A3.01");

        Booking booking = new Booking();
        booking.setId(10L);
        booking.setRoom(room);
        booking.setStartTime(LocalDateTime.of(2026, 11, 5, 9, 0));
        booking.setEndTime(LocalDateTime.of(2026, 11, 5, 11, 0));
        booking.setQrCode("BK-20261105-0010_SEC_ABC123");

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        QrCodeDetailResponse response = qrCodeService.getBookingQrDetail(10L);

        assertNotNull(response);
        assertEquals("A3.01", response.getRoomCode());
        assertEquals("BK-20261105-0010_SEC_ABC123", response.getQrCodeData());
        assertTrue(response.getQrCodeImageBase64().startsWith("data:image/png;base64,"));
        assertNotNull(response.getCheckInWindow());
    }

    @Test
    void getBookingQrDetailThrowsResourceNotFoundWhenIdNotFound() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> qrCodeService.getBookingQrDetail(999L));
    }
}


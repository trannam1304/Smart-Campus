package com.smartcampus.backend.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class QrCodeUtilTest {

    @Test
    void generateQrCodeReturnsValidPngBytes() {
        byte[] bytes = QrCodeUtil.generateQrCode("BK-20260915-0892_SEC_992182", 200, 200);
        assertNotNull(bytes);
        assertTrue(bytes.length > 0);
        // Kiểm tra magic header của file PNG (0x89 0x50 0x4E 0x47)
        assertEquals((byte) 0x89, bytes[0]);
        assertEquals((byte) 0x50, bytes[1]);
        assertEquals((byte) 0x4E, bytes[2]);
        assertEquals((byte) 0x47, bytes[3]);
    }

    @Test
    void generateQrCodeBase64ReturnsValidDataUrl() {
        String base64 = QrCodeUtil.generateQrCodeBase64("BK-20260915-0892_SEC_992182", 200, 200);
        assertNotNull(base64);
        assertTrue(base64.startsWith("data:image/png;base64,"));
    }

    @Test
    void generateUniqueQrDataMatchesExpectedContract() {
        LocalDate date = LocalDate.of(2026, 9, 15);
        String qrData = QrCodeUtil.generateUniqueQrData(892L, date);
        assertNotNull(qrData);
        assertTrue(qrData.startsWith("BK-20260915-0892_SEC_"));

        Long parsedId = QrCodeUtil.parseInternalBookingId(qrData);
        assertEquals(892L, parsedId);
    }

    @Test
    void parseInternalBookingIdHandlesVariousFormats() {
        assertEquals(892L, QrCodeUtil.parseInternalBookingId("BK-20260915-0892"));
        assertEquals(892L, QrCodeUtil.parseInternalBookingId("BK-20260915-0892_SEC_992182"));
        assertEquals(892L, QrCodeUtil.parseInternalBookingId("892"));
        assertEquals(12L, QrCodeUtil.parseInternalBookingId("BOOKING-12"));
        assertNull(QrCodeUtil.parseInternalBookingId("INVALID_ID"));
    }
}

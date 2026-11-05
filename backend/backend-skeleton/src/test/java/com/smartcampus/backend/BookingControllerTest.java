package com.smartcampus.backend;

import com.smartcampus.backend.controller.BookingController;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.exception.GlobalExceptionHandler;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.QrCodeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private QrCodeService qrCodeService;

    @Test
    void getBookingQrCodeReturnsOkWithDetail() throws Exception {
        QrCodeDetailResponse res = new QrCodeDetailResponse(
                "BK-20261105-0042",
                "A3.01",
                "BK-20261105-0042_SEC_992182",
                "data:image/png;base64,mockBase64String",
                new QrCodeDetailResponse.CheckInWindow("2026-11-05T08:45:00", "2026-11-05T09:15:00")
        );
        when(qrCodeService.getBookingQrDetail(42L)).thenReturn(res);

        mockMvc.perform(get("/api/bookings/42/qr-code"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.bookingId").value("BK-20261105-0042"))
                .andExpect(jsonPath("$.data.roomCode").value("A3.01"))
                .andExpect(jsonPath("$.data.qrCodeData").value("BK-20261105-0042_SEC_992182"))
                .andExpect(jsonPath("$.data.qrCodeImageBase64").value("data:image/png;base64,mockBase64String"));
    }

    @Test
    void getBookingQrImageReturnsPngByteArray() throws Exception {
        byte[] mockBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        when(qrCodeService.getBookingQrImage(42L, 240, 240)).thenReturn(mockBytes);

        mockMvc.perform(get("/api/bookings/42/qr-code/image"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_PNG_VALUE))
                .andExpect(content().bytes(mockBytes));
    }

    @Test
    void getBookingQrCodeThrows404WhenBookingNotFound() throws Exception {
        when(qrCodeService.getBookingQrDetail(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy lượt đặt phòng với ID: 999"));

        mockMvc.perform(get("/api/bookings/999/qr-code"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ERR_NOT_FOUND"));
    }
}


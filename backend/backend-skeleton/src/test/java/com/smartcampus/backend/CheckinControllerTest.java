package com.smartcampus.backend;

import com.smartcampus.backend.controller.CheckinController;
import com.smartcampus.backend.dto.request.CheckinQrRequest;
import com.smartcampus.backend.dto.request.CheckoutRequest;
import com.smartcampus.backend.dto.response.CheckinQrResponse;
import com.smartcampus.backend.dto.response.CheckoutResponse;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.GlobalExceptionHandler;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.service.CheckinService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CheckinController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class CheckinControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CheckinService checkinService;

    @Test
    void checkinByQrReturnsContractEnvelopeAndSuccess() throws Exception {
        CheckinQrResponse res = new CheckinQrResponse("BK-20260915-0892", "IN_USE", "2026-09-15T08:55:12+07:00");
        when(checkinService.checkinByQr(any(CheckinQrRequest.class))).thenReturn(res);

        mockMvc.perform(post("/checkin/qr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "qrData": "BK-20260915-0892_SEC_992182",
                                  "scannedAt": "2026-09-15T08:55:00+07:00",
                                  "deviceLocation": "DOOR_DEVICE_A301"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("Check-in thành công! Mở khóa cửa phòng A301."))
                .andExpect(jsonPath("$.data.bookingId").value("BK-20260915-0892"))
                .andExpect(jsonPath("$.data.status").value("IN_USE"))
                .andExpect(jsonPath("$.data.checkInTime").value("2026-09-15T08:55:12+07:00"));
    }

    @Test
    void checkoutReturnsContractEnvelopeAndSuccess() throws Exception {
        CheckoutResponse res = new CheckoutResponse("BK-20260915-0892", "COMPLETED", "2026-09-15T10:50:00+07:00");
        when(checkinService.checkout(any(CheckoutRequest.class))).thenReturn(res);

        mockMvc.perform(post("/checkin/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "bookingId": "BK-20260915-0892"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("Trả phòng thành công. Cảm ơn bạn đã sử dụng dịch vụ."))
                .andExpect(jsonPath("$.data.bookingId").value("BK-20260915-0892"))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.actualCheckoutTime").value("2026-09-15T10:50:00+07:00"));
    }

    @Test
    void checkinByQrFailsWhenQrNotFound() throws Exception {
        when(checkinService.checkinByQr(any(CheckinQrRequest.class)))
                .thenThrow(new ResourceNotFoundException("Mã QR hoặc Mã đặt phòng không hợp lệ."));

        mockMvc.perform(post("/checkin/qr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "qrData": "INVALID_QR",
                                  "scannedAt": "2026-09-15T08:55:00+07:00"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ERR_NOT_FOUND"));
    }

    @Test
    void checkinByQrFailsWhenOutsideGracePeriod() throws Exception {
        when(checkinService.checkinByQr(any(CheckinQrRequest.class)))
                .thenThrow(new ConflictException("Chưa đến giờ check-in! Bạn chỉ có thể check-in trước tối đa 15 phút."));

        mockMvc.perform(post("/checkin/qr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "qrData": "BK-20260915-0892_SEC_992182",
                                  "scannedAt": "2026-09-15T08:30:00+07:00"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ERR_CONFLICT"));
    }

    @Test
    void getQrDetailReturnsQrInfo() throws Exception {
        QrCodeDetailResponse res = new QrCodeDetailResponse(
                "BK-20260915-0892",
                "A3.01",
                "BK-20260915-0892_SEC_992182",
                "data:image/png;base64,mockBase64",
                new QrCodeDetailResponse.CheckInWindow("2026-09-15T08:45:00+07:00", "2026-09-15T09:15:00+07:00")
        );
        when(checkinService.getQrDetail("BK-20260915-0892")).thenReturn(res);

        mockMvc.perform(get("/checkin/qr/BK-20260915-0892"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.qrCodeData").value("BK-20260915-0892_SEC_992182"))
                .andExpect(jsonPath("$.data.roomCode").value("A3.01"))
                .andExpect(jsonPath("$.data.checkInWindow.allowEarlyFrom").value("2026-09-15T08:45:00+07:00"))
                .andExpect(jsonPath("$.data.checkInWindow.deadlineAt").value("2026-09-15T09:15:00+07:00"));
    }
}

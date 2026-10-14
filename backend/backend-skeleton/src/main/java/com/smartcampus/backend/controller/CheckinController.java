package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.CheckinQrRequest;
import com.smartcampus.backend.dto.request.CheckoutRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.CheckinQrResponse;
import com.smartcampus.backend.dto.response.CheckoutResponse;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.service.CheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/checkin", "/checkin", "/api/checkin"})
@RequiredArgsConstructor
@Validated
public class CheckinController {

    private final CheckinService checkinService;

    /**
     * 5.1 Quét mã QR điểm danh nhận phòng (FR-5.2)
     * Cửa sổ cho phép: [Start - 15m, Start + 15m]
     */
    @PostMapping("/qr")
    public ApiResponse<CheckinQrResponse> checkinByQr(@Valid @RequestBody CheckinQrRequest request) {
        CheckinQrResponse data = checkinService.checkinByQr(request);
        String roomMsg = request.getDeviceLocation() != null && request.getDeviceLocation().startsWith("DOOR_DEVICE_")
                ? request.getDeviceLocation().replace("DOOR_DEVICE_", "")
                : "";
        String message = roomMsg.isEmpty()
                ? "Check-in thành công! Mở khóa cửa phòng."
                : String.format("Check-in thành công! Mở khóa cửa phòng %s.", roomMsg);
        return ApiResponse.ok(data, message);
    }

    /**
     * 5.2 Quét mã QR Checkout kết thúc phiên
     */
    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse data = checkinService.checkout(request);
        return ApiResponse.ok(data, "Trả phòng thành công. Cảm ơn bạn đã sử dụng dịch vụ.");
    }

    /**
     * FR-5.1: Lấy chi tiết thông tin mã QR cho lượt đặt phòng
     */
    @GetMapping("/qr/{bookingId}")
    public ApiResponse<QrCodeDetailResponse> getQrDetail(@PathVariable String bookingId) {
        return ApiResponse.ok(checkinService.getQrDetail(bookingId));
    }

    /**
     * FR-5.1: Lấy trực tiếp hình ảnh PNG của mã QR
     */
    @GetMapping(value = "/qr/{bookingId}/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrImage(
            @PathVariable String bookingId,
            @RequestParam(defaultValue = "240") int width,
            @RequestParam(defaultValue = "240") int height) {
        byte[] imageBytes = checkinService.getQrImage(bookingId, width, height);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .body(imageBytes);
    }
}

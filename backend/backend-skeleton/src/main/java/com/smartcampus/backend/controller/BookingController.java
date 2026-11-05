package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.QrCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller cho các API liên quan đến Đặt phòng và QR Code.
 * Nghiệp vụ liên quan: FR-3.1 (Đặt phòng), FR-3.2 (Chống trùng lịch), FR-5.1 (Sinh mã QR định danh), FR-6.1 (Gửi email)
 */
@RestController
@RequestMapping({"/api/bookings", "/api/booking", "/bookings"})
@RequiredArgsConstructor
@Validated
public class BookingController {

    private final BookingService bookingService;
    private final QrCodeService qrCodeService;

    /**
     * FR-3.1 & FR-5.1 & FR-6.1: Tạo đơn đặt phòng mới, tự động sinh mã QR và kích hoạt email xác nhận
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request,
            @RequestParam(required = false, defaultValue = "1") Long userId) {
        BookingResponse data = bookingService.createBooking(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(data, "Đặt phòng thành công. Mã QR định danh và email xác nhận đã được gửi."));
    }

    /**
     * FR-5.1: Lấy chi tiết thông tin mã QR cho lượt đặt phòng theo ID (dạng JSON kèm Base64)
     * GET /api/bookings/{id}/qr-code
     */
    @GetMapping("/{id}/qr-code")
    public ApiResponse<QrCodeDetailResponse> getBookingQrCode(@PathVariable Long id) {
        QrCodeDetailResponse qrDetail = qrCodeService.getBookingQrDetail(id);
        return ApiResponse.ok(qrDetail, "Lấy thông tin mã QR thành công.");
    }

    /**
     * FR-5.1: Lấy trực tiếp hình ảnh PNG của mã QR theo Booking ID
     * GET /api/bookings/{id}/qr-code/image
     */
    @GetMapping(value = "/{id}/qr-code/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getBookingQrImage(
            @PathVariable Long id,
            @RequestParam(defaultValue = "240") int width,
            @RequestParam(defaultValue = "240") int height) {
        byte[] imageBytes = qrCodeService.getBookingQrImage(id, width, height);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .body(imageBytes);
    }
}

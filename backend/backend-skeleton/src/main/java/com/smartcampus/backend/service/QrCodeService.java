package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.response.QrCodeDetailResponse;

/**
 * Service quản lý sinh và xử lý mã QR định danh cho lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-5.1 (Sinh mã QR định danh), NFR-02 (Bảo mật & Ký số token)
 */
public interface QrCodeService {

    /**
     * Sinh mảng byte[] hình ảnh PNG của mã QR từ nội dung bất kỳ bằng thư viện ZXing.
     */
    byte[] generateQrImage(String content, int width, int height);

    /**
     * Sinh chuỗi Data URL Base64 (data:image/png;base64,...) từ nội dung bất kỳ bằng ZXing.
     */
    String generateQrBase64(String content, int width, int height);

    /**
     * FR-5.1 / NFR-02: Tạo token định danh duy nhất được ký bảo mật (HMAC-SHA256 signature)
     * chứa thông tin của Booking ID để chống giả mạo mã QR.
     */
    String generateSecureBookingToken(Long bookingId);

    /**
     * Lấy thông tin chi tiết mã QR của lượt đặt phòng theo ID (dạng DTO kèm Base64 và cửa sổ check-in).
     */
    QrCodeDetailResponse getBookingQrDetail(Long bookingId);

    /**
     * Lấy dữ liệu ảnh PNG của mã QR theo Booking ID.
     */
    byte[] getBookingQrImage(Long bookingId, int width, int height);
}


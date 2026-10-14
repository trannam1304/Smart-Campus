package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.CheckinQrRequest;
import com.smartcampus.backend.dto.request.CheckoutRequest;
import com.smartcampus.backend.dto.response.CheckinQrResponse;
import com.smartcampus.backend.dto.response.CheckoutResponse;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;

/**
 * Nghiệp vụ nhóm Checkin & Điểm danh QR.
 * Liên quan: FR-5.1 (Sinh mã QR), FR-5.2 (Điểm danh QR), FR-5.3 (Auto-release & Khóa kỷ luật)
 */
public interface CheckinService {

    /**
     * FR-5.2: Điểm danh nhận phòng bằng mã QR trong cửa sổ [Start - 15m, Start + 15m].
     */
    CheckinQrResponse checkinByQr(CheckinQrRequest request);

    /**
     * Checkout kết thúc phiên sử dụng phòng.
     */
    CheckoutResponse checkout(CheckoutRequest request);

    /**
     * FR-5.1: Lấy chi tiết thông tin mã QR (dữ liệu định danh, Base64, khung giờ quét).
     */
    QrCodeDetailResponse getQrDetail(String bookingId);

    /**
     * FR-5.1: Lấy hình ảnh mã QR (PNG bytes).
     */
    byte[] getQrImage(String bookingId, int width, int height);

    /**
     * FR-5.3: Tác vụ quét DB tự động hủy các lượt đặt phòng quá hạn check-in 15 phút (Auto-release).
     * @return số lượt đặt phòng đã được tự động hủy.
     */
    int autoReleaseOverdueBookings();
}

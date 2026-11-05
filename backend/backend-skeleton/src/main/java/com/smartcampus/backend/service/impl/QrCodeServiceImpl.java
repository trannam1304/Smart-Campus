package com.smartcampus.backend.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.smartcampus.backend.dto.response.QrCodeDetailResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.service.QrCodeService;
import com.smartcampus.backend.util.QrCodeUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

/**
 * Triển khai dịch vụ sinh và quản lý mã QR định danh cho lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-5.1 (Sinh mã QR định danh), NFR-02 (Bảo mật & Ký số token)
 */
@Service
@RequiredArgsConstructor
public class QrCodeServiceImpl implements QrCodeService {

    private static final Logger log = LoggerFactory.getLogger(QrCodeServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final BookingRepository bookingRepository;

    @Value("${app.jwt.secret:CHANGE_ME_SECRET_KEY_MIN_32_CHARS}")
    private String hmacSecret;

    @Value("${app.booking.checkin-early-limit-minutes:15}")
    private int earlyLimitMinutes;

    @Value("${app.booking.auto-release-minutes:15}")
    private int graceMinutes;

    @Override
    public byte[] generateQrImage(String content, int width, int height) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Nội dung mã QR không được để trống.");
        }
        int qrWidth = width > 0 ? width : 240;
        int qrHeight = height > 0 ? height : 240;

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, qrWidth, qrHeight, hints);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return pngOutputStream.toByteArray();
        } catch (WriterException | IOException e) {
            log.error("Lỗi khi sinh hình ảnh mã QR qua ZXing: {}", e.getMessage(), e);
            throw new IllegalStateException("Không thể sinh ảnh mã QR: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateQrBase64(String content, int width, int height) {
        byte[] qrBytes = generateQrImage(content, width, height);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(qrBytes);
    }

    @Override
    public String generateSecureBookingToken(Long bookingId) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking ID không được để trống khi sinh token.");
        }
        try {
            String dateStr = LocalDateTime.now().format(DATE_FORMATTER);
            String rawPayload = String.format("BK-%s-%04d", dateStr, bookingId);

            // NFR-02: Ký số HMAC-SHA256 nhằm ngăn chặn giả mạo mã QR
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] hash = hmac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
            String shortSig = signature.length() > 8 ? signature.substring(0, 8) : signature;

            return rawPayload + "_SEC_" + shortSig;
        } catch (Exception e) {
            log.warn("Lỗi khi ký số HMAC token, chuyển sang mã ngẫu nhiên an toàn: {}", e.getMessage());
            return QrCodeUtil.generateUniqueQrData(bookingId, LocalDateTime.now().toLocalDate());
        }
    }

    @Override
    @Transactional
    public QrCodeDetailResponse getBookingQrDetail(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đặt phòng với ID: " + bookingId));

        String qrData = booking.getQrCode();
        if (qrData == null || qrData.isBlank()) {
            qrData = generateSecureBookingToken(booking.getId());
            booking.setQrCode(qrData);
            bookingRepository.save(booking);
        }

        String base64Image = generateQrBase64(qrData, 240, 240);
        LocalDateTime start = booking.getStartTime() != null ? booking.getStartTime() : LocalDateTime.now();
        LocalDateTime allowEarlyFrom = start.minusMinutes(earlyLimitMinutes);
        LocalDateTime deadlineAt = start.plusMinutes(graceMinutes);

        String roomCode = booking.getRoom() != null ? booking.getRoom().getRoomCode() : "N/A";
        String publicBookingId = QrCodeUtil.formatPublicBookingId(booking.getId(), start.toLocalDate());

        return new QrCodeDetailResponse(
                publicBookingId,
                roomCode,
                qrData,
                base64Image,
                new QrCodeDetailResponse.CheckInWindow(allowEarlyFrom.toString(), deadlineAt.toString())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getBookingQrImage(Long bookingId, int width, int height) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đặt phòng với ID: " + bookingId));

        String qrData = booking.getQrCode();
        if (qrData == null || qrData.isBlank()) {
            qrData = generateSecureBookingToken(booking.getId());
        }
        return generateQrImage(qrData, width > 0 ? width : 240, height > 0 ? height : 240);
    }
}


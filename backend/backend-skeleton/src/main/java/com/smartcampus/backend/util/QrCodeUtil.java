package com.smartcampus.backend.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

/**
 * Tiện ích sinh mã QR cho vé điện tử và lượt đặt phòng.
 * Liên quan: FR-5.1 (Sinh mã QR động)
 */
public final class QrCodeUtil {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private QrCodeUtil() {
    }

    /**
     * Sinh mảng byte[] ảnh QR theo định dạng PNG.
     */
    public static byte[] generateQrCode(String content, int width, int height) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Nội dung mã QR không được để trống.");
        }
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return pngOutputStream.toByteArray();
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Lỗi khi sinh mã QR code: " + e.getMessage(), e);
        }
    }

    /**
     * Sinh ảnh QR trả về chuỗi Data URL Base64 (data:image/png;base64,...).
     */
    public static String generateQrCodeBase64(String content, int width, int height) {
        byte[] qrBytes = generateQrCode(content, width, height);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(qrBytes);
    }

    /**
     * Sinh chuỗi định danh duy nhất cho booking theo API Contract:
     * Ví dụ: BK-20260915-0892_SEC_992182
     */
    public static String generateUniqueQrData(long bookingId, LocalDate bookingDate) {
        String dateStr = (bookingDate != null ? bookingDate : LocalDate.now()).format(DATE_FORMATTER);
        String publicBookingId = formatPublicBookingId(bookingId, bookingDate);
        int randomSuffix = 100000 + RANDOM.nextInt(900000);
        return publicBookingId + "_SEC_" + randomSuffix;
    }

    /**
     * Định dạng mã công khai của lượt đặt phòng: BK-yyyyMMdd-0892
     */
    public static String formatPublicBookingId(long bookingId, LocalDate bookingDate) {
        String dateStr = (bookingDate != null ? bookingDate : LocalDate.now()).format(DATE_FORMATTER);
        return String.format("BK-%s-%04d", dateStr, bookingId);
    }

    /**
     * Trích xuất ID nội bộ từ mã công khai (ví dụ: BK-20260915-0892 -> 892)
     */
    public static Long parseInternalBookingId(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return null;
        }
        String clean = publicId.trim();
        // Nếu đã là chuỗi số
        if (clean.matches("^\\d+$")) {
            return Long.parseLong(clean);
        }
        // Nếu có dạng BK-..._SEC_...
        if (clean.contains("_SEC_")) {
            clean = clean.substring(0, clean.indexOf("_SEC_"));
        }
        // Nếu có dạng BK-yyyyMMdd-xxxx
        if (clean.startsWith("BK-")) {
            String[] parts = clean.split("-");
            if (parts.length >= 3 && parts[parts.length - 1].matches("^\\d+$")) {
                return Long.parseLong(parts[parts.length - 1]);
            }
        }
        // Trường hợp BOOKING-xxxx
        if (clean.startsWith("BOOKING-")) {
            String part = clean.substring("BOOKING-".length());
            if (part.matches("^\\d+$")) {
                return Long.parseLong(part);
            }
        }
        return null;
    }
}

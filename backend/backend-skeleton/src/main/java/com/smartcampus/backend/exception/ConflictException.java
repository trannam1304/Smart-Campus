package com.smartcampus.backend.exception;

// Dùng cho các lỗi nghiệp vụ như trùng lịch (FR-3.2), vượt hạn mức (FR-3.3)
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}

package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// Response bao bọc chung cho toàn bộ API
@Getter
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private int code;
    private String message;
    private T data;
    private String errorCode;
    private Object details;
    private Pagination pagination;
    private Instant timestamp;

    private ApiResponse(boolean success, int code, String message, T data, String errorCode,
                        Object details, Pagination pagination) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
        this.details = details;
        this.pagination = pagination;
        this.timestamp = Instant.now();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, "Thao tác thực hiện thành công.", data, null, null, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, "Tạo mới thành công.", data, null, null, null);
    }

    public static <T> ApiResponse<List<T>> paginated(List<T> data, Pagination pagination) {
        return new ApiResponse<>(true, 200, "Thao tác thực hiện thành công.", data, null, null, pagination);
    }

    public static <T> ApiResponse<T> error(String message) {
        return error(500, "ERR_INTERNAL", message);
    }

    public static <T> ApiResponse<T> error(int code, String errorCode, String message) {
        return new ApiResponse<>(false, code, message, null, errorCode, null, null);
    }

    public static <T> ApiResponse<T> error(int code, String errorCode, String message, Object details) {
        return new ApiResponse<>(false, code, message, null, errorCode, details, null);
    }

    @Getter
    @AllArgsConstructor
    public static class Pagination {
        private int page;
        private int limit;
        private long totalElements;
        private int totalPages;
    }
}

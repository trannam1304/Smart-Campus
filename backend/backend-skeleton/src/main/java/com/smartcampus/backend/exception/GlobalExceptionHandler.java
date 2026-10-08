package com.smartcampus.backend.exception;

import com.smartcampus.backend.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return response(HttpStatus.NOT_FOUND, "ERR_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        return response(HttpStatus.CONFLICT, "ERR_CONFLICT", ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataConflict(DataIntegrityViolationException ex) {
        return response(HttpStatus.CONFLICT, "ERR_DATA_CONFLICT",
                "Không thể thực hiện thao tác do dữ liệu đang được tham chiếu hoặc bị trùng.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidRequest(MethodArgumentNotValidException ex) {
        Map<String, String> details = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage() == null ? "Giá trị không hợp lệ." : error.getDefaultMessage(),
                        (first, ignored) -> first));
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "ERR_VALIDATION",
                "Dữ liệu yêu cầu không hợp lệ.", details));
    }

    @ExceptionHandler({ConstraintViolationException.class, IllegalArgumentException.class,
            HttpMessageNotReadableException.class})
    public ResponseEntity<ApiResponse<Void>> handleInvalidRequest(Exception ex) {
        return response(HttpStatus.BAD_REQUEST, "ERR_VALIDATION", "Dữ liệu yêu cầu không hợp lệ.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        logger.error("Lỗi không xử lý được khi gọi API.", ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "ERR_INTERNAL", "Đã có lỗi xảy ra.");
    }

    private ResponseEntity<ApiResponse<Void>> response(HttpStatus status, String errorCode, String message) {
        return ResponseEntity.status(status)
                .body(ApiResponse.error(status.value(), errorCode, message));
    }
}

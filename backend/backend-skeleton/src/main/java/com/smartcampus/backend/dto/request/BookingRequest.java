package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class BookingRequest {
    @NotNull(message = "ID phòng không được để trống")
    private Long roomId;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Future(message = "Thời gian bắt đầu phải ở tương lai")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    @Future(message = "Thời gian kết thúc phải ở tương lai")
    private LocalDateTime endTime;

    @NotNull(message = "Số lượng người không được để trống")
    @Min(value = 1, message = "Số lượng người tối thiểu là 1")
    private Integer numberOfPeople;

    private String purpose;
}

package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

// FR-3.1
@Getter @Setter
public class BookingRequest {
    @NotNull(message = "Vui lòng chọn phòng.")
    private Long roomId;

    @NotNull(message = "Vui lòng chọn giờ bắt đầu.")
    private LocalDateTime startTime;

    @NotNull(message = "Vui lòng chọn giờ kết thúc.")
    private LocalDateTime endTime;

    @Positive(message = "Số người phải lớn hơn 0.")
    private Integer numberOfPeople;

    @Size(max = 500, message = "Mục đích sử dụng không quá 500 ký tự.")
    private String purpose;

    /**
     * Danh sách MSSV thành viên nhóm (để kiểm tra P-MEMBERS, P-CONCURRENT).
     * Khi phòng sức chứa >= 2, bắt buộc nhập đủ MSSV = số người khai báo.
     */
    @NotEmpty(message = "Vui lòng nhập danh sách thành viên nhóm.")
    @Size(max = 50, message = "Quá nhiều thành viên trong nhóm.")
    private List<String> memberCodes;
}

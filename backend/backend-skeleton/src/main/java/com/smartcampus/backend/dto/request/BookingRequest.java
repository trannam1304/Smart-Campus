package com.smartcampus.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
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

    @com.fasterxml.jackson.annotation.JsonSetter("roomId")
    public void setRoomId(Object id) {
        if (id == null) {
            this.roomId = null;
        } else if (id instanceof Number n) {
            this.roomId = n.longValue();
        } else {
            String s = id.toString().replaceFirst("(?i)^ROOM-", "").trim();
            try {
                this.roomId = Long.parseLong(s);
            } catch (Exception e) {
                this.roomId = null;
            }
        }
    }

    @NotNull(message = "Vui lòng chọn giờ bắt đầu.")
    private LocalDateTime startTime;

    @NotNull(message = "Vui lòng chọn giờ kết thúc.")
    private LocalDateTime endTime;

    @Positive(message = "Số người phải lớn hơn 0.")
    @JsonAlias({"occupancy", "participantsCount"})
    private Integer numberOfPeople;

    @Size(max = 500, message = "Mục đích sử dụng không quá 500 ký tự.")
    private String purpose;

    /**
     * Danh sách MSSV thành viên nhóm (để kiểm tra P-MEMBERS, P-CONCURRENT).
     * Khi phòng sức chứa >= 2, bắt buộc nhập đủ MSSV = số người khai báo.
     */
    @NotEmpty(message = "Vui lòng nhập danh sách thành viên nhóm.")
    @Size(max = 50, message = "Quá nhiều thành viên trong nhóm.")
    @JsonAlias({"memberStudentCodes", "studentCodes", "participantIds"})
    private List<String> memberCodes;
}

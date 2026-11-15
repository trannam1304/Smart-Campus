package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

// FR-3.1, FR-5.1
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String bookingId;
    private String roomId;
    private String roomCode;
    private String roomType;
    private String building;
    private Integer floor;
    private String floorCode;
    private String studentId;
    private String studentName;
    private String studentCode;
    private String date;
    private String startTime;
    private String endTime;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Integer numberOfPeople;
    private Integer occupancy;
    private String purpose;
    private String status;
    private String bookingStatus;
    private String qrCode;
    private String qrCodeUrl;
    private String qrCodeData;
    private String checkInTime;
    private Integer checkedInCount;
    private Integer totalMembers;
    private String cancelReason;
    private List<MemberInfo> members;

    public void setStartTime(LocalDateTime dt) {
        this.startDateTime = dt;
        if (dt != null) {
            this.startTime = String.format("%02d:%02d", dt.getHour(), dt.getMinute());
            if (this.date == null) {
                this.date = dt.toLocalDate().toString();
            }
        }
    }

    public void setStartTime(String s) {
        this.startTime = s;
    }

    public void setEndTime(LocalDateTime dt) {
        this.endDateTime = dt;
        if (dt != null) {
            this.endTime = String.format("%02d:%02d", dt.getHour(), dt.getMinute());
        }
    }

    public void setEndTime(String s) {
        this.endTime = s;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberInfo {
        private String studentCode;
        private String studentName;
        private String qrCode;
        private String checkedInAt;
    }
}

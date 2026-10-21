package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity Lượt đặt phòng.
 * Nghiệp vụ liên quan: FR-3.1 (đặt phòng), FR-3.2 (chống trùng lịch), FR-3.3 (hạn mức tuần),
 * FR-5.1/5.2/5.3 (QR check-in, auto-release)
 *
 * <p>Optimistic Locking: trường {@code version} gắn {@code @Version} để JPA tự động
 * kiểm soát phiên bản khi cập nhật. Khi nhiều sinh viên cùng đặt cùng một phòng
 * khung giờ trùng, chỉ một giao dịch thành công, các giao dịch còn lại nhận
 * OptimisticLockException → trả về lỗi xung đột (409).
 * Liên quan: FR-3.2, NFR-03 (ACID).
 */
@Getter
@Setter
@Entity
@Table(name = "bookings")
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer numberOfPeople;

    private String purpose; // Mục đích sử dụng

    /**
     * Phiên bản cho Optimistic Locking (@Version).
     * JPA tăng giá trị này mỗi khi bản ghi được cập nhật.
     */
    @Version
    private Long version;

    private String qrCode; // FR-5.1

    @Enumerated(EnumType.STRING)
    private BookingStatus status; // CONFIRMED / IN_USE / CANCELLED_AUTO / COMPLETED / ...

    @Column(name = "checkin_time")
    private LocalDateTime checkinTime; // Thời gian thực tế quét mã QR check-in (FR-5.2)

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingMember> bookingMembers = new ArrayList<>();

    public enum BookingStatus {
        PENDING_APPROVAL, CONFIRMED, IN_USE, COMPLETED, COMPLETED_FORCE,
        CANCELLED_USER, CANCELLED_AUTO, CANCELLED_ADMIN
    }

    /**
     * Helper: thêm thành viên vào lượt đặt.
     */
    public void addMember(User member) {
        BookingMember bm = new BookingMember();
        bm.setBooking(this);
        bm.setUser(member);
        this.bookingMembers.add(bm);
    }
}

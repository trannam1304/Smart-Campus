package com.smartcampus.backend.entity;

import com.smartcampus.backend.entity.enums.AccountStatus;
import com.smartcampus.backend.entity.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity Sinh viên / Admin-Staff.
 * Nghiệp vụ liên quan: FR-1.1 (Đăng ký), FR-1.2 (Đăng nhập), FR-1.3 (Phân quyền), FR-1.4 (Đổi/khôi phục mật khẩu)
 * TODO (Nhóm 1 - Auth): bổ sung field, validate, quan hệ theo thiết kế ERD.
 */
@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String email; // format @student.edu.vn - FR-1.1

    @Column(name="student_code", unique = true, nullable = false)
    private String studentCode; // MSSV

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String password; // đã mã hoá (BCrypt) - FR-1.1

    private String faculty; // Khoa/Ngành

    private int noShowCount;// số lần không nhận phòng
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT; // STUDENT / ADMIN_STAFF - FR-1.3

    @Enumerated(EnumType.STRING)
    private AccountStatus status = AccountStatus.PENDING; // ACTIVE / LOCKED - FR-1.2

    @OneToMany(mappedBy = "user",  fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Booking> bookings =  new ArrayList<>();

    @OneToMany(mappedBy = "reporter", cascade = CascadeType.ALL,  fetch = FetchType.LAZY)
    private List<IncidentReport> incidentReports =  new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,  fetch = FetchType.LAZY)
    private List<Notification> notifications =  new ArrayList<>();

    public boolean isLibraryTrained() {
        return role == Role.STUDENT;
    }

    public boolean isLocked() {
        return status == AccountStatus.LOCKED;
    }
}

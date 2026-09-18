package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    private String studentCode; // MSSV

    private String fullName;

    private String password; // đã mã hoá (BCrypt) - FR-1.1

    private String faculty; // Khoa/Ngành

    @Enumerated(EnumType.STRING)
    private Role role; // STUDENT / ADMIN_STAFF - FR-1.3

    @Enumerated(EnumType.STRING)
    private AccountStatus status; // ACTIVE / LOCKED - FR-1.2

    public enum Role { STUDENT, ADMIN_STAFF }
    public enum AccountStatus { ACTIVE, LOCKED, PENDING }
}

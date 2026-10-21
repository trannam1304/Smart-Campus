package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity Sinh viên / Admin-Staff.
 * Nghiệp vụ liên quan: FR-1.1 (Đăng ký), FR-1.2 (Đăng nhập), FR-1.3 (Phân quyền), FR-1.4 (Đổi/khôi phục mật khẩu)
 *
 * <p>Trạng thái tài khoản (status):
 * <ul>
 *   <li>PENDING: Đã đăng ký nhưng chưa xác thực email (FR-1.1)</li>
 *   <li>ACTIVE: Đã kích hoạt, có thể đăng nhập và đặt phòng</li>
 *   <li>LOCKED: Bị khóa do sai mật khẩu nhiều lần hoặc kỷ luật no-show (FR-1.2, P-NOSHOW-LOCK)</li>
 * </ul>
 *
 * <p>Xác thực email: verificationToken + verificationTokenExpiresAt dùng để kích hoạt
 * tài khoản từ PENDING sang ACTIVE (FR-1.1, email @student.edu.vn).
 */
@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "email", unique = true, nullable = false)
    private String email; // format @student.edu.vn - FR-1.1

    @Column(name = "student_code")
    private String studentCode; // MSSV

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "password_hash")
    private String password; // đã mã hoá (BCrypt) - FR-1.1

    @Column(name = "department")
    private String faculty; // Khoa/Ngành

    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    private Role role; // STUDENT / ADMIN_STAFF - FR-1.3

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private AccountStatus status; // ACTIVE / LOCKED / PENDING - FR-1.2

    @Column(name = "verification_token")
    private String verificationToken; // mã xác thực email (FR-1.1)

    @Column(name = "verification_token_expires_at")
    private LocalDateTime verificationTokenExpiresAt; // hạn hiệu lực mã xác thực

    public enum Role { STUDENT, ADMIN_STAFF }
    public enum AccountStatus { ACTIVE, LOCKED, PENDING }
}

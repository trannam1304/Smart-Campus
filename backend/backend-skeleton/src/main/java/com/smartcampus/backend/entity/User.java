package com.smartcampus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Entity Sinh viên / Admin-Staff.
 * Nghiệp vụ liên quan: FR-1.1 (Đăng ký), FR-1.2 (Đăng nhập), FR-1.3 (Phân quyền), FR-1.4 (Đổi/khôi phục mật khẩu)
 */
@Getter
@Setter
@Entity
@Table(name = "users")
@AttributeOverride(name = "id", column = @Column(name = "user_id"))
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String email;

    private String studentCode;

    private String fullName;

    private String password;

    private String faculty;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private AccountStatus status;

    @Column(name = "no_show_count")
    private Integer noShowCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    public enum Role { STUDENT, ADMIN, STAFF, ADMIN_STAFF }
    public enum AccountStatus { ACTIVE, LOCKED, PENDING }
}

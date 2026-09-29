-- Flyway migration: V11__seed_admin_staff.sql
-- Source: SQL_migration1(1).sql

-- 6.6 TÀI KHOẢN ADMIN / STAFF MẪU (SAMPLE ADMIN & STAFF ACCOUNTS)
-- Mật khẩu demo: "Admin@2026" - ĐÃ MÃ HÓA BCRYPT (cost=10).
-- CHỈ dùng cho môi trường DEV/DEMO - bắt buộc đổi mật khẩu khi triển khai thật.
-- library_trained=TRUE vì tài khoản quản trị không bị chặn bởi Nội quy Điều 1.d.
-- =====================================================================

INSERT INTO users (
    full_name, student_code, email, password_hash, role,
    department, google_sso_id, status, library_trained, no_show_count, locked_until
) VALUES
('Quản trị hệ thống Smart Campus', NULL, 'admin@smartcampus.tdtu.edu.vn',
 '$2b$10$FRq0S6H/i9irleoazIzb7e2f2xpVbp451n424Pq8lFZ1bThwjId1i',
 'ADMIN', 'Phòng Công nghệ Thông tin', NULL, 'ACTIVE', TRUE, 0, NULL),

('Nguyễn Thị A - Trực Lầu 1-2', NULL, 'staff.tang12@lib.tdtu.edu.vn',
 '$2b$10$SDfG729BfNjPmzAYRjPMtOfBs8b7hHh2swjMlwU0Y2lRjl2JGEoaC',
 'STAFF', 'Thư viện TDTU', NULL, 'ACTIVE', TRUE, 0, NULL),

('Trần Văn B - Trực Lầu 3-5', NULL, 'staff.tang35@lib.tdtu.edu.vn',
 '$2b$10$5P.MgbiGDD12pDFg3ZvAAOj62pAXzBxWtG9tTRiCcaPZxW7qrx216',
 'STAFF', 'Thư viện TDTU', NULL, 'ACTIVE', TRUE, 0, NULL)
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    department = VALUES(department),
    status = VALUES(status),
    library_trained = VALUES(library_trained);

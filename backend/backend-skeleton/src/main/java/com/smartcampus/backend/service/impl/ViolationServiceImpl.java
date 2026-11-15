package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ViolationServiceImpl implements ViolationService {

    private final NamedParameterJdbcTemplate jdbc;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllStudentViolations() {
        String sql = """
                SELECT u.user_id, u.full_name, u.student_code, u.email, u.department, u.status,
                       COALESCE(u.no_show_count, 0) as no_show_count,
                       (SELECT COUNT(*) FROM user_warnings w WHERE w.user_id = u.user_id AND w.status = 'ACTIVE') as warning_count
                FROM users u
                WHERE u.role = 'STUDENT'
                ORDER BY warning_count DESC, u.status ASC, u.user_id DESC
                """;

        List<Map<String, Object>> students = jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", rs.getLong("user_id"));
            map.put("fullName", rs.getString("full_name"));
            map.put("studentCode", rs.getString("student_code"));
            map.put("email", rs.getString("email"));
            map.put("department", rs.getString("department"));
            map.put("status", rs.getString("status"));
            map.put("noShowCount", rs.getInt("no_show_count"));
            map.put("warningCount", rs.getInt("warning_count"));
            return map;
        });

        // Nạp chi tiết các cảnh báo đang hoạt động
        for (Map<String, Object> s : students) {
            Long uid = (Long) s.get("userId");
            List<Map<String, Object>> warnings = jdbc.query(
                    """
                    SELECT warning_id, reason, severity, status, created_at
                    FROM user_warnings
                    WHERE user_id = :uid AND status = 'ACTIVE'
                    ORDER BY created_at DESC
                    """,
                    new MapSqlParameterSource("uid", uid),
                    (wrs, wRowNum) -> {
                        Map<String, Object> w = new HashMap<>();
                        w.put("id", wrs.getLong("warning_id"));
                        w.put("reason", wrs.getString("reason"));
                        w.put("severity", wrs.getString("severity"));
                        w.put("status", wrs.getString("status"));
                        Timestamp cat = wrs.getTimestamp("created_at");
                        w.put("createdAt", cat != null ? cat.toLocalDateTime().toString() : LocalDateTime.now().toString());
                        return w;
                    }
            );
            s.put("warnings", warnings);
        }

        return students;
    }

    @Override
    @Transactional
    public Map<String, Object> warnStudent(Long userId, String studentCode, String reason, String severity, Boolean lockAccount, String adminEmail) {
        Long targetUserId = resolveUserId(userId, studentCode);
        if (targetUserId == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin sinh viên để cảnh báo.");
        }

        Long adminId = resolveAdminId(adminEmail);
        String finalSeverity = (severity != null && !severity.isBlank()) ? severity : "WARNING";

        // Ghi nhận cảnh báo
        jdbc.update(
                """
                INSERT INTO user_warnings (user_id, reason, severity, status, created_by, created_at)
                VALUES (:userId, :reason, :severity, 'ACTIVE', :adminId, NOW())
                """,
                new MapSqlParameterSource()
                        .addValue("userId", targetUserId)
                        .addValue("reason", (reason != null && !reason.isBlank()) ? reason : "Vi phạm quy định sử dụng phòng học / thư viện")
                        .addValue("severity", finalSeverity)
                        .addValue("adminId", adminId)
        );

        // Tăng số lần vi phạm no_show_count
        jdbc.update(
                "UPDATE users SET no_show_count = COALESCE(no_show_count, 0) + 1 WHERE user_id = :userId",
                new MapSqlParameterSource("userId", targetUserId)
        );

        // Đếm số cảnh báo đang hoạt động
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_warnings WHERE user_id = :userId AND status = 'ACTIVE'",
                new MapSqlParameterSource("userId", targetUserId),
                Integer.class
        );
        int activeCount = (count != null) ? count : 1;

        // Nếu admin chọn khóa luôn hoặc có >= 3 cảnh báo hoạt động thì tự động khóa tài khoản
        boolean locked = Boolean.TRUE.equals(lockAccount) || activeCount >= 3;
        if (locked) {
            jdbc.update(
                    "UPDATE users SET status = 'LOCKED' WHERE user_id = :userId",
                    new MapSqlParameterSource("userId", targetUserId)
            );
        }

        Map<String, Object> result = new HashMap<>();
        result.put("userId", targetUserId);
        result.put("warningCount", activeCount);
        result.put("accountStatus", locked ? "LOCKED" : "ACTIVE");
        result.put("message", locked
                ? "Đã cảnh báo sinh viên và khóa tài khoản thành công."
                : "Đã gửi cảnh báo đến sinh viên (" + activeCount + " lần vi phạm).");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> toggleLockAccount(Long userId, String studentCode, String status, String adminEmail) {
        Long targetUserId = resolveUserId(userId, studentCode);
        if (targetUserId == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin tài khoản sinh viên.");
        }

        String targetStatus = ("LOCKED".equalsIgnoreCase(status)) ? "LOCKED" : "ACTIVE";
        jdbc.update(
                "UPDATE users SET status = :status WHERE user_id = :userId",
                new MapSqlParameterSource()
                        .addValue("status", targetStatus)
                        .addValue("userId", targetUserId)
        );

        Map<String, Object> result = new HashMap<>();
        result.put("userId", targetUserId);
        result.put("status", targetStatus);
        result.put("message", "LOCKED".equalsIgnoreCase(targetStatus)
                ? "Đã khóa tài khoản sinh viên thành công."
                : "Đã mở khóa tài khoản sinh viên thành công.");
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllAppeals() {
        String sql = """
                SELECT a.appeal_id, a.user_id, a.warning_id, a.reason, a.status, a.admin_response,
                       a.created_at, a.resolved_at,
                       u.full_name as student_name, u.student_code, u.email,
                       w.reason as warning_reason, w.created_at as warning_date
                FROM user_appeals a
                JOIN users u ON u.user_id = a.user_id
                LEFT JOIN user_warnings w ON w.warning_id = a.warning_id
                ORDER BY CASE WHEN a.status = 'PENDING' THEN 0 ELSE 1 END, a.created_at DESC
                """;

        return jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("appealId", rs.getLong("appeal_id"));
            map.put("id", rs.getLong("appeal_id"));
            map.put("userId", rs.getLong("user_id"));
            map.put("studentName", rs.getString("student_name"));
            map.put("studentCode", rs.getString("student_code"));
            map.put("email", rs.getString("email"));
            map.put("warningId", rs.getObject("warning_id") != null ? rs.getLong("warning_id") : null);
            map.put("warningReason", rs.getString("warning_reason"));
            Timestamp wdate = rs.getTimestamp("warning_date");
            map.put("warningDate", wdate != null ? wdate.toLocalDateTime().toString() : null);
            map.put("reason", rs.getString("reason"));
            map.put("status", rs.getString("status"));
            map.put("adminResponse", rs.getString("admin_response"));

            Timestamp cat = rs.getTimestamp("created_at");
            map.put("createdAt", cat != null ? cat.toLocalDateTime().toString() : LocalDateTime.now().toString());
            Timestamp rat = rs.getTimestamp("resolved_at");
            map.put("resolvedAt", rat != null ? rat.toLocalDateTime().toString() : null);
            return map;
        });
    }

    @Override
    @Transactional
    public Map<String, Object> resolveAppeal(Long appealId, String status, String adminResponse, String adminEmail) {
        Long adminId = resolveAdminId(adminEmail);
        String finalStatus = "APPROVED".equalsIgnoreCase(status) ? "APPROVED" : "REJECTED";

        // Lấy thông tin đơn khiếu nại (dùng HashMap tránh NullPointerException khi warningId null)
        List<Map<String, Object>> appeals = jdbc.query(
                "SELECT user_id, warning_id FROM user_appeals WHERE appeal_id = :id",
                new MapSqlParameterSource("id", appealId),
                (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", rs.getLong("user_id"));
                    map.put("warningId", rs.getObject("warning_id") != null ? rs.getLong("warning_id") : null);
                    return map;
                }
        );

        if (appeals.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy đơn khiếu nại.");
        }

        Map<String, Object> appealInfo = appeals.get(0);
        Long userId = (Long) appealInfo.get("userId");
        Object rawWarningId = appealInfo.get("warningId");

        jdbc.update(
                """
                UPDATE user_appeals
                SET status = :status, admin_response = :adminResponse, resolved_by = :adminId, resolved_at = NOW()
                WHERE appeal_id = :id
                """,
                new MapSqlParameterSource()
                        .addValue("status", finalStatus)
                        .addValue("adminResponse", (adminResponse != null && !adminResponse.isBlank())
                                ? adminResponse
                                : ("Đơn khiếu nại đã được " + ("APPROVED".equals(finalStatus) ? "chấp thuận" : "từ chối")))
                        .addValue("adminId", adminId, java.sql.Types.INTEGER)
                        .addValue("id", appealId)
        );

        // Nếu Chấp thuận -> Xóa/thu hồi cảnh báo tương ứng
        if ("APPROVED".equals(finalStatus)) {
            if (rawWarningId != null) {
                jdbc.update(
                        "UPDATE user_warnings SET status = 'REVOKED', revoked_at = NOW() WHERE warning_id = :wid",
                        new MapSqlParameterSource("wid", ((Number) rawWarningId).longValue())
                );
            } else {
                // Thu hồi cảnh báo gần nhất nếu không chỉ định warningId
                jdbc.update(
                        """
                        UPDATE user_warnings SET status = 'REVOKED', revoked_at = NOW()
                        WHERE user_id = :uid AND status = 'ACTIVE'
                        ORDER BY created_at DESC LIMIT 1
                        """,
                        new MapSqlParameterSource("uid", userId)
                );
            }

            // Giảm số lần vi phạm no_show_count nếu > 0
            jdbc.update(
                    "UPDATE users SET no_show_count = GREATEST(0, COALESCE(no_show_count, 0) - 1) WHERE user_id = :uid",
                    new MapSqlParameterSource("uid", userId)
            );

            // Kiểm tra số cảnh báo ACTIVE còn lại, nếu < 3 và đang bị khóa thì tự động mở khóa
            Integer remaining = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM user_warnings WHERE user_id = :uid AND status = 'ACTIVE'",
                    new MapSqlParameterSource("uid", userId),
                    Integer.class
            );
            if (remaining != null && remaining < 3) {
                jdbc.update(
                        "UPDATE users SET status = 'ACTIVE' WHERE user_id = :uid",
                        new MapSqlParameterSource("uid", userId)
                );
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("appealId", appealId);
        res.put("status", finalStatus);
        res.put("message", "APPROVED".equals(finalStatus)
                ? "Đã chấp thuận khiếu nại và gỡ cảnh báo cho sinh viên thành công."
                : "Đã từ chối khiếu nại của sinh viên.");
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStudentWarnings(String studentUsernameOrEmail) {
        User user = findUserByUsernameOrEmail(studentUsernameOrEmail);
        Long userId = user.getId();

        List<Map<String, Object>> warnings = jdbc.query(
                """
                SELECT warning_id, reason, severity, status, created_at
                FROM user_warnings
                WHERE user_id = :uid AND status = 'ACTIVE'
                ORDER BY created_at DESC
                """,
                new MapSqlParameterSource("uid", userId),
                (rs, rowNum) -> {
                    Map<String, Object> w = new HashMap<>();
                    w.put("id", rs.getLong("warning_id"));
                    w.put("warningId", rs.getLong("warning_id"));
                    w.put("reason", rs.getString("reason"));
                    w.put("severity", rs.getString("severity"));
                    w.put("status", rs.getString("status"));
                    Timestamp cat = rs.getTimestamp("created_at");
                    w.put("createdAt", cat != null ? cat.toLocalDateTime().toString() : LocalDateTime.now().toString());
                    return w;
                }
        );

        List<Map<String, Object>> appeals = jdbc.query(
                """
                SELECT a.appeal_id, a.warning_id, a.reason, a.status, a.admin_response,
                       a.created_at, a.resolved_at,
                       w.reason as warning_reason
                FROM user_appeals a
                LEFT JOIN user_warnings w ON w.warning_id = a.warning_id
                WHERE a.user_id = :uid
                ORDER BY a.created_at DESC
                """,
                new MapSqlParameterSource("uid", userId),
                (rs, rowNum) -> {
                    Map<String, Object> a = new HashMap<>();
                    a.put("appealId", rs.getLong("appeal_id"));
                    a.put("id", rs.getLong("appeal_id"));
                    a.put("warningId", rs.getObject("warning_id") != null ? rs.getLong("warning_id") : null);
                    a.put("warningReason", rs.getString("warning_reason"));
                    a.put("reason", rs.getString("reason"));
                    a.put("status", rs.getString("status"));
                    a.put("adminResponse", rs.getString("admin_response"));
                    Timestamp cat = rs.getTimestamp("created_at");
                    a.put("createdAt", cat != null ? cat.toLocalDateTime().toString() : LocalDateTime.now().toString());
                    Timestamp rat = rs.getTimestamp("resolved_at");
                    a.put("resolvedAt", rat != null ? rat.toLocalDateTime().toString() : null);
                    return a;
                }
        );

        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("studentCode", user.getStudentCode());
        result.put("fullName", user.getFullName());
        result.put("accountStatus", (user.getStatus() != null) ? user.getStatus().name() : "ACTIVE");
        result.put("isLocked", user.getStatus() == User.AccountStatus.LOCKED);
        result.put("warningCount", warnings.size());
        result.put("warnings", warnings);
        result.put("appeals", appeals);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> submitAppeal(Long warningId, String reason, String studentUsernameOrEmail) {
        User user = findUserByUsernameOrEmail(studentUsernameOrEmail);
        Long userId = user.getId();

        if (reason == null || reason.trim().length() < 2) {
            throw new IllegalArgumentException("Vui lòng cung cấp nội dung khiếu nại chi tiết.");
        }

        Long targetWarningId = warningId;
        if (targetWarningId == null || targetWarningId <= 0) {
            List<Long> latest = jdbc.query(
                    "SELECT warning_id FROM user_warnings WHERE user_id = :uid AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1",
                    new MapSqlParameterSource("uid", userId),
                    (rs, rowNum) -> rs.getLong("warning_id")
            );
            if (!latest.isEmpty()) {
                targetWarningId = latest.get(0);
            }
        }

        jdbc.update(
                """
                INSERT INTO user_appeals (user_id, warning_id, reason, status, created_at)
                VALUES (:userId, :warningId, :reason, 'PENDING', NOW())
                """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("warningId", targetWarningId, java.sql.Types.INTEGER)
                        .addValue("reason", reason.trim())
        );

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        long appealId = (lastId != null && lastId > 0) ? lastId : System.currentTimeMillis();

        Map<String, Object> result = new HashMap<>();
        result.put("appealId", appealId);
        result.put("status", "PENDING");
        result.put("message", "Đã gửi đơn khiếu nại thành công. Ban quản lý sẽ sớm xem xét và phản hồi.");
        return result;
    }

    // Helper methods
    private Long resolveUserId(Long userId, String studentCode) {
        if (userId != null && userId > 0) return userId;
        if (studentCode != null && !studentCode.isBlank()) {
            return userRepository.findByStudentCode(studentCode.trim())
                    .map(User::getId)
                    .orElse(null);
        }
        return null;
    }

    private Long resolveAdminId(String adminEmail) {
        if (adminEmail == null || adminEmail.isBlank()) return null;
        return userRepository.findByEmail(adminEmail)
                .map(User::getId)
                .orElse(null);
    }

    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new ResourceNotFoundException("Phiên đăng nhập không hợp lệ.");
        }
        return userRepository.findByEmail(usernameOrEmail)
                .or(() -> userRepository.findByStudentCode(usernameOrEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + usernameOrEmail));
    }
}

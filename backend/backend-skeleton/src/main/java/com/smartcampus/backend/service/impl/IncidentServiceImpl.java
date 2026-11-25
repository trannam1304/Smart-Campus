package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {

    private final NamedParameterJdbcTemplate jdbc;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Map<String, Object> createIncident(String roomCodeOrId, Long equipmentId, String equipmentName, String description, String imageUrl, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .or(() -> userRepository.findByStudentCode(reporterEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người báo cáo."));

        String cleanRoom = (roomCodeOrId != null) ? roomCodeOrId.replace("ROOM-", "").trim() : "";
        String normalizedCode = (roomCodeOrId != null) ? roomCodeOrId.trim() : "";
        if (normalizedCode.toLowerCase().startsWith("r-g0")) {
            normalizedCode = "L.00" + normalizedCode.substring(4);
        } else if (normalizedCode.toLowerCase().startsWith("r-g")) {
            normalizedCode = "L.0" + normalizedCode.substring(3);
        } else if (normalizedCode.toLowerCase().startsWith("r-")) {
            normalizedCode = "L." + normalizedCode.substring(2);
        }

        List<Long> roomIds = jdbc.query(
                "SELECT room_id FROM rooms WHERE room_code = :code OR room_code = :normalizedCode OR room_id = :roomId LIMIT 1",
                new MapSqlParameterSource()
                        .addValue("code", roomCodeOrId)
                        .addValue("normalizedCode", normalizedCode)
                        .addValue("roomId", cleanRoom.matches("\\d+") ? Long.parseLong(cleanRoom) : -1L),
                (rs, rowNum) -> rs.getLong("room_id")
        );
        Long targetRoomId = roomIds.isEmpty() ? null : roomIds.get(0);

        Long resolvedEquipmentId = equipmentId;

        // Kiểm tra equipmentId truyền lên có tồn tại (và khớp đúng phòng nếu đã xác định được phòng)
        if (resolvedEquipmentId != null && resolvedEquipmentId > 0) {
            String eqCheckSql = targetRoomId != null
                    ? "SELECT equipment_id FROM equipment WHERE equipment_id = :id AND room_id = :roomId"
                    : "SELECT equipment_id FROM equipment WHERE equipment_id = :id";
            List<Long> exists = jdbc.query(
                    eqCheckSql,
                    new MapSqlParameterSource()
                            .addValue("id", resolvedEquipmentId)
                            .addValue("roomId", targetRoomId),
                    (rs, rowNum) -> rs.getLong("equipment_id")
            );
            if (exists.isEmpty()) {
                resolvedEquipmentId = null;
            }
        }

        // Nếu chưa có equipmentId hợp lệ, ưu tiên tìm theo tên thiết bị trong đúng phòng đó
        if ((resolvedEquipmentId == null || resolvedEquipmentId <= 0) && targetRoomId != null && equipmentName != null && !equipmentName.isBlank()) {
            String trimmedName = equipmentName.trim();
            List<Long> matchedByName = jdbc.query(
                    """
                    SELECT equipment_id FROM equipment
                    WHERE room_id = :roomId
                      AND (LOWER(equipment_name) = LOWER(:exactName) OR LOWER(equipment_name) LIKE LOWER(:likePattern))
                    ORDER BY CASE WHEN LOWER(equipment_name) = LOWER(:exactName) THEN 0 ELSE 1 END, equipment_id ASC
                    LIMIT 1
                    """,
                    new MapSqlParameterSource()
                            .addValue("roomId", targetRoomId)
                            .addValue("exactName", trimmedName)
                            .addValue("likePattern", "%" + trimmedName + "%"),
                    (rs, rowNum) -> rs.getLong("equipment_id")
            );
            if (!matchedByName.isEmpty()) {
                resolvedEquipmentId = matchedByName.get(0);
            }
        }

        // Fallback: chọn thiết bị đầu tiên của phòng, hoặc thiết bị đầu tiên trong hệ thống
        if (resolvedEquipmentId == null || resolvedEquipmentId <= 0) {
            if (targetRoomId != null) {
                List<Long> foundEqs = jdbc.query(
                        "SELECT equipment_id FROM equipment WHERE room_id = :roomId ORDER BY equipment_id ASC LIMIT 1",
                        new MapSqlParameterSource("roomId", targetRoomId),
                        (rs, rowNum) -> rs.getLong("equipment_id")
                );
                if (!foundEqs.isEmpty()) {
                    resolvedEquipmentId = foundEqs.get(0);
                }
            }

            if (resolvedEquipmentId == null || resolvedEquipmentId <= 0) {
                List<Long> anyEq = jdbc.query("SELECT equipment_id FROM equipment LIMIT 1", (rs, rowNum) -> rs.getLong("equipment_id"));
                if (!anyEq.isEmpty()) {
                    resolvedEquipmentId = anyEq.get(0);
                } else {
                    throw new ResourceNotFoundException("Hệ thống chưa có dữ liệu thiết bị để liên kết báo cáo.");
                }
            }
        }

        jdbc.update(
                "INSERT INTO incident_reports (equipment_id, reporter_id, description, image_url, status, created_at) " +
                "VALUES (:equipmentId, :reporterId, :description, :imageUrl, 'NEW', :createdAt)",
                new MapSqlParameterSource()
                        .addValue("equipmentId", resolvedEquipmentId)
                        .addValue("reporterId", reporter.getId())
                        .addValue("description", description != null ? description : "Sự cố thiết bị")
                        .addValue("imageUrl", imageUrl, java.sql.Types.LONGVARCHAR)
                        .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
        );

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        long reportId = (lastId != null && lastId > 0) ? lastId : System.currentTimeMillis();

        Map<String, Object> result = new HashMap<>();
        result.put("id", String.valueOf(reportId));
        result.put("incidentId", "INC-" + reportId);
        result.put("status", "OPEN");
        result.put("message", "Đã gửi báo cáo sự cố thành công. Ban quản lý sẽ sớm xử lý.");
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllIncidents() {
        String sql = """
                SELECT ir.report_id, ir.equipment_id, ir.reporter_id, ir.description, ir.image_url, ir.status, ir.created_at,
                       e.equipment_name, e.equipment_type,
                       r.room_id, r.room_code,
                       u.full_name, u.student_code, u.email
                FROM incident_reports ir
                LEFT JOIN equipment e ON e.equipment_id = ir.equipment_id
                LEFT JOIN rooms r ON r.room_id = e.room_id
                LEFT JOIN users u ON u.user_id = ir.reporter_id
                ORDER BY ir.created_at DESC
                """;

        return jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> item = new HashMap<>();
            long reportId = rs.getLong("report_id");
            item.put("id", String.valueOf(reportId));
            item.put("reportId", reportId);
            item.put("roomId", rs.getObject("room_id") != null ? "ROOM-" + rs.getLong("room_id") : "");
            item.put("roomCode", rs.getString("room_code") != null ? rs.getString("room_code") : "L.001");
            item.put("deviceName", rs.getString("equipment_name") != null ? rs.getString("equipment_name") : "Thiết bị phòng");
            item.put("equipmentId", rs.getObject("equipment_id") != null ? "EQ-" + rs.getLong("equipment_id") : "");
            item.put("description", rs.getString("description"));
            String rawImageUrl = rs.getString("image_url");
            item.put("imageUrl", resolveReadableImageUrl(rawImageUrl));

            String rawStatus = rs.getString("status");
            String status = ("RESOLVED".equalsIgnoreCase(rawStatus)) ? "RESOLVED" : "OPEN";
            item.put("status", status);

            item.put("reporterName", rs.getString("full_name") != null ? rs.getString("full_name") : "Sinh viên");
            item.put("reporterCode", rs.getString("student_code") != null ? rs.getString("student_code") : "");

            Timestamp createdAt = rs.getTimestamp("created_at");
            item.put("createdAt", createdAt != null ? createdAt.toLocalDateTime().toString() : LocalDateTime.now().toString());
            return item;
        });
    }

    @Override
    @Transactional
    public Map<String, Object> resolveIncident(Long incidentId) {
        jdbc.update(
                "UPDATE incident_reports SET status = 'RESOLVED' WHERE report_id = :id",
                new MapSqlParameterSource("id", incidentId)
        );

        // Đánh dấu thiết bị liên quan về GOOD
        jdbc.update(
                "UPDATE equipment SET status = 'GOOD' WHERE equipment_id = (SELECT equipment_id FROM incident_reports WHERE report_id = :id)",
                new MapSqlParameterSource("id", incidentId)
        );

        Map<String, Object> res = new HashMap<>();
        res.put("id", String.valueOf(incidentId));
        res.put("status", "RESOLVED");
        res.put("message", "Đã đánh dấu sự cố là đã xử lý.");
        return res;
    }

    private String resolveReadableImageUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }
        String trimmed = rawUrl.trim();
        if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
            String relative = trimmed.replaceFirst("^/?uploads/", "");
            java.nio.file.Path p1 = java.nio.file.Paths.get("uploads", relative).toAbsolutePath().normalize();
            java.nio.file.Path p2 = java.nio.file.Paths.get("backend", "backend-skeleton", "uploads", relative).toAbsolutePath().normalize();
            if (!java.nio.file.Files.exists(p1) && !java.nio.file.Files.exists(p2)) {
                return null;
            }
        }
        return trimmed;
    }
}

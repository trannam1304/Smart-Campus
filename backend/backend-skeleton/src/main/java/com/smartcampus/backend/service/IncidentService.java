package com.smartcampus.backend.service;

import java.util.List;
import java.util.Map;

/**
 * Nghiệp vụ quản lý sự cố thiết bị phòng (FR-4.2).
 */
public interface IncidentService {

    /**
     * Báo cáo sự cố phòng/thiết bị mới.
     */
    Map<String, Object> createIncident(String roomCodeOrId, Long equipmentId, String description, String imageUrl, String reporterEmail);

    /**
     * Lấy danh sách toàn bộ sự cố phòng/thiết bị.
     */
    List<Map<String, Object>> getAllIncidents();

    /**
     * Đánh dấu sự cố đã được khắc phục/sửa xong.
     */
    Map<String, Object> resolveIncident(Long incidentId);
}

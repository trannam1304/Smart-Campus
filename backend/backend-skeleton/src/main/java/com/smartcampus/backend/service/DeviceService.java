package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.IncidentReportRequest;
import com.smartcampus.backend.dto.request.EquipmentRequest;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ApiResponse;
import java.util.List;

/**
 * Nghiệp vụ nhóm Device (Thiết bị phần cứng).
 * Liên quan: FR-4.1 (danh mục thiết bị), FR-4.2 (báo cáo sự cố), FR-4.3 (tự động loại bỏ phòng lỗi)
 *
 * <p>Shell controller stub — triển khai chi tiết sau này.
 */
public interface DeviceService {

    // FR-4.1: Hiển thị chi tiết danh mục thiết bị phần cứng của một phòng
    List<EquipmentResponse> getEquipmentsByRoom(Long roomId);

    // FR-4.2: Gửi báo cáo phản ánh sự cố thiết bị hư hỏng
    ApiResponse<Void> reportIncident(IncidentReportRequest request);

    // FR-4.3: Lấy danh sách phòng có thiết bị hoạt động tốt (loại trừ phòng hỏng)
    List<com.smartcampus.backend.dto.response.RoomResponse> getAvailableRoomsByEquipment();
}

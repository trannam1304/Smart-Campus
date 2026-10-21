package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.IncidentReportRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.RoomResponse;
import com.smartcampus.backend.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API endpoints nhóm Device (Thiết bị phần cứng).
 * Liên quan: FR-4.1, FR-4.2, FR-4.3
 *
 * <p>Shell controller — các endpoint có khai báo mapping nhưng thân method
 * đang ném UnsupportedOperationException (chưa triển khai nghiệp vụ).
 */
@RestController
@RequestMapping("/api/device")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    // ------------------------------------------------------------------
    // FR-4.1: Hiển thị chi tiết danh mục thiết bị phần cứng của phòng
    // GET /api/device/rooms/{roomId}
    // ------------------------------------------------------------------
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getEquipmentsByRoom(
            @PathVariable Long roomId) {
        throw new UnsupportedOperationException("FR-4.1 chưa triển khai.");
    }

    // ------------------------------------------------------------------
    // FR-4.2: Gửi báo cáo phản ánh sự cố thiết bị hư hỏng
    // POST /api/device/incident
    // Body: IncidentReportRequest
    // ------------------------------------------------------------------
    @PostMapping("/incident")
    public ResponseEntity<ApiResponse<Void>> reportIncident(
            @RequestBody IncidentReportRequest request) {
        throw new UnsupportedOperationException("FR-4.2 chưa triển khai.");
    }

    // ------------------------------------------------------------------
    // FR-4.3: Lấy danh sách phòng có thiết bị hoạt động tốt
    // GET /api/device/rooms-available
    // ------------------------------------------------------------------
    @GetMapping("/rooms-available")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAvailableRoomsByEquipment() {
        throw new UnsupportedOperationException("FR-4.3 chưa triển khai.");
    }
}

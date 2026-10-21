package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.IncidentReportRequest;
import com.smartcampus.backend.dto.request.EquipmentRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.RoomResponse;
import com.smartcampus.backend.service.DeviceService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Triển khai nghiệp vụ nhóm Device. Liên quan: FR-4.1, FR-4.2, FR-4.3
 * Shell stub — triển khai chi tiết sau này.
 */
@Service
public class DeviceServiceImpl implements DeviceService {

    @Override
    public List<EquipmentResponse> getEquipmentsByRoom(Long roomId) {
        throw new UnsupportedOperationException("FR-4.1 chưa triển khai.");
    }

    @Override
    public ApiResponse<Void> reportIncident(IncidentReportRequest request) {
        throw new UnsupportedOperationException("FR-4.2 chưa triển khai.");
    }

    @Override
    public List<RoomResponse> getAvailableRoomsByEquipment() {
        throw new UnsupportedOperationException("FR-4.3 chưa triển khai.");
    }
}

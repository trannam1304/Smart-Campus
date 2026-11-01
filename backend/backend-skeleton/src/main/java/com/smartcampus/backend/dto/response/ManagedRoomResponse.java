package com.smartcampus.backend.dto.response;

import java.util.List;

public record ManagedRoomResponse(
        String roomId,
        String roomCode,
        Long buildingId,
        String buildingName,
        Integer floorNumber,
        Integer capacity,
        String status,
        String roomTypeCode,
        List<EquipmentResponse> equipments
) {
}

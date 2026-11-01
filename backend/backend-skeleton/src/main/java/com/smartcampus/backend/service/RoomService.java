package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.BuildingRequest;
import com.smartcampus.backend.dto.request.EquipmentRequest;
import com.smartcampus.backend.dto.request.RoomUpsertRequest;
import com.smartcampus.backend.dto.response.BuildingResponse;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ManagedRoomResponse;

import java.util.List;

/**
 * Nghiệp vụ quản lý phòng, tòa nhà và thiết bị gắn với phòng.
 */
public interface RoomService {
    List<ManagedRoomResponse> getRooms(int page, int limit);

    long countRooms();

    ManagedRoomResponse getRoom(String roomId);

    ManagedRoomResponse createRoom(RoomUpsertRequest request);

    ManagedRoomResponse updateRoom(String roomId, RoomUpsertRequest request);

    void deleteRoom(String roomId);

    List<BuildingResponse> getBuildings();

    BuildingResponse createBuilding(BuildingRequest request);

    BuildingResponse updateBuilding(long buildingId, BuildingRequest request);

    void deleteBuilding(long buildingId);

    List<EquipmentResponse> getRoomEquipments(String roomId);

    EquipmentResponse createEquipment(String roomId, EquipmentRequest request);

    EquipmentResponse updateEquipment(String equipmentId, EquipmentRequest request);

    void deleteEquipment(String equipmentId);
}

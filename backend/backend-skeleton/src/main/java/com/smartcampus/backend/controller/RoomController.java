package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.BuildingRequest;
import com.smartcampus.backend.dto.request.EquipmentRequest;
import com.smartcampus.backend.dto.request.RoomUpsertRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.BuildingResponse;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ManagedRoomResponse;
import com.smartcampus.backend.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Validated
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/rooms")
    public ApiResponse<List<ManagedRoomResponse>> getRooms(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit) {
        List<ManagedRoomResponse> rooms = roomService.getRooms(page, limit);
        long totalElements = roomService.countRooms();
        int totalPages = (int) Math.ceil((double) totalElements / limit);
        return ApiResponse.paginated(rooms, new ApiResponse.Pagination(page, limit, totalElements, totalPages));
    }

    @GetMapping("/rooms/{roomId}")
    public ApiResponse<ManagedRoomResponse> getRoom(@PathVariable String roomId) {
        return ApiResponse.ok(roomService.getRoom(roomId));
    }

    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<ManagedRoomResponse>> createRoom(
            @Valid @RequestBody RoomUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(roomService.createRoom(request)));
    }

    @PutMapping("/rooms/{roomId}")
    public ApiResponse<ManagedRoomResponse> updateRoom(
            @PathVariable String roomId, @Valid @RequestBody RoomUpsertRequest request) {
        return ApiResponse.ok(roomService.updateRoom(roomId, request));
    }

    @DeleteMapping("/rooms/{roomId}")
    public ApiResponse<Void> deleteRoom(@PathVariable String roomId) {
        roomService.deleteRoom(roomId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/buildings")
    public ApiResponse<List<BuildingResponse>> getBuildings() {
        return ApiResponse.ok(roomService.getBuildings());
    }

    @PostMapping("/buildings")
    public ResponseEntity<ApiResponse<BuildingResponse>> createBuilding(
            @Valid @RequestBody BuildingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(roomService.createBuilding(request)));
    }

    @PutMapping("/buildings/{buildingId}")
    public ApiResponse<BuildingResponse> updateBuilding(
            @PathVariable @Min(1) long buildingId, @Valid @RequestBody BuildingRequest request) {
        return ApiResponse.ok(roomService.updateBuilding(buildingId, request));
    }

    @DeleteMapping("/buildings/{buildingId}")
    public ApiResponse<Void> deleteBuilding(@PathVariable @Min(1) long buildingId) {
        roomService.deleteBuilding(buildingId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/rooms/{roomId}/equipments")
    public ApiResponse<List<EquipmentResponse>> getRoomEquipments(@PathVariable String roomId) {
        return ApiResponse.ok(roomService.getRoomEquipments(roomId));
    }

    @PostMapping("/rooms/{roomId}/equipments")
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @PathVariable String roomId, @Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(roomService.createEquipment(roomId, request)));
    }

    @PutMapping("/equipments/{equipmentId}")
    public ApiResponse<EquipmentResponse> updateEquipment(
            @PathVariable String equipmentId, @Valid @RequestBody EquipmentRequest request) {
        return ApiResponse.ok(roomService.updateEquipment(equipmentId, request));
    }

    @DeleteMapping("/equipments/{equipmentId}")
    public ApiResponse<Void> deleteEquipment(@PathVariable String equipmentId) {
        roomService.deleteEquipment(equipmentId);
        return ApiResponse.ok(null);
    }
}

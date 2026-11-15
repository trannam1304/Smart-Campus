package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.BuildingRequest;
import com.smartcampus.backend.dto.request.EquipmentRequest;
import com.smartcampus.backend.dto.request.RoomUpsertRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.dto.response.BuildingResponse;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ManagedRoomResponse;
import com.smartcampus.backend.entity.Booking;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping({"/api/v1", "/api"})
@RequiredArgsConstructor
@Validated
public class RoomController {

    private final RoomService roomService;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final com.smartcampus.backend.service.CheckinService checkinService;

    @GetMapping({"/rooms/{roomId}/bookings", "/rooms/{roomId}/bookings/range"})
    public ApiResponse<List<BookingResponse>> getRoomBookings(
            @PathVariable String roomId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        Long parsedRoomId = null;
        try {
            parsedRoomId = Long.parseLong(roomId.replaceAll("[^0-9]", ""));
        } catch (Exception ignored) {}

        if (parsedRoomId == null) {
            return ApiResponse.ok(List.of());
        }

        List<BookingResponse> bookings = bookingService.getRoomBookings(parsedRoomId, date, startDate, endDate);
        return ApiResponse.ok(bookings);
    }

    @GetMapping("/rooms")
    public ApiResponse<List<ManagedRoomResponse>> getRooms(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(200) int limit) {
        List<ManagedRoomResponse> rooms = roomService.getRooms(page, limit);
        long totalElements = roomService.countRooms();
        int totalPages = (int) Math.ceil((double) totalElements / limit);
        return ApiResponse.paginated(rooms, new ApiResponse.Pagination(page, limit, totalElements, totalPages));
    }

    @GetMapping("/floors/{floorId}/map")
    @Transactional
    public ApiResponse<Map<String, Object>> getFloorMap(
            @PathVariable String floorId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String time,
            Authentication authentication) {
        checkinService.autoReleaseExpiredBookings();
        List<ManagedRoomResponse> allRooms = roomService.getRooms(1, 100);
        int floorNum = 0;
        try {
            floorNum = Integer.parseInt(floorId.replaceAll("[^0-9]", ""));
        } catch (Exception ignored) {}
        final int targetFloor = floorNum;
        List<ManagedRoomResponse> floorRooms = allRooms.stream()
                .filter(r -> r.floorNumber() != null && r.floorNumber() == targetFloor)
                .toList();

        // Xác định người dùng hiện tại nếu có đăng nhập
        Long currentUserId = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (currentUser != null) {
                currentUserId = currentUser.getId();
            }
        }

        // Xác định mốc thời gian truy vấn
        LocalDateTime targetDateTime = null;
        if (date != null && !date.isBlank() && time != null && !time.isBlank()) {
            try {
                LocalDate d = LocalDate.parse(date.trim());
                LocalTime t = LocalTime.parse(time.trim());
                targetDateTime = LocalDateTime.of(d, t);
            } catch (Exception ignored) {}
        }
        if (targetDateTime == null) {
            targetDateTime = LocalDateTime.now();
        }

        final LocalDateTime queryTime = targetDateTime;
        final Long myUserId = currentUserId;

        List<Booking.BookingStatus> activeStatuses = List.of(
                Booking.BookingStatus.CONFIRMED,
                Booking.BookingStatus.IN_USE,
                Booking.BookingStatus.PENDING_APPROVAL
        );

        List<ManagedRoomResponse> mappedRooms = new ArrayList<>();
        for (ManagedRoomResponse r : floorRooms) {
            String calculatedStatus = r.status(); // Giữ nguyên nếu là MAINTENANCE

            if (!"MAINTENANCE".equalsIgnoreCase(calculatedStatus)) {
                Long roomId = null;
                try {
                    roomId = Long.parseLong(r.roomId().replaceAll("[^0-9]", ""));
                } catch (Exception ignored) {}

                if (roomId != null) {
                    List<Booking> conflicts = bookingRepository.findConflictingBookings(
                            roomId, queryTime, queryTime.plusMinutes(1), activeStatuses);

                    if (!conflicts.isEmpty()) {
                        Booking activeBooking = conflicts.get(0);
                        boolean isMyBooking = false;
                        if (myUserId != null) {
                            if (activeBooking.getUser() != null && activeBooking.getUser().getId().equals(myUserId)) {
                                isMyBooking = true;
                            } else if (activeBooking.getBookingMembers() != null) {
                                isMyBooking = activeBooking.getBookingMembers().stream()
                                        .anyMatch(bm -> bm.getUser() != null && bm.getUser().getId().equals(myUserId));
                            }
                        }
                        calculatedStatus = isMyBooking ? "SELF_BOOKED" : "BOOKED";
                    } else {
                        calculatedStatus = "AVAILABLE";
                    }
                }
            }

            mappedRooms.add(new ManagedRoomResponse(
                    r.roomId(),
                    r.roomCode(),
                    r.buildingId(),
                    r.buildingName(),
                    r.floorNumber(),
                    r.capacity(),
                    calculatedStatus,
                    r.roomTypeCode(),
                    r.equipments()
            ));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("floorNumber", targetFloor);
        result.put("rooms", mappedRooms);
        return ApiResponse.ok(result);
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

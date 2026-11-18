package com.smartcampus.backend;

import com.smartcampus.backend.dto.request.RoomUpsertRequest;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ManagedRoomResponse;
import com.smartcampus.backend.controller.RoomController;
import com.smartcampus.backend.exception.GlobalExceptionHandler;
import com.smartcampus.backend.security.JwtAuthFilter;
import com.smartcampus.backend.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RoomController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @MockBean
    private com.smartcampus.backend.service.BookingService bookingService;

    @MockBean
    private com.smartcampus.backend.repository.BookingRepository bookingRepository;

    @MockBean
    private com.smartcampus.backend.repository.UserRepository userRepository;

    @MockBean
    private com.smartcampus.backend.service.CheckinService checkinService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    @DisplayName("[FR-2.1] Tạo phòng và trả về cấu trúc Response Contract chuẩn")
    void createRoomReturnsContractEnvelopeAndCreatedStatus() throws Exception {
        ManagedRoomResponse room = new ManagedRoomResponse("ROOM-1", "A3.01", 1L, "Tòa A",
                3, 8, "AVAILABLE", "GROUP",
                List.of(new EquipmentResponse("EQ-1", "Máy chiếu", "PROJECTOR", "GOOD")));
        when(roomService.createRoom(any(RoomUpsertRequest.class))).thenReturn(room);

        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "roomCode": "A3.01",
                                  "buildingId": 1,
                                  "floorNumber": 3,
                                  "roomTypeCode": "GROUP",
                                  "capacity": 8,
                                  "status": "AVAILABLE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.data.roomId").value("ROOM-1"))
                .andExpect(jsonPath("$.data.equipments[0].id").value("EQ-1"));
    }

    @Test
    @DisplayName("[FR-2.3 - Exception Flow] Từ chối tạo phòng khi sức chứa capacity <= 0 (Validation 400)")
    void createRoomRejectsInvalidCapacity() throws Exception {
        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "roomCode": "A3.01",
                                  "buildingId": 1,
                                  "floorNumber": 3,
                                  "roomTypeCode": "GROUP",
                                  "capacity": 0,
                                  "status": "AVAILABLE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.errorCode").value("ERR_VALIDATION"));

        verify(roomService, never()).createRoom(any(RoomUpsertRequest.class));
    }

    @Test
    @DisplayName("[FR-2.1 & FR-2.3] Tra cứu danh sách phòng học có phân trang (Pagination Envelope)")
    void listRoomsReturnsPaginationInContractEnvelope() throws Exception {
        when(roomService.getRooms(1, 10)).thenReturn(List.of());
        when(roomService.countRooms()).thenReturn(0L);

        mockMvc.perform(get("/api/v1/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.pagination.page").value(1))
                .andExpect(jsonPath("$.pagination.limit").value(10))
                .andExpect(jsonPath("$.pagination.totalElements").value(0));
    }

    @Test
    @DisplayName("[FR-2.1] Xem chi tiết thông tin phòng học theo mã phòng")
    void getRoomReturnsDetailInContractEnvelope() throws Exception {
        ManagedRoomResponse room = new ManagedRoomResponse("ROOM-1", "A3.01", 1L, "Tòa A",
                3, 8, "AVAILABLE", "GROUP", List.of());
        when(roomService.getRoom("ROOM-1")).thenReturn(room);

        mockMvc.perform(get("/api/v1/rooms/ROOM-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.roomId").value("ROOM-1"))
                .andExpect(jsonPath("$.data.roomCode").value("A3.01"));
    }

    @Test
    @DisplayName("[FR-2.1] Xóa phòng học thành công")
    void deleteRoomReturnsSuccess() throws Exception {
        doNothing().when(roomService).deleteRoom("ROOM-1");

        mockMvc.perform(delete("/api/v1/rooms/ROOM-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200));

        verify(roomService).deleteRoom("ROOM-1");
    }

    @Test
    @DisplayName("[FR-2.2] Lấy danh mục tòa nhà phục vụ sơ đồ mặt bằng tầng (Visual Floor Map)")
    void listBuildingsReturnsSuccess() throws Exception {
        when(roomService.getBuildings()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/buildings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("[FR-4.1] Hiển thị danh mục thiết bị phần cứng trong phòng học")
    void listRoomEquipmentsReturnsSuccess() throws Exception {
        when(roomService.getRoomEquipments("ROOM-1")).thenReturn(List.of(
                new EquipmentResponse("EQ-1", "Máy chiếu Sony", "PROJECTOR", "GOOD")));

        mockMvc.perform(get("/api/v1/rooms/ROOM-1/equipments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].id").value("EQ-1"))
                .andExpect(jsonPath("$.data[0].name").value("Máy chiếu Sony"));
    }
}

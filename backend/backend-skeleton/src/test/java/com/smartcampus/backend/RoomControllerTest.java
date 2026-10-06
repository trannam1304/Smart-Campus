package com.smartcampus.backend;

import com.smartcampus.backend.dto.request.RoomUpsertRequest;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ManagedRoomResponse;
import com.smartcampus.backend.controller.RoomController;
import com.smartcampus.backend.exception.GlobalExceptionHandler;
import com.smartcampus.backend.service.RoomService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Test
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
}

package com.smartcampus.backend.controller;

import com.smartcampus.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API endpoints nhóm Room. Liên quan: FR-2.1, FR-2.2, FR-2.3, FR-2.4
 * TODO: bổ sung endpoint (GET/POST/PUT...) tương ứng Đầu vào/Đầu ra trong SRS.
 */
@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

}

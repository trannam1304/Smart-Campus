package com.smartcampus.backend.controller;

import com.smartcampus.backend.service.CheckinService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API endpoints nhóm Checkin. Liên quan: FR-5.1, FR-5.2, FR-5.3
 * TODO: bổ sung endpoint (GET/POST/PUT...) tương ứng Đầu vào/Đầu ra trong SRS.
 */
@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

}

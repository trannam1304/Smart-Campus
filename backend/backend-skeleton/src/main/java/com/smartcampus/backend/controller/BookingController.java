package com.smartcampus.backend.controller;

import com.smartcampus.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API endpoints nhóm Booking. Liên quan: FR-3.1, FR-3.2, FR-3.3
 * TODO: bổ sung endpoint (GET/POST/PUT...) tương ứng Đầu vào/Đầu ra trong SRS.
 */
@RestController
@RequestMapping("/api/booking")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

}

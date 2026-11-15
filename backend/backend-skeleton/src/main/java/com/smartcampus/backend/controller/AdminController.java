package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.RejectBookingRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.dto.response.BookingResponse;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
@RequiredArgsConstructor
public class AdminController {

    private final BookingService bookingService;
    private final IncidentService incidentService;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    // ------------------------------------------------------------------
    // GET /api/admin/dashboard: Bảng điều khiển Quản trị viên
    // ------------------------------------------------------------------
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardData() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        List<Map<String, Object>> incidents = incidentService.getAllIncidents();

        long pendingApprovals = bookings.stream()
                .filter(b -> "PENDING_APPROVAL".equalsIgnoreCase(b.getStatus()))
                .count();

        long openIncidents = incidents.stream()
                .filter(i -> "OPEN".equalsIgnoreCase(String.valueOf(i.get("status"))))
                .count();

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalBookings", bookings.size());
        kpis.put("pendingApprovals", pendingApprovals);
        kpis.put("openIncidents", openIncidents);
        kpis.put("utilizationRate", 0);

        Map<String, Object> data = new HashMap<>();
        data.put("bookings", bookings);
        data.put("incidents", incidents);
        data.put("kpis", kpis);
        data.put("hourlyStats", List.of());

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ------------------------------------------------------------------
    // GET /api/admin/bookings
    // ------------------------------------------------------------------
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getAllBookings()));
    }

    // ------------------------------------------------------------------
    // PUT /api/admin/bookings/{id}/approve
    // ------------------------------------------------------------------
    @PutMapping("/bookings/{id}/approve")
    public ResponseEntity<ApiResponse<BookingResponse>> approveBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        return ResponseEntity.ok(ApiResponse.ok(bookingService.approveBooking(id, adminEmail)));
    }

    // ------------------------------------------------------------------
    // PUT /api/admin/bookings/{id}/reject
    // ------------------------------------------------------------------
    @PutMapping("/bookings/{id}/reject")
    public ResponseEntity<ApiResponse<BookingResponse>> rejectBooking(
            @PathVariable Long id,
            @RequestBody(required = false) RejectBookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        String reason = request != null && request.getReason() != null ? request.getReason() : "Từ chối bởi Quản trị viên";
        return ResponseEntity.ok(ApiResponse.ok(bookingService.rejectBooking(id, reason, adminEmail)));
    }

    // ------------------------------------------------------------------
    // GET /api/admin/incidents
    // ------------------------------------------------------------------
    @GetMapping("/incidents")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllIncidents() {
        return ResponseEntity.ok(ApiResponse.ok(incidentService.getAllIncidents()));
    }

    // ------------------------------------------------------------------
    // PUT /api/admin/incidents/{id}/resolve
    // ------------------------------------------------------------------
    @PutMapping("/incidents/{id}/resolve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveIncident(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(incidentService.resolveIncident(id)));
    }

    // ------------------------------------------------------------------
    // PUT /api/admin/rooms/{roomId}/status
    // ------------------------------------------------------------------
    @PutMapping("/rooms/{roomId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateRoomStatus(
            @PathVariable String roomId,
            @RequestBody(required = false) Map<String, Object> body) {

        String status = (body != null && body.get("status") != null) ? String.valueOf(body.get("status")) : "AVAILABLE";
        String reason = (body != null && body.get("reason") != null) ? String.valueOf(body.get("reason")) : "";

        Long id = null;
        if (roomId.startsWith("ROOM-")) {
            try {
                id = Long.parseLong(roomId.substring(5));
            } catch (Exception ignored) {}
        } else {
            try {
                id = Long.parseLong(roomId);
            } catch (Exception ignored) {}
        }

        if (id != null) {
            jdbcTemplate.update("UPDATE rooms SET base_status = :status WHERE room_id = :id",
                    Map.of("status", status, "id", id));
        } else {
            jdbcTemplate.update("UPDATE rooms SET base_status = :status WHERE room_code = :code",
                    Map.of("status", status, "code", roomId));
        }

        if ("MAINTENANCE".equalsIgnoreCase(status) && id != null) {
            jdbcTemplate.update(
                    "UPDATE bookings SET status = 'CANCELLED_ADMIN', updated_at = NOW() " +
                    "WHERE room_id = :id AND status IN ('PENDING_APPROVAL', 'CONFIRMED')",
                    Map.of("id", id));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("roomId", roomId);
        result.put("status", status);
        result.put("message", "MAINTENANCE".equalsIgnoreCase(status)
                ? "Đã chuyển phòng sang trạng thái bảo trì."
                : "Đã khôi phục phòng về trạng thái hoạt động.");

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

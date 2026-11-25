package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.CreateIncidentRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/incidents", "/api/incidents"})
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    // ------------------------------------------------------------------
    // POST /api/incidents: Hỗ trợ JSON
    // ------------------------------------------------------------------
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportIncidentJson(
            @RequestBody CreateIncidentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String roomId = request != null && request.getRoomCode() != null && !request.getRoomCode().isBlank()
                ? request.getRoomCode()
                : (request != null && request.getRoomId() != null ? request.getRoomId() : "");
        Long equipmentId = null;
        if (request != null && request.getEquipmentId() != null) {
            try {
                equipmentId = Long.parseLong(request.getEquipmentId().replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {}
        }
        String equipmentName = request != null ? request.getEquipmentName() : null;
        String description = request != null && request.getDescription() != null ? request.getDescription() : "Sự cố thiết bị";
        String rawImageUrl = request != null ? request.getImageUrl() : null;
        String imageUrl = saveImage(null, rawImageUrl);
        String reporterEmail = userDetails != null ? userDetails.getUsername() : "admin@smartcampus.tdtu.edu.vn";

        Map<String, Object> result = incidentService.createIncident(roomId, equipmentId, equipmentName, description, imageUrl, reporterEmail);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    // ------------------------------------------------------------------
    // POST /api/incidents: Hỗ trợ multipart/form-data (upload file ảnh)
    // ------------------------------------------------------------------
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportIncidentMultipart(
            @RequestParam("roomId") String roomId,
            @RequestParam(value = "roomCode", required = false) String roomCode,
            @RequestParam(value = "equipmentId", required = false) String equipmentIdStr,
            @RequestParam(value = "equipmentName", required = false) String equipmentName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "imageUrl", required = false) String base64ImageUrl,
            @AuthenticationPrincipal UserDetails userDetails) {

        String effectiveRoom = (roomCode != null && !roomCode.isBlank()) ? roomCode : roomId;
        Long equipmentId = null;
        if (equipmentIdStr != null && !equipmentIdStr.isEmpty()) {
            try {
                equipmentId = Long.parseLong(equipmentIdStr.replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {}
        }

        String imageUrl = saveImage(image, base64ImageUrl);
        String reporterEmail = userDetails != null ? userDetails.getUsername() : "admin@smartcampus.tdtu.edu.vn";
        Map<String, Object> result = incidentService.createIncident(effectiveRoom, equipmentId, equipmentName, description != null ? description : "Sự cố thiết bị", imageUrl, reporterEmail);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    private String saveImage(MultipartFile file, String base64Data) {
        try {
            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    String originalFilename = file.getOriginalFilename();
                    String ext = "jpeg";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
                        if ("jpg".equals(ext)) ext = "jpeg";
                    }
                    contentType = "image/" + ext;
                }
                String base64 = Base64.getEncoder().encodeToString(file.getBytes());
                return "data:" + contentType + ";base64," + base64;
            }

            if (base64Data != null && !base64Data.isBlank()) {
                String trimmed = base64Data.trim();
                if (trimmed.startsWith("data:") || trimmed.startsWith("http://")
                        || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/")) {
                    return trimmed;
                }
                if (trimmed.startsWith("iVBOR")) {
                    return "data:image/png;base64," + trimmed;
                }
                if (trimmed.startsWith("UklGR")) {
                    return "data:image/webp;base64," + trimmed;
                }
                return "data:image/jpeg;base64," + trimmed;
            }
        } catch (Exception ex) {
            org.slf4j.LoggerFactory.getLogger(IncidentController.class).warn("Không thể xử lý ảnh sự cố: " + ex.getMessage(), ex);
        }
        return null;
    }

    // ------------------------------------------------------------------
    // GET /api/incidents: Danh sách sự cố
    // ------------------------------------------------------------------
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllIncidents() {
        List<Map<String, Object>> list = incidentService.getAllIncidents();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    // ------------------------------------------------------------------
    // PUT /api/incidents/{id}/resolve: Giải quyết sự cố
    // ------------------------------------------------------------------
    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveIncident(@PathVariable Long id) {
        Map<String, Object> result = incidentService.resolveIncident(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

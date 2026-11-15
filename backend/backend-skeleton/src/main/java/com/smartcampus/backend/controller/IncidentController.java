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

        String roomId = request != null && request.getRoomId() != null ? request.getRoomId() : "";
        Long equipmentId = null;
        if (request != null && request.getEquipmentId() != null) {
            try {
                equipmentId = Long.parseLong(request.getEquipmentId().replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {}
        }
        String description = request != null && request.getDescription() != null ? request.getDescription() : "Sự cố thiết bị";
        String rawImageUrl = request != null ? request.getImageUrl() : null;
        String imageUrl = saveImage(null, rawImageUrl);
        String reporterEmail = userDetails != null ? userDetails.getUsername() : "admin@smartcampus.tdtu.edu.vn";

        Map<String, Object> result = incidentService.createIncident(roomId, equipmentId, description, imageUrl, reporterEmail);
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
        Map<String, Object> result = incidentService.createIncident(effectiveRoom, equipmentId, description != null ? description : "Sự cố thiết bị", imageUrl, reporterEmail);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    private String saveImage(MultipartFile file, String base64Data) {
        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads", "incidents").toAbsolutePath().normalize();
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            if (file != null && !file.isEmpty()) {
                String originalFilename = file.getOriginalFilename();
                String ext = "jpg";
                if (originalFilename != null && originalFilename.contains(".")) {
                    ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
                }
                String filename = "inc_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + "." + ext;
                java.nio.file.Path target = uploadDir.resolve(filename);
                java.nio.file.Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                return "/uploads/incidents/" + filename;
            }

            if (base64Data != null && !base64Data.isBlank()) {
                if (base64Data.startsWith("http://") || base64Data.startsWith("https://") || base64Data.startsWith("/uploads/")) {
                    return base64Data;
                }
                String cleanBase64 = base64Data;
                String ext = "jpg";
                if (base64Data.contains(",")) {
                    String[] parts = base64Data.split(",", 2);
                    String header = parts[0];
                    cleanBase64 = parts[1];
                    if (header.contains("png")) ext = "png";
                    else if (header.contains("jpeg") || header.contains("jpg")) ext = "jpg";
                    else if (header.contains("webp")) ext = "webp";
                }
                byte[] bytes = Base64.getDecoder().decode(cleanBase64.trim());
                String filename = "inc_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + "." + ext;
                java.nio.file.Path target = uploadDir.resolve(filename);
                java.nio.file.Files.write(target, bytes);
                return "/uploads/incidents/" + filename;
            }
        } catch (Exception ex) {
            org.slf4j.LoggerFactory.getLogger(IncidentController.class).warn("Không thể lưu ảnh sự cố: " + ex.getMessage(), ex);
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

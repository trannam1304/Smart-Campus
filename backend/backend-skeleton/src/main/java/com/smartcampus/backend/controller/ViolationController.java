package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.request.AppealRequest;
import com.smartcampus.backend.dto.request.LockUserRequest;
import com.smartcampus.backend.dto.request.ResolveAppealRequest;
import com.smartcampus.backend.dto.request.WarnUserRequest;
import com.smartcampus.backend.dto.response.ApiResponse;
import com.smartcampus.backend.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationService violationService;

    // ==================================================================
    // ADMIN ENDPOINTS
    // ==================================================================

    @GetMapping({"/api/v1/admin/violations", "/api/admin/violations"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudentViolations() {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getAllStudentViolations()));
    }

    @PostMapping({"/api/v1/admin/violations/warn", "/api/admin/violations/warn"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> warnStudent(
            @RequestBody WarnUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = (userDetails != null) ? userDetails.getUsername() : "";
        Long userId = (request != null) ? request.getUserId() : null;
        String studentCode = (request != null) ? request.getStudentCode() : null;
        String reason = (request != null) ? request.getReason() : "";
        String severity = (request != null) ? request.getSeverity() : "WARNING";
        Boolean lockAccount = (request != null) ? request.getLockAccount() : Boolean.FALSE;

        Map<String, Object> result = violationService.warnStudent(userId, studentCode, reason, severity, lockAccount, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping({"/api/v1/admin/violations/lock", "/api/admin/violations/lock"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleLock(
            @RequestBody LockUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = (userDetails != null) ? userDetails.getUsername() : "";
        Long userId = (request != null) ? request.getUserId() : null;
        String studentCode = (request != null) ? request.getStudentCode() : null;
        String status = (request != null) ? request.getStatus() : "LOCKED";

        Map<String, Object> result = violationService.toggleLockAccount(userId, studentCode, status, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping({"/api/v1/admin/appeals", "/api/admin/appeals"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllAppeals() {
        return ResponseEntity.ok(ApiResponse.ok(violationService.getAllAppeals()));
    }

    @PutMapping({"/api/v1/admin/appeals/{id}/resolve", "/api/admin/appeals/{id}/resolve"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveAppeal(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveAppealRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String adminEmail = (userDetails != null) ? userDetails.getUsername() : "";
        String status = (request != null && request.getStatus() != null) ? request.getStatus() : "APPROVED";
        String adminResponse = (request != null) ? request.getAdminResponse() : null;

        Map<String, Object> result = violationService.resolveAppeal(id, status, adminResponse, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ==================================================================
    // STUDENT ENDPOINTS
    // ==================================================================

    @GetMapping({"/api/v1/student/warnings", "/api/student/warnings"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentWarnings(
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = (userDetails != null) ? userDetails.getUsername() : "";
        return ResponseEntity.ok(ApiResponse.ok(violationService.getStudentWarnings(username)));
    }

    @PostMapping({"/api/v1/student/appeals", "/api/student/appeals"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAppeal(
            @RequestBody AppealRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = (userDetails != null) ? userDetails.getUsername() : "";
        Long warningId = (request != null) ? request.getWarningId() : null;
        String reason = (request != null) ? request.getReason() : "";

        Map<String, Object> result = violationService.submitAppeal(warningId, reason, username);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}

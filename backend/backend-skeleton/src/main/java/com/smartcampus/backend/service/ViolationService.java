package com.smartcampus.backend.service;

import java.util.List;
import java.util.Map;

public interface ViolationService {

    // Admin APIs
    List<Map<String, Object>> getAllStudentViolations();

    Map<String, Object> warnStudent(Long userId, String studentCode, String reason, String severity, Boolean lockAccount, String adminEmail);

    Map<String, Object> toggleLockAccount(Long userId, String studentCode, String status, String adminEmail);

    List<Map<String, Object>> getAllAppeals();

    Map<String, Object> resolveAppeal(Long appealId, String status, String adminResponse, String adminEmail);

    // Student APIs
    Map<String, Object> getStudentWarnings(String studentUsernameOrEmail);

    Map<String, Object> submitAppeal(Long warningId, String reason, String studentUsernameOrEmail);
}

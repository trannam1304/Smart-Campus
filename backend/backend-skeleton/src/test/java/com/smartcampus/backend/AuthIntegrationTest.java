package com.smartcampus.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration Test (Kiểm thử tích hợp) tuân thủ Đặc tả SRS chuẩn ISO/IEC/IEEE 29148:
 * - Nhóm 1: Xác thực & Phân quyền (FR-1.1, FR-1.2, FR-1.3)
 * - Nhóm NFR: An toàn thông tin & Toàn vẹn dữ liệu (NFR-03)
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // =========================================================================
    // FR-1.1: ĐĂNG KÝ TÀI KHOẢN SINH VIÊN
    // =========================================================================

    @Test
    @DisplayName("[FR-1.1 - Exception Flow] Đăng ký thất bại khi email không thuộc miền @student.edu.vn")
    void registerRejectsNonStudentEmailDomain() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Nguyen Van Test");
        req.setStudentCode("52109991");
        req.setEmail("test_invalid@gmail.com");
        req.setPassword("StudentPass@123");
        req.setFaculty("CNTT");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ERR_VALIDATION"));
    }

    @Test
    @DisplayName("[FR-1.1 - Normal Flow] Đăng ký tài khoản sinh viên hợp lệ với email @student.edu.vn thành công")
    void registerSucceedsWithValidStudentEmail() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6);
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Sinh Vien ISO Test");
        req.setStudentCode("SV" + randomSuffix);
        req.setEmail("sv." + randomSuffix + "@student.edu.vn");
        req.setPassword("StudentPass@123");
        req.setFaculty("Cong Nghe Thong Tin");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(201));
    }

    // =========================================================================
    // FR-1.2: ĐĂNG NHẬP ĐA PHƯƠNG THỨC & NFR-03: BẢO MẬT PHIÊN JWT
    // =========================================================================

    @Test
    @DisplayName("[FR-1.2 - Exception Flow] Đăng nhập thất bại khi để trống username (Validation)")
    void loginFailsWhenUsernameIsBlank() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("");
        req.setPassword("SomePassword123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ERR_VALIDATION"));
    }

    @Test
    @DisplayName("[FR-1.2 - Exception Flow] Đăng nhập thất bại khi sai mật khẩu (Báo lỗi Conflict 409)")
    void loginFailsWithWrongPassword() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin@smartcampus.tdtu.edu.vn");
        req.setPassword("MatKhauHoanToanSai123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ERR_CONFLICT"));
    }

    @Test
    @DisplayName("[FR-1.2 & NFR-03 - Normal Flow] Đăng nhập thành công với tài khoản Admin và sinh JWT Token (200 OK)")
    void loginSuccessWithValidAdminCredentials() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin@smartcampus.tdtu.edu.vn");
        req.setPassword("Admin@2026");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    // =========================================================================
    // FR-1.3: PHÂN QUYỀN TỰ ĐỘNG & NFR-03: AN TOÀN TRUY CẬP
    // =========================================================================

    @Test
    @DisplayName("[FR-1.3 & NFR-03 - Exception Flow] Truy cập API quản trị (/api/admin/incidents) không có Token bị từ chối 401 Unauthorized")
    void accessingSecuredEndpointWithoutTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/admin/incidents")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @DisplayName("[FR-1.3 & NFR-03 - Normal Flow] Đăng nhập lấy JWT Token rồi dùng Token truy cập API quản trị thành công (Full Integration)")
    void loginAndAccessProtectedEndpointWithTokenSucceeds() throws Exception {
        // Bước 1: Login để lấy Bearer Token
        LoginRequest req = new LoginRequest();
        req.setUsername("admin@smartcampus.tdtu.edu.vn");
        req.setPassword("Admin@2026");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String jwtToken = jsonNode.path("data").path("token").asText();

        // Bước 2: Dùng Bearer Token gửi kèm Header để gọi API bảo mật /api/admin/incidents
        mockMvc.perform(get("/api/admin/incidents")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // Tự động rollback dữ liệu DB sau khi test xong
class AuthAndBookingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void completeFlow_LoginAndBookRoom_Success() throws Exception {
        // ==========================================
        // BƯỚC 1: ĐĂNG NHẬP ĐỂ LẤY JWT TOKEN (FR-1.2)
        // ==========================================
        String loginPayload = "{\"email\":\"student@student.tdtu.edu.vn\", \"password\":\"password123\"}";

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        // Trích xuất JWT Token từ chuỗi JSON trả về
        String responseContent = loginResult.getResponse().getContentAsString();
        JsonNode rootNode = objectMapper.readTree(responseContent);
        String jwtToken = rootNode.path("data").path("accessToken").asText();

        // ==========================================
        // BƯỚC 2: DÙNG TOKEN ĐỂ ĐẶT PHÒNG (FR-3.1)
        // ==========================================
        String bookingPayload = "{" +
                "\"roomId\": 1," +
                "\"startTime\": \"2026-10-02T08:00:00\"," +
                "\"endTime\": \"2026-10-02T10:00:00\"," +
                "\"purpose\": \"Thảo luận nhóm CNPM\"," +
                "\"numberOfPeople\": 5" +
                "}";

        mockMvc.perform(post("/api/booking")
                        .header("Authorization", "Bearer " + jwtToken) // Bơm token vào Header
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.qrCode").exists());
    }
}
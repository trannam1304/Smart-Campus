package com.smartcampus.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional //tu dong rollback du lieu
public class AuthControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private RegisterRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new RegisterRequest();
        validRequest.setStudentCode("52400210");
        validRequest.setPassword("123456");
        validRequest.setEmail("52400210@student.tdtu.edu.vn");
        validRequest.setFullName("Phan Cao Thuy Linh");
        validRequest.setFaculty("Information Technology");
    }

    //1. kiem thu dang ki
    @Nested
    @DisplayName("Test API register")
    class Register {
        @Test
        @DisplayName("Đăng ký thành công với Email trường hợp lệ (@student.edu.vn)")
        void testRegister() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated())
                    .andExpect((ResultMatcher) jsonPath("$.success", true))
                    .andExpect((ResultMatcher) jsonPath("$.code", 201))
                    .andExpect((ResultMatcher) jsonPath("$.message", "Đăng ký thành công"));

            //Kiem tra DB
            assertTrue(userRepository.existsByEmail(validRequest.getEmail()));
        }

        @Test
        @DisplayName("Đăng ký thất bại khi Email không đúng đuôi @student.edu.vn")
        void testRegister_InvalidEmailDomain_ShouldReturn400() throws Exception {
            validRequest.setEmail("52400210@gmail.com");
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status().isBadRequest());

            // Dam bao khong co user bi luu vao db
            assertFalse(userRepository.existsByEmail("52400210@gmail.com"));
        }

        @Test
        @DisplayName("Đăng ký thất bại khi Email bị trùng lập")
        void testRegister_DuplicateEmail_ShouldReturnError() throws Exception {
            //Dang ky lan 1
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest)))
                    .andExpect(status(), isCreated());
        }
    }

    private boolean isCreated() {

    }
}

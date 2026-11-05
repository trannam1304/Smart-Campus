package com.smartcampus.backend;

import com.smartcampus.backend.controller.NotificationController;
import com.smartcampus.backend.entity.Notification;
import com.smartcampus.backend.exception.GlobalExceptionHandler;
import com.smartcampus.backend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @Test
    void sendTestEmailInvokesServiceAndReturnsOk() throws Exception {
        doNothing().when(notificationService).sendTestEmail("test@smartcampus.edu.vn", "CONFIRMATION");

        mockMvc.perform(post("/api/notifications/test-email")
                        .param("email", "test@smartcampus.edu.vn")
                        .param("type", "CONFIRMATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").exists());

        verify(notificationService, times(1)).sendTestEmail("test@smartcampus.edu.vn", "CONFIRMATION");
    }

    @Test
    void getUserNotificationsReturnsOk() throws Exception {
        Notification noti = new Notification();
        noti.setId(1L);
        noti.setTitle("Test Title");

        when(notificationService.getNotificationsByUserId(10L)).thenReturn(List.of(noti));

        mockMvc.perform(get("/api/notifications/user/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1));
    }
}


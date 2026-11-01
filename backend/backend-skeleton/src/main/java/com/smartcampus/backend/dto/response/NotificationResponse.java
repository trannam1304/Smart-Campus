package com.smartcampus.backend.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// FR-6.1, FR-6.2, FR-6.3
@Getter @Setter
public class NotificationResponse {
    private Long id;
    private String title;
    private String content;
    private String type;
    private boolean isRead;
    private LocalDateTime createdAt;
}

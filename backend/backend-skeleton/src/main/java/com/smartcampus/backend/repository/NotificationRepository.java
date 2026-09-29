package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// FR-6.1, FR-6.2, FR-6.3
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
}

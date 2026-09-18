package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// FR-1.1, FR-1.2, FR-1.4
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByStudentCode(String studentCode);
}

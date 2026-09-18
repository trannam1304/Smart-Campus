package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.HardwareResource;
import org.springframework.data.jpa.repository.JpaRepository;

// FR-4.1, FR-4.3
public interface HardwareResourceRepository extends JpaRepository<HardwareResource, Long> {
}

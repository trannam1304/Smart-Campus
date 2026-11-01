package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;

// FR-4.2
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
}

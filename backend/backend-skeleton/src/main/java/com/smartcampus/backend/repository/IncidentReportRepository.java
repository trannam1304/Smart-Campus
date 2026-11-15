package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// FR-4.2
@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {

    List<IncidentReport> findAllByOrderByCreatedAtDesc();
}

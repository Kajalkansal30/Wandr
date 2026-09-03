package com.wandr.repo;

import com.wandr.domain.PlaceReport;
import com.wandr.domain.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceReportRepository extends JpaRepository<PlaceReport, Long> {
  List<PlaceReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);
  long countByStatus(ReportStatus status);
}

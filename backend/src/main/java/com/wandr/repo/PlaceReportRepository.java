package com.wandr.repo;

import com.wandr.domain.PlaceReport;
import com.wandr.domain.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceReportRepository extends JpaRepository<PlaceReport, Long> {
  List<PlaceReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);
  long countByStatus(ReportStatus status);

  @org.springframework.data.jpa.repository.Modifying
  @org.springframework.data.jpa.repository.Query("DELETE FROM PlaceReport r WHERE r.userId = :userId")
  int deleteByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}

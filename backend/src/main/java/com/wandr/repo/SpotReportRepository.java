package com.wandr.repo;

import com.wandr.domain.SpotReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpotReportRepository extends JpaRepository<SpotReport, Long> {

  @org.springframework.data.jpa.repository.Modifying
  @org.springframework.data.jpa.repository.Query("DELETE FROM SpotReport r WHERE r.userId = :userId")
  int deleteByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}

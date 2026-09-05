package com.wandr.repo;

import com.wandr.domain.SpotReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpotReportRepository extends JpaRepository<SpotReport, Long> {
}

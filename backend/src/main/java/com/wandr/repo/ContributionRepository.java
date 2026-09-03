package com.wandr.repo;

import com.wandr.domain.Contribution;
import com.wandr.domain.ContributionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {
  List<Contribution> findByPlaceIdOrderByCreatedAtDesc(Long placeId);
  long countByPlaceIdAndType(Long placeId, ContributionType type);
}

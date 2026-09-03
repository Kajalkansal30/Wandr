package com.wandr.repo;

import com.wandr.domain.ModerationAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModerationActionRepository extends JpaRepository<ModerationAction, Long> {
  List<ModerationAction> findTop50ByOrderByCreatedAtDesc();
  List<ModerationAction> findByPlaceIdOrderByCreatedAtDesc(Long placeId);
}

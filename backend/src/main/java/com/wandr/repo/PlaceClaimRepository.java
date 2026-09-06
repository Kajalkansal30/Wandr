package com.wandr.repo;

import com.wandr.domain.ClaimStatus;
import com.wandr.domain.PlaceClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlaceClaimRepository extends JpaRepository<PlaceClaim, Long> {
  List<PlaceClaim> findByStatusOrderByCreatedAtDesc(ClaimStatus status);
  List<PlaceClaim> findByPlaceIdOrderByCreatedAtDesc(Long placeId);
  List<PlaceClaim> findByUserIdOrderByCreatedAtDesc(Long userId);
  Optional<PlaceClaim> findFirstByPlaceIdAndUserIdAndStatus(Long placeId, Long userId, ClaimStatus status);
  long countByStatus(ClaimStatus status);

  @org.springframework.data.jpa.repository.Modifying
  @org.springframework.data.jpa.repository.Query("DELETE FROM PlaceClaim c WHERE c.userId = :userId")
  int deleteByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}

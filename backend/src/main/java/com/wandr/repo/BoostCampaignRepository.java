package com.wandr.repo;

import com.wandr.domain.BoostCampaign;
import com.wandr.domain.BoostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BoostCampaignRepository extends JpaRepository<BoostCampaign, Long> {

  List<BoostCampaign> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

  List<BoostCampaign> findByPlaceIdOrderByCreatedAtDesc(Long placeId);

  @Query("""
      SELECT b FROM BoostCampaign b
      WHERE b.status = :status AND b.endsAt > :now
      ORDER BY b.createdAt DESC
      """)
  List<BoostCampaign> findActive(@Param("status") BoostStatus status, @Param("now") Instant now);

  @Query("""
      SELECT b FROM BoostCampaign b
      WHERE b.placeId = :placeId AND b.status = :status AND b.endsAt > :now
      ORDER BY b.createdAt DESC
      """)
  List<BoostCampaign> findActiveForPlace(
      @Param("placeId") Long placeId,
      @Param("status") BoostStatus status,
      @Param("now") Instant now
  );

  List<BoostCampaign> findByStatus(BoostStatus status);

  Optional<BoostCampaign> findByIdAndOwnerId(Long id, Long ownerId);
}

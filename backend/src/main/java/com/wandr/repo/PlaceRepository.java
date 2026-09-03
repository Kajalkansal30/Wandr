package com.wandr.repo;

import com.wandr.domain.OwnershipStatus;
import com.wandr.domain.Place;
import com.wandr.domain.PlaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {
  List<Place> findByStatusOrderByCreatedAtDesc(PlaceStatus status);
  List<Place> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
  List<Place> findByOwnershipStatusOrderByCreatedAtDesc(OwnershipStatus ownershipStatus);
  boolean existsByNameIgnoreCase(String name);
  Optional<Place> findByNameIgnoreCase(String name);
  long countByStatus(PlaceStatus status);
  long countByOwnershipStatus(OwnershipStatus ownershipStatus);
}

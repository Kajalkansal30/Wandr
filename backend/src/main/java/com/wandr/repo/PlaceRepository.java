package com.wandr.repo;

import com.wandr.domain.OwnershipStatus;
import com.wandr.domain.Place;
import com.wandr.domain.PlaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {
  @Query("""
      SELECT DISTINCT p FROM Place p
      LEFT JOIN FETCH p.owner
      WHERE p.status = :status
      ORDER BY p.createdAt DESC
      """)
  List<Place> findByStatusWithOwner(@Param("status") PlaceStatus status);

  List<Place> findByStatusOrderByCreatedAtDesc(PlaceStatus status);

  @Query("""
      SELECT DISTINCT p FROM Place p
      LEFT JOIN FETCH p.owner
      WHERE p.owner.id = :ownerId
      ORDER BY p.createdAt DESC
      """)
  List<Place> findByOwnerIdWithOwner(@Param("ownerId") Long ownerId);

  List<Place> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
  List<Place> findByOwnershipStatusOrderByCreatedAtDesc(OwnershipStatus ownershipStatus);
  @Query("""
      SELECT p FROM Place p
      LEFT JOIN FETCH p.owner
      WHERE p.id = :id
      """)
  Optional<Place> findByIdWithOwner(@Param("id") Long id);

  boolean existsByNameIgnoreCase(String name);
  Optional<Place> findByNameIgnoreCase(String name);
  long countByStatus(PlaceStatus status);
  long countByOwnershipStatus(OwnershipStatus ownershipStatus);
}

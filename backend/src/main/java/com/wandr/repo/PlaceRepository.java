package com.wandr.repo;

import com.wandr.domain.OwnershipStatus;
import com.wandr.domain.Place;
import com.wandr.domain.PlaceStatus;
import com.wandr.domain.OperatingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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

  org.springframework.data.domain.Page<Place> findByOwnerIdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

  List<Place> findByOwnershipStatusOrderByCreatedAtDesc(OwnershipStatus ownershipStatus);

  @Query("""
      SELECT p FROM Place p
      LEFT JOIN FETCH p.owner
      WHERE p.id = :id
      """)
  Optional<Place> findByIdWithOwner(@Param("id") Long id);

  @Query("""
      SELECT DISTINCT p FROM Place p
      LEFT JOIN FETCH p.owner
      WHERE p.id IN :ids
      """)
  List<Place> findByIdInWithOwner(@Param("ids") Collection<Long> ids);

  @Query("""
      SELECT p FROM Place p
      WHERE p.status = :status
        AND (p.operatingStatus IS NULL OR p.operatingStatus <> :closed)
        AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
        AND (
          :search IS NULL OR :search = ''
          OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
          OR LOWER(COALESCE(p.city, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
          OR LOWER(COALESCE(p.address, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
        )
      """)
  Page<Place> findDiscoverable(
      @Param("status") PlaceStatus status,
      @Param("closed") OperatingStatus closed,
      @Param("category") String category,
      @Param("search") String search,
      Pageable pageable
  );

  List<Place> findByStatusInOrderByCreatedAtDesc(Collection<PlaceStatus> statuses);

  boolean existsByNameIgnoreCase(String name);
  Optional<Place> findByNameIgnoreCase(String name);
  long countByStatus(PlaceStatus status);
  long countByOwnershipStatus(OwnershipStatus ownershipStatus);
}

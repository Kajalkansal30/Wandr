package com.wandr.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.wandr.domain.Place;

import java.util.List;

/**
 * Geo discovery helpers. Uses SQL haversine (works without PostGIS).
 * When PostGIS is enabled (see V3 migration), prefer ST_DWithin in a follow-up.
 */
public interface PlaceGeoRepository extends JpaRepository<Place, Long> {

  @Query(value = """
      SELECT p.id FROM places p
      WHERE p.status = 'APPROVED'
        AND (p.operating_status IS NULL OR p.operating_status <> 'PERMANENTLY_CLOSED')
        AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
        AND (
          :search IS NULL OR CAST(:search AS text) = ''
          OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
          OR LOWER(COALESCE(p.city, '')) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
        )
        AND p.lat IS NOT NULL AND p.lng IS NOT NULL
        AND (
          :radiusKm IS NULL OR (
            (6371 * acos(LEAST(1.0, GREATEST(-1.0,
              cos(radians(:lat)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(:lng))
              + sin(radians(:lat)) * sin(radians(p.lat))
            )))) <= :radiusKm
          )
        )
      ORDER BY
        (6371 * acos(LEAST(1.0, GREATEST(-1.0,
          cos(radians(:lat)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(:lng))
          + sin(radians(:lat)) * sin(radians(p.lat))
        )))) ASC
      LIMIT :limit OFFSET :offset
      """, nativeQuery = true)
  List<Long> findNearbyIds(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radiusKm") Double radiusKm,
      @Param("category") String category,
      @Param("search") String search,
      @Param("limit") int limit,
      @Param("offset") int offset
  );

  @Query(value = """
      SELECT COUNT(*) FROM places p
      WHERE p.status = 'APPROVED'
        AND (p.operating_status IS NULL OR p.operating_status <> 'PERMANENTLY_CLOSED')
        AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
        AND (
          :search IS NULL OR CAST(:search AS text) = ''
          OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
          OR LOWER(COALESCE(p.city, '')) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
        )
        AND p.lat IS NOT NULL AND p.lng IS NOT NULL
        AND (
          :radiusKm IS NULL OR (
            (6371 * acos(LEAST(1.0, GREATEST(-1.0,
              cos(radians(:lat)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(:lng))
              + sin(radians(:lat)) * sin(radians(p.lat))
            )))) <= :radiusKm
          )
        )
      """, nativeQuery = true)
  long countNearby(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radiusKm") Double radiusKm,
      @Param("category") String category,
      @Param("search") String search
  );
}

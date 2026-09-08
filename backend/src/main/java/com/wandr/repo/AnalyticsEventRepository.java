package com.wandr.repo;

import com.wandr.domain.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

  @Query("""
      SELECT e.eventType, COUNT(e) FROM AnalyticsEvent e
      WHERE e.placeId IN :placeIds AND e.createdAt >= :from
      GROUP BY e.eventType
      """)
  List<Object[]> countByType(
      @Param("placeIds") Collection<Long> placeIds,
      @Param("from") Instant from
  );

  @Query("""
      SELECT e.placeId, e.eventType, COUNT(e) FROM AnalyticsEvent e
      WHERE e.placeId IN :placeIds AND e.createdAt >= :from
      GROUP BY e.placeId, e.eventType
      """)
  List<Object[]> countByPlaceAndType(
      @Param("placeIds") Collection<Long> placeIds,
      @Param("from") Instant from
  );

  @Query("""
      SELECT COALESCE(e.source, 'unknown'), COUNT(e) FROM AnalyticsEvent e
      WHERE e.placeId IN :placeIds AND e.createdAt >= :from
        AND e.eventType = 'place_view'
      GROUP BY COALESCE(e.source, 'unknown')
      """)
  List<Object[]> countPlaceViewsBySource(
      @Param("placeIds") Collection<Long> placeIds,
      @Param("from") Instant from
  );

  @Query(value = """
      SELECT CAST(created_at AS date) AS day, event_type, COUNT(*) AS cnt
      FROM analytics_events
      WHERE place_id IN (:placeIds) AND created_at >= :from
      GROUP BY CAST(created_at AS date), event_type
      ORDER BY day
      """, nativeQuery = true)
  List<Object[]> countDailyByType(
      @Param("placeIds") Collection<Long> placeIds,
      @Param("from") Instant from
  );

  @Query("""
      SELECT e.eventType, COUNT(e) FROM AnalyticsEvent e
      WHERE e.createdAt >= :from
      GROUP BY e.eventType
      ORDER BY COUNT(e) DESC
      """)
  List<Object[]> countAllByTypeSince(@Param("from") Instant from);

  @Query("""
      SELECT COUNT(DISTINCT e.userId) FROM AnalyticsEvent e
      WHERE e.createdAt >= :from AND e.userId IS NOT NULL
        AND e.eventType IN ('login', 'signup')
      """)
  long countDistinctAuthUsersSince(@Param("from") Instant from);

  @Query("""
      SELECT COUNT(e) FROM AnalyticsEvent e
      WHERE e.createdAt >= :from AND e.eventType = :type
      """)
  long countByTypeSince(@Param("type") String type, @Param("from") Instant from);

  @Query("""
      SELECT e FROM AnalyticsEvent e
      WHERE e.eventType IN :types
      ORDER BY e.createdAt DESC
      """)
  List<AnalyticsEvent> findRecentByTypes(
      @Param("types") Collection<String> types,
      org.springframework.data.domain.Pageable pageable
  );

  @Query("""
      SELECT e FROM AnalyticsEvent e
      ORDER BY e.createdAt DESC
      """)
  List<AnalyticsEvent> findRecent(org.springframework.data.domain.Pageable pageable);

  @Query(value = """
      SELECT CAST(created_at AS date) AS day, event_type, COUNT(*) AS cnt
      FROM analytics_events
      WHERE created_at >= :from
        AND event_type IN ('login', 'signup')
      GROUP BY CAST(created_at AS date), event_type
      ORDER BY day
      """, nativeQuery = true)
  List<Object[]> countDailyAuthSince(@Param("from") Instant from);

  @org.springframework.data.jpa.repository.Modifying
  @Query("UPDATE AnalyticsEvent e SET e.userId = null WHERE e.userId = :userId")
  int clearUserId(@Param("userId") Long userId);
}

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
}

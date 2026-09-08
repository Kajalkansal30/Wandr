package com.wandr.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsDtos {

  public record TrackRequest(
      String eventType,
      Long placeId,
      String source,
      String sessionId,
      String device,
      String metadata
  ) {}

  public record FunnelStep(String key, String label, long count) {}

  public record SourceShare(String source, long count, double pct) {}

  public record DailyPoint(String date, Map<String, Long> counts) {}

  public record PlaceBreakdown(
      Long placeId,
      String name,
      Map<String, Long> totals
  ) {}

  public record OwnerAnalyticsResponse(
      int days,
      Map<String, Long> totals,
      List<FunnelStep> funnel,
      List<SourceShare> bySource,
      List<DailyPoint> daily,
      List<PlaceBreakdown> places
  ) {}

  public record CountByType(String eventType, long count) {}

  public record ActivityRow(
      Long id,
      String eventType,
      Long userId,
      String email,
      String displayName,
      String source,
      String device,
      String createdAt
  ) {}

  public record UserRow(
      Long id,
      String email,
      String displayName,
      String role,
      boolean emailVerified,
      String createdAt
  ) {}

  public record AdminActivityResponse(
      int days,
      Map<String, Long> totals,
      List<CountByType> byType,
      List<ActivityRow> recentAuth,
      List<ActivityRow> recentEvents,
      List<UserRow> recentUsers,
      List<DailyPoint> daily
  ) {}
}

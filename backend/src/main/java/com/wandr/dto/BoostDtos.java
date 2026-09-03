package com.wandr.dto;

import com.wandr.domain.BoostCampaign;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class BoostDtos {

  public record CreateRequest(
      Long placeId,
      Integer targetRadiusKm,
      List<String> audiences,
      Integer budgetInr,
      Integer durationDays,
      String headline
  ) {}

  public record CampaignResponse(
      Long id,
      Long placeId,
      String placeName,
      Integer targetRadiusKm,
      List<String> audiences,
      Integer budgetInr,
      Integer durationDays,
      String headline,
      String status,
      Instant startsAt,
      Instant endsAt,
      Long impressions,
      Long profileVisits,
      Long directionClicks,
      Instant createdAt
  ) {
    public static CampaignResponse from(BoostCampaign c, String placeName) {
      return new CampaignResponse(
          c.getId(),
          c.getPlaceId(),
          placeName,
          c.getTargetRadiusKm(),
          split(c.getAudiences()),
          c.getBudgetInr(),
          c.getDurationDays(),
          c.getHeadline(),
          c.getStatus() != null ? c.getStatus().name() : null,
          c.getStartsAt(),
          c.getEndsAt(),
          c.getImpressions() == null ? 0L : c.getImpressions(),
          c.getProfileVisits() == null ? 0L : c.getProfileVisits(),
          c.getDirectionClicks() == null ? 0L : c.getDirectionClicks(),
          c.getCreatedAt()
      );
    }

    private static List<String> split(String csv) {
      if (csv == null || csv.isBlank()) return List.of();
      return Arrays.stream(csv.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .toList();
    }
  }
}

package com.wandr.dto;

import java.time.Instant;
import java.util.Map;

public class CommunityDtos {

  public record ConfirmRequest(Map<String, Boolean> checks) {}

  public record ReportRequest(String reason, String note) {}

  public record ContributionResponse(
      Long id,
      Long placeId,
      String type,
      String status,
      String payload,
      Instant createdAt
  ) {}
}

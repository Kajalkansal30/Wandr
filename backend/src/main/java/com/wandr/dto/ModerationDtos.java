package com.wandr.dto;

import com.wandr.domain.ModerationAction;

import java.time.Instant;
import java.util.List;

public class ModerationDtos {

  public record DecisionRequest(
      String note,
      List<String> reasons
  ) {}

  public record ActionResponse(
      Long id,
      Long placeId,
      Long claimId,
      Long adminId,
      String action,
      String reasons,
      String note,
      Instant createdAt
  ) {
    public static ActionResponse from(ModerationAction a) {
      return new ActionResponse(
          a.getId(),
          a.getPlaceId(),
          a.getClaimId(),
          a.getAdminId(),
          a.getAction() != null ? a.getAction().name() : null,
          a.getReasons(),
          a.getNote(),
          a.getCreatedAt()
      );
    }
  }
}

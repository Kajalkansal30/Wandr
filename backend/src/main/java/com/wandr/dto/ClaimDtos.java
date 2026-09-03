package com.wandr.dto;

import com.wandr.domain.PlaceClaim;

import java.time.Instant;

public class ClaimDtos {

  public record CreateClaimRequest(
      String phone,
      String evidence,
      Boolean verificationRequest
  ) {}

  public record ClaimResponse(
      Long id,
      Long placeId,
      String placeName,
      Long userId,
      String status,
      String phone,
      String evidence,
      String needsInfoReasons,
      String adminNote,
      Boolean verificationRequest,
      Instant createdAt,
      Instant resolvedAt
  ) {
    public static ClaimResponse from(PlaceClaim c, String placeName) {
      return new ClaimResponse(
          c.getId(),
          c.getPlaceId(),
          placeName,
          c.getUserId(),
          c.getStatus() != null ? c.getStatus().name() : null,
          c.getPhone(),
          c.getEvidence(),
          c.getNeedsInfoReasons(),
          c.getAdminNote(),
          Boolean.TRUE.equals(c.getVerificationRequest()),
          c.getCreatedAt(),
          c.getResolvedAt()
      );
    }
  }
}

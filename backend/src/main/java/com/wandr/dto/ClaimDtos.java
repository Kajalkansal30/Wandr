package com.wandr.dto;

import com.wandr.domain.PlaceClaim;

import java.time.Instant;
import java.util.List;

public class ClaimDtos {

  public record CreateClaimRequest(
      String phone,
      String evidence,
      Boolean verificationRequest,
      String requestedRole,
      String claimKind,
      String businessModel,
      String businessSize
  ) {
    public CreateClaimRequest {
      // allow partial JSON from older clients
    }

    /** Back-compat helper used by OwnerController. */
    public CreateClaimRequest(String phone, String evidence, Boolean verificationRequest) {
      this(phone, evidence, verificationRequest, null, null, null, null);
    }
  }

  public record StartPhoneOtpRequest(Long claimId) {}

  public record VerifyOtpRequest(Long claimId, String code) {}

  public record StartBusinessEmailRequest(Long claimId, String email) {}

  public record VerifyBusinessEmailRequest(Long claimId, String token) {}

  public record StartDomainRequest(Long claimId) {}

  public record SubmitMediaEvidenceRequest(Long claimId, String url, String note) {}

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
      String requestedRole,
      String claimKind,
      Integer riskScore,
      Integer verificationScore,
      String verificationMethod,
      String verificationLevel,
      String decision,
      String riskReasons,
      Instant createdAt,
      Instant resolvedAt,
      List<EvidenceResponse> evidenceItems,
      String message,
      String domainTxtRecord,
      String domainHost,
      Boolean autoApproved
  ) {
    public static ClaimResponse from(PlaceClaim c, String placeName) {
      return from(c, placeName, List.of(), null, null, null, null);
    }

    public static ClaimResponse from(
        PlaceClaim c,
        String placeName,
        List<EvidenceResponse> evidenceItems,
        String message,
        String domainTxtRecord,
        String domainHost,
        Boolean autoApproved
    ) {
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
          c.getRequestedRole() != null ? c.getRequestedRole().name() : null,
          c.getClaimKind() != null ? c.getClaimKind().name() : null,
          c.getRiskScore(),
          c.getVerificationScore(),
          c.getVerificationMethod(),
          c.getVerificationLevel(),
          c.getDecision(),
          c.getRiskReasons(),
          c.getCreatedAt(),
          c.getResolvedAt(),
          evidenceItems == null ? List.of() : evidenceItems,
          message,
          domainTxtRecord,
          domainHost,
          autoApproved
      );
    }
  }

  public record EvidenceResponse(
      Long id,
      String method,
      String status,
      String targetValue,
      String mediaUrl,
      Instant verifiedAt,
      Instant expiresAt
  ) {}

  public record AvailableMethodsResponse(
      Long placeId,
      String ownershipStatus,
      boolean alreadyManaged,
      boolean canClaim,
      boolean canRequestAccess,
      List<String> recommended,
      List<String> other,
      String listingPhoneMasked,
      String listingWebsite
  ) {}
}

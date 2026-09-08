package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "place_claims", indexes = {
    @Index(name = "idx_claim_place", columnList = "placeId,status"),
    @Index(name = "idx_claim_user", columnList = "userId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceClaim {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long placeId;

  @Column(nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ClaimStatus status;

  private String phone;

  @Column(length = 2000)
  private String evidence;

  @Column(length = 1000)
  private String needsInfoReasons;

  @Column(length = 2000)
  private String adminNote;

  /** When true, owner is asking for OWNER_VERIFIED upgrade. */
  private Boolean verificationRequest;

  @Enumerated(EnumType.STRING)
  @Column(length = 40)
  private BusinessMemberRole requestedRole;

  @Enumerated(EnumType.STRING)
  @Column(length = 32)
  private ClaimKind claimKind;

  private Integer riskScore;

  private Integer verificationScore;

  @Column(length = 64)
  private String verificationMethod;

  @Column(length = 32)
  private String verificationLevel;

  /** AUTO_APPROVED | QUEUED_ADMIN | MANUAL_APPROVED | REJECTED */
  @Column(length = 32)
  private String decision;

  @Column(length = 2000)
  private String riskReasons;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  private Instant resolvedAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = ClaimStatus.PENDING;
    if (verificationRequest == null) verificationRequest = false;
    if (requestedRole == null) requestedRole = BusinessMemberRole.OWNER;
    if (claimKind == null) {
      claimKind = Boolean.TRUE.equals(verificationRequest) ? ClaimKind.VERIFICATION_UPGRADE : ClaimKind.CLAIM;
    }
  }
}

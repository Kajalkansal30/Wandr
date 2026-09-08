package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "claim_evidence", indexes = {
    @Index(name = "idx_claim_evidence_claim", columnList = "claimId"),
    @Index(name = "idx_claim_evidence_place", columnList = "placeId,method")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimEvidence {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long claimId;

  @Column(nullable = false)
  private Long placeId;

  @Column(nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private ClaimEvidenceMethod method;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private ClaimEvidenceStatus status;

  @Column(length = 512)
  private String targetValue;

  @Column(length = 128)
  private String secretHash;

  @Column(length = 128)
  private String challengeToken;

  @Column(length = 1000)
  private String mediaUrl;

  @Column(length = 2000)
  private String metadata;

  private Instant expiresAt;

  private Instant verifiedAt;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    updatedAt = now;
    if (status == null) status = ClaimEvidenceStatus.PENDING;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}

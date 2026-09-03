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

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  private Instant resolvedAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = ClaimStatus.PENDING;
    if (verificationRequest == null) verificationRequest = false;
  }
}

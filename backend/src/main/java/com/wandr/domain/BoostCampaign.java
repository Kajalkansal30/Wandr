package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "boost_campaigns", indexes = {
    @Index(name = "idx_boost_place_status", columnList = "placeId,status"),
    @Index(name = "idx_boost_ends", columnList = "status,endsAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoostCampaign {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long placeId;

  @Column(nullable = false)
  private Long ownerId;

  /** Radius in km for targeting (display / filter). */
  @Column(nullable = false)
  private Integer targetRadiusKm;

  /** Comma-separated audience tags e.g. coffee,desserts,students */
  @Column(length = 500)
  private String audiences;

  @Column(nullable = false)
  private Integer budgetInr;

  @Column(nullable = false)
  private Integer durationDays;

  @Column(length = 120)
  private String headline;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BoostStatus status;

  @Column(nullable = false)
  private Instant startsAt;

  @Column(nullable = false)
  private Instant endsAt;

  @Column(nullable = false)
  private Long impressions;

  @Column(nullable = false)
  private Long profileVisits;

  @Column(nullable = false)
  private Long directionClicks;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (impressions == null) impressions = 0L;
    if (profileVisits == null) profileVisits = 0L;
    if (directionClicks == null) directionClicks = 0L;
    if (status == null) status = BoostStatus.ACTIVE;
    if (targetRadiusKm == null) targetRadiusKm = 5;
    if (durationDays == null) durationDays = 7;
  }
}

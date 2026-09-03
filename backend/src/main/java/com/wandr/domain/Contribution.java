package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "contributions", indexes = {
    @Index(name = "idx_contrib_place", columnList = "placeId,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contribution {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long userId;

  @Column(nullable = false)
  private Long placeId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContributionType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContributionStatus status;

  @Column(length = 4000)
  private String payload;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = ContributionStatus.PENDING;
  }
}

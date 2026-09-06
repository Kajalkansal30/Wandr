package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_place", columnList = "placeId,createdAt")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_reviews_user_place", columnNames = {"user_id", "place_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long placeId;

  @Column(nullable = false)
  private Long userId;

  private String userDisplayName;

  @Column(nullable = false)
  private Integer rating;

  @Column(length = 2000)
  private String text;

  /** Comma-separated experience tags */
  private String experienceTags;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private ReviewStatus status = ReviewStatus.APPROVED;

  @Column(nullable = false)
  @Builder.Default
  private Integer reportCount = 0;

  private Instant moderatedAt;

  private Long moderatedBy;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = ReviewStatus.APPROVED;
    if (reportCount == null) reportCount = 0;
  }
}

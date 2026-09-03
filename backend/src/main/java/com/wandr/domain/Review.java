package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_place", columnList = "placeId,createdAt")
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

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }
}

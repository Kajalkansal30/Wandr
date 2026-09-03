package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "moderation_actions", indexes = {
    @Index(name = "idx_mod_place", columnList = "placeId,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationAction {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long placeId;

  private Long claimId;

  private Long mediaId;

  private Long adminId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ModerationActionType action;

  @Column(length = 1000)
  private String reasons;

  @Column(length = 2000)
  private String note;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }
}

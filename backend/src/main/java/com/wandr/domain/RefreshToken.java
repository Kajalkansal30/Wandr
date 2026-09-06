package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_refresh_user", columnList = "userId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false, unique = true)
  private String tokenHash;

  @Column(nullable = false)
  private Instant expiresAt;

  private Instant revokedAt;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }
}

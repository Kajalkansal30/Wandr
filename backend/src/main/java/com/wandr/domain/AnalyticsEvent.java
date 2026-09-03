package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "analytics_events", indexes = {
    @Index(name = "idx_analytics_type_time", columnList = "eventType,createdAt"),
    @Index(name = "idx_analytics_place", columnList = "placeId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 64)
  private String eventType;

  private Long placeId;

  private Long userId;

  @Column(length = 64)
  private String sessionId;

  @Column(length = 64)
  private String source;

  @Column(length = 200)
  private String device;

  @Column(length = 2000)
  private String metadata;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }
}

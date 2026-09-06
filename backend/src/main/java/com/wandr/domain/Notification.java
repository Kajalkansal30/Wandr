package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "userId,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false)
  private String type;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, length = 1000)
  private String message;

  @Column(length = 2000)
  private String data;

  private Instant readAt;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
  }
}

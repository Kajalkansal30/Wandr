package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "spot_reports", indexes = {
    @Index(name = "idx_spot_report_status", columnList = "status,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpotReport {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long mediaId;

  private Long placeId;

  private Long userId;

  @Column(nullable = false, length = 64)
  private String reason;

  @Column(length = 2000)
  private String note;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReportStatus status;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = ReportStatus.OPEN;
  }
}

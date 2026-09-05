package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "place_media", indexes = {
    @Index(name = "idx_media_place", columnList = "placeId,status"),
    @Index(name = "idx_media_type_status", columnList = "mediaType,status,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceMedia {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long placeId;

  private Long userId;

  @Column(nullable = false, length = 1000)
  private String url;

  @Column(length = 1000)
  private String thumbnailUrl;

  @Enumerated(EnumType.STRING)
  private MediaType mediaType;

  @Enumerated(EnumType.STRING)
  private SpotKind spotKind;

  @Column(length = 1000)
  private String caption;

  private Integer durationSec;

  @Column(nullable = false)
  @Builder.Default
  private Integer likeCount = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MediaSource source;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MediaStatus status;

  @Column(length = 500)
  private String rejectReason;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = MediaStatus.PENDING;
    if (source == null) source = MediaSource.COMMUNITY;
    if (mediaType == null) mediaType = MediaType.PHOTO;
    if (likeCount == null) likeCount = 0;
  }
}

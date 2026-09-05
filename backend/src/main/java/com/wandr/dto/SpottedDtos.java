package com.wandr.dto;

import com.wandr.domain.Place;
import com.wandr.domain.PlaceMedia;
import com.wandr.domain.SpotKind;

import java.time.Instant;

public class SpottedDtos {

  public record CreateRequest(
      Long placeId,
      String url,
      String thumbnailUrl,
      String caption,
      String spotKind,
      Integer durationSec
  ) {}

  public record ReportRequest(String reason, String note) {}

  public record PlaceCard(
      Long id,
      String name,
      String address,
      String city,
      Double lat,
      Double lng,
      Double rating,
      Integer priceLevel,
      Integer avgCostForTwo,
      String operatingStatus,
      Integer openedDaysAgo,
      String image,
      Double distance
  ) {
    public static PlaceCard from(Place p, Double distanceKm) {
      if (p == null) return null;
      return new PlaceCard(
          p.getId(),
          p.getName(),
          p.getAddress(),
          p.getCity(),
          p.getLat(),
          p.getLng(),
          p.getRating(),
          p.getPriceLevel(),
          p.getAvgCostForTwo(),
          p.getOperatingStatus() != null ? p.getOperatingStatus().name() : null,
          p.getOpenedDaysAgo(),
          p.getImageUrl(),
          distanceKm
      );
    }
  }

  public record SpotResponse(
      Long id,
      Long placeId,
      Long userId,
      String url,
      String thumbnailUrl,
      String mediaType,
      String spotKind,
      String caption,
      Integer durationSec,
      Integer likeCount,
      Boolean likedByMe,
      String source,
      String status,
      Instant createdAt,
      PlaceCard place
  ) {
    public static SpotResponse from(PlaceMedia m, Place place, Double distanceKm, Boolean likedByMe) {
      return new SpotResponse(
          m.getId(),
          m.getPlaceId(),
          m.getUserId(),
          m.getUrl(),
          m.getThumbnailUrl(),
          m.getMediaType() != null ? m.getMediaType().name() : "PHOTO",
          m.getSpotKind() != null ? m.getSpotKind().name() : null,
          m.getCaption(),
          m.getDurationSec(),
          m.getLikeCount() != null ? m.getLikeCount() : 0,
          likedByMe,
          m.getSource() != null ? m.getSource().name() : null,
          m.getStatus() != null ? m.getStatus().name() : null,
          m.getCreatedAt(),
          PlaceCard.from(place, distanceKm)
      );
    }
  }

  public static SpotKind parseSpotKind(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try {
      return SpotKind.valueOf(raw.trim().toUpperCase().replace('-', '_').replace(' ', '_'));
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}

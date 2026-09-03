package com.wandr.dto;

import com.wandr.domain.PlaceMedia;

import java.time.Instant;

public class MediaDtos {

  public record CreateRequest(String url) {}

  public record MediaResponse(
      Long id,
      Long placeId,
      Long userId,
      String url,
      String source,
      String status,
      Instant createdAt
  ) {
    public static MediaResponse from(PlaceMedia m) {
      return new MediaResponse(
          m.getId(),
          m.getPlaceId(),
          m.getUserId(),
          m.getUrl(),
          m.getSource() != null ? m.getSource().name() : null,
          m.getStatus() != null ? m.getStatus().name() : null,
          m.getCreatedAt()
      );
    }
  }
}

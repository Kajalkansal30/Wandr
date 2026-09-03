package com.wandr.dto;

import com.wandr.domain.Review;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ReviewDtos {

  public record CreateRequest(Integer rating, String text, List<String> experienceTags) {}

  public record ReviewResponse(
      Long id,
      Long placeId,
      Long userId,
      String userDisplayName,
      Integer rating,
      String text,
      List<String> experienceTags,
      Instant createdAt
  ) {
    public static ReviewResponse from(Review r) {
      return new ReviewResponse(
          r.getId(),
          r.getPlaceId(),
          r.getUserId(),
          r.getUserDisplayName(),
          r.getRating(),
          r.getText(),
          split(r.getExperienceTags()),
          r.getCreatedAt()
      );
    }

    private static List<String> split(String csv) {
      if (csv == null || csv.isBlank()) return List.of();
      return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
  }
}

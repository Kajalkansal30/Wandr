package com.wandr.service;

import com.wandr.domain.Place;
import com.wandr.domain.Review;
import com.wandr.domain.User;
import com.wandr.dto.ReviewDtos;
import com.wandr.repo.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

  private final ReviewRepository reviewRepository;
  private final PlaceService placeService;

  public List<ReviewDtos.ReviewResponse> list(Long placeId) {
    return reviewRepository.findByPlaceIdOrderByCreatedAtDesc(placeId).stream()
        .map(ReviewDtos.ReviewResponse::from)
        .toList();
  }

  @Transactional
  public ReviewDtos.ReviewResponse create(User user, Long placeId, ReviewDtos.CreateRequest req) {
    if (req == null || req.rating() == null || req.rating() < 1 || req.rating() > 5) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rating 1-5 required");
    }
    Place place = placeService.requirePlace(placeId);
    String tags = req.experienceTags() == null ? null : req.experienceTags().stream()
        .filter(s -> s != null && !s.isBlank())
        .map(String::trim)
        .collect(Collectors.joining(","));

    Review review = reviewRepository.save(Review.builder()
        .placeId(placeId)
        .userId(user.getId())
        .userDisplayName(user.getDisplayName())
        .rating(req.rating())
        .text(req.text())
        .experienceTags(tags)
        .build());

    long count = reviewRepository.countByPlaceId(placeId);
    Double avg = reviewRepository.averageRating(placeId);
    place.setReviewCount((int) count);
    place.setRating(avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0);
    placeService.save(place);

    return ReviewDtos.ReviewResponse.from(review);
  }
}

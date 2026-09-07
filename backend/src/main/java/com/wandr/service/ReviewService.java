package com.wandr.service;

import com.wandr.domain.Place;
import com.wandr.domain.Review;
import com.wandr.domain.ReviewStatus;
import com.wandr.domain.User;
import com.wandr.dto.ReviewDtos;
import com.wandr.repo.ReviewRepository;
import com.wandr.security.VerifiedEmailGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

  private final ReviewRepository reviewRepository;
  private final PlaceService placeService;
  private final NotificationService notificationService;

  public List<ReviewDtos.ReviewResponse> list(Long placeId) {
    return list(placeId, 0, 50);
  }

  public List<ReviewDtos.ReviewResponse> list(Long placeId, int page, int size) {
    int safeSize = Math.min(Math.max(size, 1), 100);
    int safePage = Math.max(page, 0);
    var pageable = org.springframework.data.domain.PageRequest.of(safePage, safeSize);
    return reviewRepository
        .findByPlaceIdAndStatusOrderByCreatedAtDesc(placeId, ReviewStatus.APPROVED, pageable)
        .stream()
        .map(ReviewDtos.ReviewResponse::from)
        .toList();
  }

  @Transactional
  public ReviewDtos.ReviewResponse create(User user, Long placeId, ReviewDtos.CreateRequest req) {
    VerifiedEmailGuard.requireVerified(user);
    Place place = placeService.requirePlace(placeId);
    String tags = req.experienceTags() == null ? null : req.experienceTags().stream()
        .filter(s -> s != null && !s.isBlank())
        .map(String::trim)
        .collect(Collectors.joining(","));

    AtomicBoolean created = new AtomicBoolean(false);
    Review review = reviewRepository.findByUserIdAndPlaceId(user.getId(), placeId)
        .map(existing -> {
          existing.setRating(req.rating());
          existing.setText(req.text());
          existing.setExperienceTags(tags);
          existing.setUserDisplayName(user.getDisplayName());
          existing.setStatus(ReviewStatus.APPROVED);
          return existing;
        })
        .orElseGet(() -> {
          created.set(true);
          return Review.builder()
              .placeId(placeId)
              .userId(user.getId())
              .userDisplayName(user.getDisplayName())
              .rating(req.rating())
              .text(req.text())
              .experienceTags(tags)
              .status(ReviewStatus.APPROVED)
              .build();
        });

    review = reviewRepository.save(review);
    recalculatePlaceRatings(place);

    if (created.get()
        && place.getOwner() != null
        && !place.getOwner().getId().equals(user.getId())) {
      int stars = review.getRating() == null ? 0 : review.getRating();
      notificationService.create(
          place.getOwner().getId(),
          "NEW_REVIEW",
          "New review",
          "Someone just reviewed " + place.getName() + ". ★ " + stars + "/5",
          "PLACE",
          place.getId(),
          "{\"reviewId\":" + review.getId() + ",\"rating\":" + stars + "}",
          "review:" + review.getId()
      );
    }

    return ReviewDtos.ReviewResponse.from(review);
  }

  private void recalculatePlaceRatings(Place place) {
    long count = reviewRepository.countByPlaceIdAndStatus(place.getId(), ReviewStatus.APPROVED);
    Double avg = reviewRepository.averageRating(place.getId(), ReviewStatus.APPROVED);
    place.setReviewCount((int) count);
    place.setRating(avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0);
    placeService.save(place);
  }
}

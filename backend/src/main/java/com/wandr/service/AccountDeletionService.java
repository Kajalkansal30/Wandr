package com.wandr.service;

import com.wandr.domain.OwnershipStatus;
import com.wandr.domain.Place;
import com.wandr.domain.PlaceStatus;
import com.wandr.domain.Review;
import com.wandr.domain.ReviewStatus;
import com.wandr.domain.User;
import com.wandr.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountDeletionService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final PlaceRepository placeRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final NotificationRepository notificationRepository;
  private final FavoriteRepository favoriteRepository;
  private final ReviewRepository reviewRepository;
  private final SpotLikeRepository spotLikeRepository;
  private final SpotReportRepository spotReportRepository;
  private final PlaceReportRepository placeReportRepository;
  private final ContributionRepository contributionRepository;
  private final PlaceClaimRepository placeClaimRepository;
  private final BoostCampaignRepository boostCampaignRepository;
  private final PlaceMediaRepository placeMediaRepository;
  private final AnalyticsEventRepository analyticsEventRepository;

  @Transactional
  public void deleteAccount(User user, String password) {
    if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is incorrect");
    }

    Long userId = user.getId();

    List<Place> owned = placeRepository.findByOwnerIdWithOwner(userId);
    for (Place place : owned) {
      place.setStatus(PlaceStatus.CLOSED);
      place.setOwner(null);
      place.setOwnershipStatus(OwnershipStatus.UNCLAIMED);
      place.setClaimedAt(null);
      placeRepository.save(place);
    }

    refreshTokenRepository.deleteByUserId(userId);
    notificationRepository.deleteByUserId(userId);
    favoriteRepository.deleteByUserId(userId);

    // Remove reviews entirely (do not leave "Deleted user" stubs) and refresh place ratings.
    List<Review> reviews = reviewRepository.findByUserId(userId);
    java.util.Set<Long> placeIds = reviews.stream()
        .map(Review::getPlaceId)
        .filter(id -> id != null)
        .collect(java.util.stream.Collectors.toSet());
    reviewRepository.deleteByUserId(userId);
    for (Long placeId : placeIds) {
      placeRepository.findById(placeId).ifPresent(place -> {
        long count = reviewRepository.countByPlaceIdAndStatus(placeId, ReviewStatus.APPROVED);
        Double avg = reviewRepository.averageRating(placeId, ReviewStatus.APPROVED);
        place.setReviewCount((int) count);
        place.setRating(avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0);
        placeRepository.save(place);
      });
    }

    spotLikeRepository.deleteByUserId(userId);
    spotReportRepository.deleteByUserId(userId);
    placeReportRepository.deleteByUserId(userId);
    contributionRepository.deleteByUserId(userId);
    placeClaimRepository.deleteByUserId(userId);
    boostCampaignRepository.deleteByOwnerId(userId);
    placeMediaRepository.clearUserId(userId);
    analyticsEventRepository.clearUserId(userId);

    userRepository.delete(user);
  }
}

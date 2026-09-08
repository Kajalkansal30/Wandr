package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.repo.PlaceClaimRepository;
import com.wandr.repo.BusinessMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ClaimRiskService {

  public static final int LOW_MAX = 20;
  public static final int MEDIUM_MAX = 50;

  private final PlaceClaimRepository placeClaimRepository;
  private final BusinessMemberRepository businessMemberRepository;

  public record RiskResult(int score, List<String> reasons, String band) {
    public boolean isLow() {
      return score <= LOW_MAX;
    }

    public boolean isHigh() {
      return score > MEDIUM_MAX;
    }
  }

  public RiskResult assess(User user, Place place, ClaimKind kind) {
    return assess(user, place, kind, null);
  }

  public RiskResult assess(User user, Place place, ClaimKind kind, Long excludeClaimId) {
    int score = 0;
    List<String> reasons = new ArrayList<>();

    if (user.getCreatedAt() != null && user.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS))) {
      score += 10;
      reasons.add("new_account");
    }

    if (place.getCreatedAt() != null && place.getCreatedAt().isAfter(Instant.now().minus(2, ChronoUnit.DAYS))) {
      score += 5;
      reasons.add("brand_new_listing");
    }

    if (place.getPhone() == null || place.getPhone().isBlank()) {
      score += 10;
      reasons.add("no_listing_phone");
    }

    if (place.getWebsite() == null || place.getWebsite().isBlank()) {
      score += 5;
      reasons.add("no_website");
    }

    long pendingOnPlace = placeClaimRepository.findByPlaceIdOrderByCreatedAtDesc(place.getId()).stream()
        .filter(c -> c.getStatus() == ClaimStatus.PENDING)
        .filter(c -> excludeClaimId == null || !c.getId().equals(excludeClaimId))
        .count();
    if (pendingOnPlace > 0) {
      score += 20;
      reasons.add("competing_pending_claims");
    }

    if (businessMemberRepository.existsByPlaceIdAndStatus(place.getId(), BusinessMemberStatus.ACTIVE)
        || place.getOwner() != null) {
      if (kind == ClaimKind.CLAIM) {
        score += 30;
        reasons.add("existing_manager");
      }
    }

    long rejected = placeClaimRepository.countByUserIdAndStatus(user.getId(), ClaimStatus.REJECTED);
    if (rejected > 0) {
      score += 30;
      reasons.add("prior_rejects");
    }

    long recentClaims = placeClaimRepository.countByUserIdAndCreatedAtAfter(
        user.getId(), Instant.now().minus(24, ChronoUnit.HOURS));
    if (recentClaims >= 3) {
      score += 20;
      reasons.add("rapid_multi_claims");
    }

    String name = place.getName() == null ? "" : place.getName().toLowerCase(Locale.ROOT);
    if (name.contains("starbucks") || name.contains("mcdonald") || name.contains("nike")
        || name.contains("apple store") || name.contains("dominos")) {
      score += 25;
      reasons.add("high_abuse_brand_name");
    }

    if (kind == ClaimKind.DISPUTE) {
      score += 40;
      reasons.add("ownership_dispute");
    }

    String band = score <= LOW_MAX ? "LOW" : score <= MEDIUM_MAX ? "MEDIUM" : "HIGH";
    return new RiskResult(score, reasons, band);
  }
}

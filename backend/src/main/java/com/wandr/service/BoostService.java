package com.wandr.service;

import com.wandr.domain.BoostCampaign;
import com.wandr.domain.BoostStatus;
import com.wandr.domain.Place;
import com.wandr.domain.PlaceStatus;
import com.wandr.domain.User;
import com.wandr.dto.BoostDtos;
import com.wandr.dto.PlaceDtos;
import com.wandr.repo.BoostCampaignRepository;
import com.wandr.repo.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoostService {

  private static final Set<Integer> ALLOWED_BUDGETS = Set.of(500, 1000, 2500, 5000);
  private static final Set<Integer> ALLOWED_RADIUS = Set.of(3, 5, 10);

  private final BoostCampaignRepository boostCampaignRepository;
  private final PlaceRepository placeRepository;

  public List<BoostDtos.CampaignResponse> listMine(User owner) {
    expireStale();
    return boostCampaignRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
        .map(c -> BoostDtos.CampaignResponse.from(c, placeName(c.getPlaceId())))
        .toList();
  }

  public BoostDtos.CampaignResponse getMine(User owner, Long id) {
    expireStale();
    BoostCampaign c = boostCampaignRepository.findByIdAndOwnerId(id, owner.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found"));
    return BoostDtos.CampaignResponse.from(c, placeName(c.getPlaceId()));
  }

  @Transactional
  public BoostDtos.CampaignResponse create(User owner, BoostDtos.CreateRequest req) {
    if (req == null || req.placeId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "placeId is required");
    }
    Place place = placeRepository.findById(req.placeId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
    if (place.getOwner() == null || !place.getOwner().getId().equals(owner.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your listing");
    }
    if (place.getStatus() != PlaceStatus.APPROVED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only live (approved) listings can be boosted");
    }

    int budget = req.budgetInr() != null ? req.budgetInr() : 1000;
    if (!ALLOWED_BUDGETS.contains(budget)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "budgetInr must be 500, 1000, 2500, or 5000");
    }
    int radius = req.targetRadiusKm() != null ? req.targetRadiusKm() : 5;
    if (!ALLOWED_RADIUS.contains(radius)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetRadiusKm must be 3, 5, or 10");
    }
    int days = req.durationDays() != null ? req.durationDays() : 7;
    if (days < 3 || days > 30) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "durationDays must be between 3 and 30");
    }

    // End any overlapping active campaigns for this place
    Instant now = Instant.now();
    for (BoostCampaign existing : boostCampaignRepository.findActiveForPlace(place.getId(), BoostStatus.ACTIVE, now)) {
      existing.setStatus(BoostStatus.ENDED);
      existing.setEndsAt(now);
      boostCampaignRepository.save(existing);
    }

    String audiences = req.audiences() == null ? null : req.audiences().stream()
        .filter(Objects::nonNull)
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .map(String::toLowerCase)
        .distinct()
        .collect(Collectors.joining(","));

    String headline = req.headline() == null || req.headline().isBlank()
        ? "Discover us nearby"
        : req.headline().trim().substring(0, Math.min(120, req.headline().trim().length()));

    BoostCampaign campaign = BoostCampaign.builder()
        .placeId(place.getId())
        .ownerId(owner.getId())
        .targetRadiusKm(radius)
        .audiences(audiences)
        .budgetInr(budget)
        .durationDays(days)
        .headline(headline)
        .status(BoostStatus.ACTIVE)
        .startsAt(now)
        .endsAt(now.plus(days, ChronoUnit.DAYS))
        .impressions(0L)
        .profileVisits(0L)
        .directionClicks(0L)
        .build();

    return BoostDtos.CampaignResponse.from(
        boostCampaignRepository.save(campaign),
        place.getName()
    );
  }

  /** Active campaigns for public discovery enrichment. */
  public Map<Long, BoostCampaign> activeByPlaceId() {
    expireStale();
    Map<Long, BoostCampaign> map = new LinkedHashMap<>();
    for (BoostCampaign c : boostCampaignRepository.findActive(BoostStatus.ACTIVE, Instant.now())) {
      map.putIfAbsent(c.getPlaceId(), c);
    }
    return map;
  }

  public PlaceDtos.PlaceResponse enrich(Place place, Double distanceKm, Map<Long, BoostCampaign> active) {
    BoostCampaign c = active.get(place.getId());
    if (c == null) {
      return PlaceDtos.PlaceResponse.from(place, distanceKm);
    }
    return PlaceDtos.PlaceResponse.from(
        place,
        distanceKm,
        true,
        c.getHeadline(),
        c.getId(),
        c.getEndsAt()
    );
  }

  @Transactional
  public void recordImpression(Long campaignId) {
    if (campaignId == null) return;
    boostCampaignRepository.findById(campaignId).ifPresent(c -> {
      if (c.getStatus() == BoostStatus.ACTIVE && c.getEndsAt().isAfter(Instant.now())) {
        c.setImpressions((c.getImpressions() == null ? 0L : c.getImpressions()) + 1);
        boostCampaignRepository.save(c);
      }
    });
  }

  @Transactional
  public void recordProfileVisit(Long placeId) {
    if (placeId == null) return;
    Instant now = Instant.now();
    for (BoostCampaign c : boostCampaignRepository.findActiveForPlace(placeId, BoostStatus.ACTIVE, now)) {
      c.setProfileVisits((c.getProfileVisits() == null ? 0L : c.getProfileVisits()) + 1);
      boostCampaignRepository.save(c);
    }
  }

  @Transactional
  public void recordDirectionClick(Long placeId) {
    if (placeId == null) return;
    Instant now = Instant.now();
    for (BoostCampaign c : boostCampaignRepository.findActiveForPlace(placeId, BoostStatus.ACTIVE, now)) {
      c.setDirectionClicks((c.getDirectionClicks() == null ? 0L : c.getDirectionClicks()) + 1);
      boostCampaignRepository.save(c);
    }
  }

  @Transactional
  public void expireStale() {
    Instant now = Instant.now();
    for (BoostCampaign c : boostCampaignRepository.findByStatus(BoostStatus.ACTIVE)) {
      if (c.getEndsAt() != null && !c.getEndsAt().isAfter(now)) {
        c.setStatus(BoostStatus.ENDED);
        boostCampaignRepository.save(c);
      }
    }
  }

  private String placeName(Long placeId) {
    return placeRepository.findById(placeId).map(Place::getName).orElse("Place");
  }
}

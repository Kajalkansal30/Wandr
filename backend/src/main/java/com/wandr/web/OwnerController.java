package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.*;
import com.wandr.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerController {

  private final PlaceService placeService;
  private final OwnerAnalyticsService ownerAnalyticsService;
  private final BoostService boostService;
  private final ClaimService claimService;

  @GetMapping("/places")
  public List<PlaceDtos.PlaceResponse> myPlaces(@AuthenticationPrincipal User user) {
    return placeService.listByOwner(user);
  }

  @GetMapping("/places/{id}")
  public PlaceDtos.PlaceResponse get(
      @AuthenticationPrincipal User user,
      @PathVariable Long id
  ) {
    return placeService.getOwned(user, id);
  }

  @PostMapping("/places")
  public PlaceDtos.PlaceResponse create(
      @AuthenticationPrincipal User user,
      @RequestBody PlaceDtos.PlaceUpsertRequest body
  ) {
    return placeService.create(user, body);
  }

  @PutMapping("/places/{id}")
  public PlaceDtos.PlaceResponse update(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody PlaceDtos.PlaceUpsertRequest body
  ) {
    return placeService.update(user, id, body);
  }

  @GetMapping("/places/{id}/trust")
  public ClaimService.MapTrust trust(
      @AuthenticationPrincipal User user,
      @PathVariable Long id
  ) {
    return claimService.trustProfile(placeService.requireOwned(user, id));
  }

  @PostMapping("/places/{id}/request-verification")
  public ClaimDtos.ClaimResponse requestVerification(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody(required = false) ClaimDtos.CreateClaimRequest body
  ) {
    placeService.requireOwned(user, id);
    ClaimDtos.CreateClaimRequest req = body == null
        ? new ClaimDtos.CreateClaimRequest(null, "Verification request", true)
        : new ClaimDtos.CreateClaimRequest(body.phone(), body.evidence(), true);
    return claimService.create(user, id, req);
  }

  @GetMapping("/analytics")
  public AnalyticsDtos.OwnerAnalyticsResponse analytics(
      @AuthenticationPrincipal User user,
      @RequestParam(defaultValue = "30") int days,
      @RequestParam(required = false) Long placeId
  ) {
    return ownerAnalyticsService.summary(user, days, placeId);
  }

  @GetMapping("/boosts")
  public List<BoostDtos.CampaignResponse> myBoosts(@AuthenticationPrincipal User user) {
    return boostService.listMine(user);
  }

  @GetMapping("/boosts/{id}")
  public BoostDtos.CampaignResponse getBoost(
      @AuthenticationPrincipal User user,
      @PathVariable Long id
  ) {
    return boostService.getMine(user, id);
  }

  @PostMapping("/boosts")
  public BoostDtos.CampaignResponse createBoost(
      @AuthenticationPrincipal User user,
      @RequestBody BoostDtos.CreateRequest body
  ) {
    return boostService.create(user, body);
  }

  @GetMapping("/claims")
  public List<ClaimDtos.ClaimResponse> myClaims(@AuthenticationPrincipal User user) {
    return claimService.listMine(user);
  }
}

package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.*;
import com.wandr.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PlaceController {

  private final PlaceService placeService;
  private final CommunityService communityService;
  private final ClaimService claimService;
  private final ReviewService reviewService;
  private final MediaService mediaService;

  @GetMapping("/api/health")
  public Map<String, String> health() {
    return Map.of("status", "ok", "service", "wandr-backend");
  }

  @GetMapping("/api/places")
  public List<PlaceDtos.PlaceResponse> list(
      @RequestParam(required = false) Double lat,
      @RequestParam(required = false) Double lng
  ) {
    return placeService.listApproved(lat, lng);
  }

  @GetMapping("/api/places/{id}")
  public PlaceDtos.PlaceResponse get(
      @PathVariable Long id,
      @RequestParam(required = false) Double lat,
      @RequestParam(required = false) Double lng
  ) {
    return placeService.getApproved(id, lat, lng);
  }

  @PostMapping("/api/places/community")
  @ResponseStatus(HttpStatus.CREATED)
  public PlaceDtos.PlaceResponse communitySubmit(
      @AuthenticationPrincipal User user,
      @RequestBody PlaceDtos.CommunitySubmitRequest body
  ) {
    return placeService.createCommunity(user, body);
  }

  @PostMapping("/api/places/{id}/claim")
  public ClaimDtos.ClaimResponse claim(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody(required = false) ClaimDtos.CreateClaimRequest body
  ) {
    return claimService.create(user, id, body);
  }

  @PostMapping("/api/places/{id}/confirm")
  public PlaceDtos.PlaceResponse confirm(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody(required = false) CommunityDtos.ConfirmRequest body
  ) {
    return communityService.confirmInfo(user, id, body);
  }

  @PostMapping("/api/places/{id}/report")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void report(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody CommunityDtos.ReportRequest body
  ) {
    communityService.report(user, id, body);
  }

  @GetMapping("/api/places/{id}/reviews")
  public List<ReviewDtos.ReviewResponse> reviews(@PathVariable Long id) {
    return reviewService.list(id);
  }

  @PostMapping("/api/places/{id}/reviews")
  public ReviewDtos.ReviewResponse addReview(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody ReviewDtos.CreateRequest body
  ) {
    return reviewService.create(user, id, body);
  }

  @GetMapping("/api/places/{id}/media")
  public List<MediaDtos.MediaResponse> media(@PathVariable Long id) {
    return mediaService.listApproved(id);
  }

  @PostMapping("/api/places/{id}/media")
  public MediaDtos.MediaResponse addMedia(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody MediaDtos.CreateRequest body
  ) {
    return mediaService.submit(user, id, body, false);
  }
}

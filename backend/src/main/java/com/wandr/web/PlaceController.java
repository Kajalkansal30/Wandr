package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.*;
import com.wandr.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
public class PlaceController {

  private final PlaceService placeService;
  private final CommunityService communityService;
  private final ClaimService claimService;
  private final ReviewService reviewService;
  private final MediaService mediaService;

  @GetMapping("/api/places")
  public ResponseEntity<PlaceDtos.PlacePageResponse> list(
      @RequestParam(required = false) Double lat,
      @RequestParam(required = false) Double lng,
      @RequestParam(required = false) Double radius,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "30") int size
  ) {
    PlaceDtos.PlacePageResponse body = placeService.listApproved(lat, lng, radius, category, search, page, size);
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
        .body(body);
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
  public List<ReviewDtos.ReviewResponse> reviews(
      @PathVariable Long id,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size
  ) {
    return reviewService.list(id, page, size);
  }

  @PostMapping("/api/places/{id}/reviews")
  public ReviewDtos.ReviewResponse addReview(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @Valid @RequestBody ReviewDtos.CreateRequest body
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

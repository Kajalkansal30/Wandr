package com.wandr.web;

import com.wandr.domain.PlaceStatus;
import com.wandr.domain.User;
import com.wandr.dto.*;
import com.wandr.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

  private final PlaceService placeService;
  private final ModerationService moderationService;
  private final ClaimService claimService;
  private final MediaService mediaService;
  private final com.wandr.repo.UserRepository userRepository;

  @GetMapping("/places")
  public List<PlaceDtos.PlaceResponse> list(
      @RequestParam(defaultValue = "PENDING_REVIEW") String status
  ) {
    PlaceStatus st;
    try {
      st = PlaceStatus.valueOf(status.toUpperCase());
    } catch (Exception e) {
      st = PlaceStatus.PENDING_REVIEW;
    }
    return placeService.listByStatus(st);
  }

  @GetMapping("/places/{id}")
  public PlaceDtos.PlaceResponse get(@PathVariable Long id) {
    return placeService.getAny(id);
  }

  @GetMapping("/stats")
  public Map<String, Long> stats() {
    Map<String, Long> m = moderationService.stats();
    m.put("users", userRepository.count());
    return m;
  }

  @GetMapping("/audit")
  public List<ModerationDtos.ActionResponse> audit() {
    return moderationService.auditLog();
  }

  @GetMapping("/places/{id}/audit")
  public List<ModerationDtos.ActionResponse> placeAudit(@PathVariable Long id) {
    return moderationService.auditForPlace(id);
  }

  @PostMapping("/places/{id}/approve")
  public PlaceDtos.PlaceResponse approve(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return moderationService.approve(admin, id, body);
  }

  @PostMapping("/places/{id}/reject")
  public PlaceDtos.PlaceResponse reject(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return moderationService.reject(admin, id, body);
  }

  @PostMapping("/places/{id}/request-info")
  public PlaceDtos.PlaceResponse requestInfo(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return moderationService.requestInfo(admin, id, body);
  }

  @PostMapping("/places/{id}/suspend")
  public PlaceDtos.PlaceResponse suspend(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return moderationService.suspend(admin, id, body);
  }

  @PostMapping("/places/{id}/close")
  public PlaceDtos.PlaceResponse close(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return moderationService.close(admin, id, body);
  }

  @GetMapping("/claims")
  public List<ClaimDtos.ClaimResponse> claims() {
    return claimService.listPending();
  }

  @PostMapping("/claims/{id}/approve")
  public ClaimDtos.ClaimResponse approveClaim(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return claimService.approve(admin, id, body);
  }

  @PostMapping("/claims/{id}/reject")
  public ClaimDtos.ClaimResponse rejectClaim(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return claimService.reject(admin, id, body);
  }

  @PostMapping("/claims/{id}/request-info")
  public ClaimDtos.ClaimResponse requestClaimInfo(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return claimService.requestInfo(admin, id, body);
  }

  @GetMapping("/media")
  public List<MediaDtos.MediaResponse> pendingMedia() {
    return mediaService.listPending();
  }

  @PostMapping("/media/{id}/approve")
  public MediaDtos.MediaResponse approveMedia(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return mediaService.approve(admin, id, body);
  }

  @PostMapping("/media/{id}/reject")
  public MediaDtos.MediaResponse rejectMedia(
      @AuthenticationPrincipal User admin,
      @PathVariable Long id,
      @RequestBody(required = false) ModerationDtos.DecisionRequest body
  ) {
    return mediaService.reject(admin, id, body);
  }
}

package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.ModerationDtos;
import com.wandr.dto.PlaceDtos;
import com.wandr.repo.ModerationActionRepository;
import com.wandr.repo.PlaceClaimRepository;
import com.wandr.repo.PlaceMediaRepository;
import com.wandr.repo.PlaceReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModerationService {

  private final PlaceService placeService;
  private final ModerationActionRepository moderationActionRepository;
  private final PlaceClaimRepository placeClaimRepository;
  private final PlaceReportRepository placeReportRepository;
  private final PlaceMediaRepository placeMediaRepository;

  public List<ModerationDtos.ActionResponse> auditLog() {
    return moderationActionRepository.findTop50ByOrderByCreatedAtDesc().stream()
        .map(ModerationDtos.ActionResponse::from)
        .toList();
  }

  public List<ModerationDtos.ActionResponse> auditForPlace(Long placeId) {
    return moderationActionRepository.findByPlaceIdOrderByCreatedAtDesc(placeId).stream()
        .map(ModerationDtos.ActionResponse::from)
        .toList();
  }

  public Map<String, Long> stats() {
    Map<String, Long> map = new HashMap<>();
    map.put("pending", placeService.countByStatus(PlaceStatus.PENDING_REVIEW));
    map.put("approved", placeService.countByStatus(PlaceStatus.APPROVED));
    map.put("rejected", placeService.countByStatus(PlaceStatus.REJECTED));
    map.put("suspended", placeService.countByStatus(PlaceStatus.SUSPENDED));
    map.put("closed", placeService.countByStatus(PlaceStatus.CLOSED));
    map.put("unclaimed", placeService.countByOwnership(OwnershipStatus.UNCLAIMED));
    map.put("claimPending", placeClaimRepository.countByStatus(ClaimStatus.PENDING));
    map.put("reports", placeReportRepository.countByStatus(ReportStatus.OPEN));
    map.put("mediaPending", placeMediaRepository.countByStatus(MediaStatus.PENDING));
    return map;
  }

  @Transactional
  public PlaceDtos.PlaceResponse approve(User admin, Long placeId, ModerationDtos.DecisionRequest req) {
    Place place = placeService.requirePlace(placeId);
    place.setStatus(PlaceStatus.APPROVED);
    place.setNeedsInfoReasons(null);
    if (place.getLastInformationCheck() == null) {
      place.setLastInformationCheck(Instant.now());
    }
    // Owner-created listings that are approved become OWNER_CLAIMED (not verified yet)
    if (place.getOwner() != null && place.getOwnershipStatus() == OwnershipStatus.UNCLAIMED) {
      place.setOwnershipStatus(OwnershipStatus.OWNER_CLAIMED);
      place.setClaimedAt(Instant.now());
    }
    placeService.save(place);
    log(admin, placeId, null, null, ModerationActionType.APPROVE, req);
    return PlaceDtos.PlaceResponse.from(place, null);
  }

  @Transactional
  public PlaceDtos.PlaceResponse reject(User admin, Long placeId, ModerationDtos.DecisionRequest req) {
    Place place = placeService.requirePlace(placeId);
    place.setStatus(PlaceStatus.REJECTED);
    if (req != null && req.note() != null) place.setAdminNote(req.note());
    placeService.save(place);
    log(admin, placeId, null, null, ModerationActionType.REJECT, req);
    return PlaceDtos.PlaceResponse.from(place, null);
  }

  @Transactional
  public PlaceDtos.PlaceResponse requestInfo(User admin, Long placeId, ModerationDtos.DecisionRequest req) {
    Place place = placeService.requirePlace(placeId);
    place.setStatus(PlaceStatus.PENDING_REVIEW);
    String reasons = joinReasons(req);
    place.setNeedsInfoReasons(reasons);
    if (req != null && req.note() != null) place.setAdminNote(req.note());
    placeService.save(place);
    log(admin, placeId, null, null, ModerationActionType.REQUEST_INFO, req);
    return PlaceDtos.PlaceResponse.from(place, null);
  }

  @Transactional
  public PlaceDtos.PlaceResponse suspend(User admin, Long placeId, ModerationDtos.DecisionRequest req) {
    Place place = placeService.requirePlace(placeId);
    place.setStatus(PlaceStatus.SUSPENDED);
    place.setTemporarilyClosed(true);
    if (req != null && req.note() != null) place.setAdminNote(req.note());
    placeService.save(place);
    log(admin, placeId, null, null, ModerationActionType.SUSPEND, req);
    return PlaceDtos.PlaceResponse.from(place, null);
  }

  @Transactional
  public PlaceDtos.PlaceResponse close(User admin, Long placeId, ModerationDtos.DecisionRequest req) {
    Place place = placeService.requirePlace(placeId);
    place.setStatus(PlaceStatus.CLOSED);
    place.setOperatingStatus(OperatingStatus.PERMANENTLY_CLOSED);
    place.setClosedAt(Instant.now());
    if (req != null && req.note() != null) place.setAdminNote(req.note());
    placeService.save(place);
    log(admin, placeId, null, null, ModerationActionType.CLOSE, req);
    return PlaceDtos.PlaceResponse.from(place, null);
  }

  public void log(
      User admin,
      Long placeId,
      Long claimId,
      Long mediaId,
      ModerationActionType action,
      ModerationDtos.DecisionRequest req
  ) {
    moderationActionRepository.save(ModerationAction.builder()
        .placeId(placeId)
        .claimId(claimId)
        .mediaId(mediaId)
        .adminId(admin != null ? admin.getId() : null)
        .action(action)
        .reasons(joinReasons(req))
        .note(req != null ? blank(req.note()) : null)
        .build());
  }

  private static String joinReasons(ModerationDtos.DecisionRequest req) {
    if (req == null || req.reasons() == null || req.reasons().isEmpty()) return null;
    return req.reasons().stream().filter(s -> s != null && !s.isBlank()).map(String::trim).collect(Collectors.joining(","));
  }

  private static String blank(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}

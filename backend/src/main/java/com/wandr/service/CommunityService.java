package com.wandr.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wandr.domain.*;
import com.wandr.dto.CommunityDtos;
import com.wandr.dto.PlaceDtos;
import com.wandr.repo.ContributionRepository;
import com.wandr.repo.PlaceReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommunityService {

  private static final int CONFIRM_THRESHOLD = 3;

  private final ContributionRepository contributionRepository;
  private final PlaceReportRepository placeReportRepository;
  private final PlaceService placeService;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Transactional
  public PlaceDtos.PlaceResponse confirmInfo(User user, Long placeId, CommunityDtos.ConfirmRequest req) {
    Place place = placeService.requirePlace(placeId);
    if (place.getStatus() != PlaceStatus.APPROVED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only confirm live places");
    }
    Map<String, Boolean> checks = req != null && req.checks() != null ? req.checks() : Map.of();
    boolean allYes = checks.values().stream().allMatch(Boolean.TRUE::equals);
    boolean anyNo = checks.values().stream().anyMatch(v -> Boolean.FALSE.equals(v));

    String payload;
    try {
      payload = objectMapper.writeValueAsString(checks);
    } catch (Exception e) {
      payload = checks.toString();
    }

    Contribution contrib = Contribution.builder()
        .userId(user != null ? user.getId() : null)
        .placeId(placeId)
        .type(anyNo ? ContributionType.CORRECT_INFO : ContributionType.CONFIRM_INFO)
        .status(anyNo ? ContributionStatus.PENDING : ContributionStatus.ACCEPTED)
        .payload(payload)
        .build();
    contributionRepository.save(contrib);

    if (allYes && !checks.isEmpty()) {
      int count = (place.getCommunityConfirmCount() == null ? 0 : place.getCommunityConfirmCount()) + 1;
      place.setCommunityConfirmCount(count);
      place.setLastInformationCheck(Instant.now());
      if (count >= CONFIRM_THRESHOLD) {
        place.setCommunityConfirmed(true);
      }
      placeService.save(place);
    }

    return PlaceDtos.PlaceResponse.from(place, null);
  }

  @Transactional
  public void report(User user, Long placeId, CommunityDtos.ReportRequest req) {
    if (req == null || req.reason() == null || req.reason().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required");
    }
    placeService.requirePlace(placeId);
    placeReportRepository.save(PlaceReport.builder()
        .placeId(placeId)
        .userId(user != null ? user.getId() : null)
        .reason(req.reason().trim())
        .note(req.note())
        .status(ReportStatus.OPEN)
        .build());

    ContributionType type = "closed".equalsIgnoreCase(req.reason()) || "REPORT_CLOSED".equalsIgnoreCase(req.reason())
        ? ContributionType.REPORT_CLOSED
        : ContributionType.REPORT_WRONG_LOCATION;
    contributionRepository.save(Contribution.builder()
        .userId(user != null ? user.getId() : null)
        .placeId(placeId)
        .type(type)
        .status(ContributionStatus.PENDING)
        .payload(req.note())
        .build());
  }
}

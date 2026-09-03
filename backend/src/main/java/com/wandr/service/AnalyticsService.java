package com.wandr.service;

import com.wandr.domain.AnalyticsEvent;
import com.wandr.domain.User;
import com.wandr.dto.AnalyticsDtos;
import com.wandr.repo.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

  private final AnalyticsEventRepository analyticsEventRepository;
  private final BoostService boostService;

  @Transactional
  public void track(AnalyticsDtos.TrackRequest req, User user) {
    if (req == null || req.eventType() == null || req.eventType().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "eventType is required");
    }
    String type = req.eventType().trim().toLowerCase().replace('-', '_');
    analyticsEventRepository.save(AnalyticsEvent.builder()
        .eventType(type)
        .placeId(req.placeId())
        .userId(user != null ? user.getId() : null)
        .sessionId(blankToNull(req.sessionId()))
        .source(blankToNull(req.source()))
        .device(blankToNull(req.device()))
        .metadata(blankToNull(req.metadata()))
        .build());

    // Keep boost campaign counters in sync for owner dashboards
    if (req.placeId() != null) {
      if ("boost_impression".equals(type)) {
        Long campaignId = parseCampaignId(req.metadata());
        if (campaignId != null) boostService.recordImpression(campaignId);
      } else if ("place_view".equals(type)) {
        boostService.recordProfileVisit(req.placeId());
      } else if ("direction_click".equals(type)) {
        boostService.recordDirectionClick(req.placeId());
      }
    }
  }

  private static Long parseCampaignId(String metadata) {
    if (metadata == null || metadata.isBlank()) return null;
    try {
      // expects JSON like {"campaignId":123}
      int idx = metadata.indexOf("campaignId");
      if (idx < 0) return null;
      String digits = metadata.substring(idx).replaceAll("[^0-9]", " ").trim().split("\\s+")[0];
      return Long.parseLong(digits);
    } catch (Exception e) {
      return null;
    }
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}

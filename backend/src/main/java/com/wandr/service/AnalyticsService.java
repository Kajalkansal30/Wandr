package com.wandr.service;

import com.wandr.domain.AnalyticsEvent;
import com.wandr.domain.User;
import com.wandr.dto.AnalyticsDtos;
import com.wandr.repo.AnalyticsEventRepository;
import com.wandr.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

  private static final DateTimeFormatter ISO_DAY = DateTimeFormatter.ISO_LOCAL_DATE;

  private final AnalyticsEventRepository analyticsEventRepository;
  private final BoostService boostService;
  private final UserRepository userRepository;

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

  /** Server-side auth events for the admin activity board. */
  @Transactional
  public void trackAuth(User user, String eventType, String source) {
    if (user == null || eventType == null || eventType.isBlank()) return;
    String type = eventType.trim().toLowerCase().replace('-', '_');
    String email = user.getEmail() == null ? "" : user.getEmail().replace("\"", "");
    String role = user.getRole() == null ? "" : user.getRole().name();
    analyticsEventRepository.save(AnalyticsEvent.builder()
        .eventType(type)
        .userId(user.getId())
        .source(blankToNull(source) != null ? source : "auth")
        .metadata("{\"email\":\"" + email + "\",\"role\":\"" + role + "\"}")
        .build());
  }

  @Transactional(readOnly = true)
  public AnalyticsDtos.AdminActivityResponse adminActivity(int days) {
    int d = Math.min(90, Math.max(1, days));
    Instant from = Instant.now().minus(d, ChronoUnit.DAYS);
    Instant last24h = Instant.now().minus(24, ChronoUnit.HOURS);

    long logins = analyticsEventRepository.countByTypeSince("login", from);
    long signups = analyticsEventRepository.countByTypeSince("signup", from);
    long dau = analyticsEventRepository.countDistinctAuthUsersSince(last24h);
    long newUsers = userRepository.countCreatedSince(from);
    long unverified = userRepository.countByEmailVerifiedFalse();
    long placeViews = analyticsEventRepository.countByTypeSince("place_view", from);
    long claimStarts = analyticsEventRepository.countByTypeSince("claim_start", from);

    Map<String, Long> totals = new LinkedHashMap<>();
    totals.put("logins", logins);
    totals.put("signups", signups);
    totals.put("dau", dau);
    totals.put("newUsers", newUsers);
    totals.put("unverifiedUsers", unverified);
    totals.put("placeViews", placeViews);
    totals.put("claimStarts", claimStarts);
    totals.put("users", userRepository.count());

    List<AnalyticsDtos.CountByType> byType = analyticsEventRepository.countAllByTypeSince(from).stream()
        .map(row -> new AnalyticsDtos.CountByType(String.valueOf(row[0]), ((Number) row[1]).longValue()))
        .toList();

    List<AnalyticsEvent> authEvents = analyticsEventRepository.findRecentByTypes(
        List.of("login", "signup"),
        PageRequest.of(0, 40)
    );
    List<AnalyticsEvent> recent = analyticsEventRepository.findRecent(PageRequest.of(0, 40));

    Set<Long> userIds = authEvents.stream()
        .map(AnalyticsEvent::getUserId)
        .filter(id -> id != null)
        .collect(Collectors.toSet());
    recent.stream().map(AnalyticsEvent::getUserId).filter(id -> id != null).forEach(userIds::add);

    Map<Long, User> usersById = userIds.isEmpty()
        ? Map.of()
        : userRepository.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

    List<AnalyticsDtos.UserRow> recentUsers = userRepository.findTop30ByOrderByCreatedAtDesc().stream()
        .map(u -> new AnalyticsDtos.UserRow(
            u.getId(),
            u.getEmail(),
            u.getDisplayName(),
            u.getRole() != null ? u.getRole().name() : "USER",
            u.isEmailVerified(),
            u.getCreatedAt() != null ? u.getCreatedAt().toString() : null
        ))
        .toList();

    Map<String, Map<String, Long>> dailyMap = new LinkedHashMap<>();
    for (Object[] row : analyticsEventRepository.countDailyAuthSince(from)) {
      String day = String.valueOf(row[0]);
      String type = String.valueOf(row[1]);
      long cnt = ((Number) row[2]).longValue();
      dailyMap.computeIfAbsent(day, k -> new HashMap<>()).put(type, cnt);
    }
    List<AnalyticsDtos.DailyPoint> daily = new ArrayList<>();
    for (int i = d - 1; i >= 0; i--) {
      String day = Instant.now().minus(i, ChronoUnit.DAYS).atZone(ZoneOffset.UTC).toLocalDate().format(ISO_DAY);
      Map<String, Long> counts = dailyMap.getOrDefault(day, Map.of());
      Map<String, Long> normalized = new LinkedHashMap<>();
      normalized.put("login", counts.getOrDefault("login", 0L));
      normalized.put("signup", counts.getOrDefault("signup", 0L));
      daily.add(new AnalyticsDtos.DailyPoint(day, normalized));
    }

    return new AnalyticsDtos.AdminActivityResponse(
        d,
        totals,
        byType,
        authEvents.stream().map(e -> toActivityRow(e, usersById)).toList(),
        recent.stream().map(e -> toActivityRow(e, usersById)).toList(),
        recentUsers,
        daily
    );
  }

  private AnalyticsDtos.ActivityRow toActivityRow(AnalyticsEvent e, Map<Long, User> usersById) {
    User u = e.getUserId() != null ? usersById.get(e.getUserId()) : null;
    String email = u != null ? u.getEmail() : extractMeta(e.getMetadata(), "email");
    String name = u != null ? u.getDisplayName() : null;
    return new AnalyticsDtos.ActivityRow(
        e.getId(),
        e.getEventType(),
        e.getUserId(),
        email,
        name,
        e.getSource(),
        e.getDevice(),
        e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
    );
  }

  private static String extractMeta(String metadata, String key) {
    if (metadata == null || key == null) return null;
    String needle = "\"" + key + "\"";
    int i = metadata.indexOf(needle);
    if (i < 0) return null;
    int colon = metadata.indexOf(':', i);
    int q1 = metadata.indexOf('"', colon + 1);
    int q2 = q1 >= 0 ? metadata.indexOf('"', q1 + 1) : -1;
    if (q1 < 0 || q2 < 0) return null;
    return metadata.substring(q1 + 1, q2);
  }

  private static Long parseCampaignId(String metadata) {
    if (metadata == null || metadata.isBlank()) return null;
    try {
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

package com.wandr.service;

import com.wandr.domain.Place;
import com.wandr.domain.User;
import com.wandr.dto.AnalyticsDtos;
import com.wandr.repo.AnalyticsEventRepository;
import com.wandr.repo.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerAnalyticsService {

  private static final List<String> FUNNEL_ORDER = List.of(
      "place_view", "menu_view", "save_place", "direction_click"
  );

  private static final Map<String, String> FUNNEL_LABELS = Map.of(
      "place_view", "Profile views",
      "menu_view", "Menu views",
      "save_place", "Saves",
      "direction_click", "Direction requests",
      "call_click", "Calls",
      "share_place", "Shares"
  );

  private final AnalyticsEventRepository analyticsEventRepository;
  private final PlaceRepository placeRepository;

  public AnalyticsDtos.OwnerAnalyticsResponse summary(User owner, int days, Long placeIdFilter) {
    if (days < 1) days = 1;
    if (days > 90) days = 90;

    List<Place> owned = placeRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId());
    if (placeIdFilter != null) {
      owned = owned.stream().filter(p -> p.getId().equals(placeIdFilter)).toList();
      if (owned.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your listing");
      }
    }

    List<Long> placeIds = owned.stream().map(Place::getId).toList();
    Map<Long, String> names = owned.stream()
        .collect(Collectors.toMap(Place::getId, Place::getName, (a, b) -> a));

    if (placeIds.isEmpty()) {
      return empty(days);
    }

    Instant from = Instant.now().minus(days, ChronoUnit.DAYS);

    Map<String, Long> totals = toCountMap(analyticsEventRepository.countByType(placeIds, from));

    List<AnalyticsDtos.FunnelStep> funnel = FUNNEL_ORDER.stream()
        .map(key -> new AnalyticsDtos.FunnelStep(
            key,
            FUNNEL_LABELS.getOrDefault(key, key),
            totals.getOrDefault(key, 0L)
        ))
        .toList();

    // Intent extras available on totals (call_click / share_place)
    List<AnalyticsDtos.SourceShare> bySource = buildSources(
        analyticsEventRepository.countPlaceViewsBySource(placeIds, from)
    );

    List<AnalyticsDtos.DailyPoint> daily = buildDaily(
        analyticsEventRepository.countDailyByType(placeIds, from), days
    );

    Map<Long, Map<String, Long>> perPlace = new LinkedHashMap<>();
    for (Object[] row : analyticsEventRepository.countByPlaceAndType(placeIds, from)) {
      Long pid = ((Number) row[0]).longValue();
      String type = String.valueOf(row[1]);
      long cnt = ((Number) row[2]).longValue();
      perPlace.computeIfAbsent(pid, k -> new LinkedHashMap<>()).put(type, cnt);
    }

    List<AnalyticsDtos.PlaceBreakdown> places = placeIds.stream()
        .map(pid -> new AnalyticsDtos.PlaceBreakdown(
            pid,
            names.getOrDefault(pid, "Place"),
            ensureKeys(perPlace.getOrDefault(pid, Map.of()))
        ))
        .toList();

    // Ensure all known keys exist on totals
    Map<String, Long> fullTotals = new LinkedHashMap<>();
    for (String k : List.of("place_view", "menu_view", "save_place", "direction_click", "call_click", "share_place")) {
      fullTotals.put(k, totals.getOrDefault(k, 0L));
    }
    totals.forEach(fullTotals::putIfAbsent);

    return new AnalyticsDtos.OwnerAnalyticsResponse(days, fullTotals, funnel, bySource, daily, places);
  }

  private static Map<String, Long> ensureKeys(Map<String, Long> raw) {
    Map<String, Long> m = new LinkedHashMap<>();
    for (String k : List.of("place_view", "menu_view", "save_place", "direction_click", "call_click", "share_place")) {
      m.put(k, raw.getOrDefault(k, 0L));
    }
    raw.forEach(m::putIfAbsent);
    return m;
  }

  private AnalyticsDtos.OwnerAnalyticsResponse empty(int days) {
    Map<String, Long> zeros = new LinkedHashMap<>();
    for (String k : List.of("place_view", "menu_view", "save_place", "direction_click", "call_click", "share_place")) {
      zeros.put(k, 0L);
    }
    List<AnalyticsDtos.FunnelStep> funnel = FUNNEL_ORDER.stream()
        .map(key -> new AnalyticsDtos.FunnelStep(key, FUNNEL_LABELS.get(key), 0L))
        .toList();
    return new AnalyticsDtos.OwnerAnalyticsResponse(days, zeros, funnel, List.of(), List.of(), List.of());
  }

  private static Map<String, Long> toCountMap(List<Object[]> rows) {
    Map<String, Long> map = new LinkedHashMap<>();
    for (Object[] row : rows) {
      map.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
    }
    return map;
  }

  private static List<AnalyticsDtos.SourceShare> buildSources(List<Object[]> rows) {
    long total = 0;
    List<AnalyticsDtos.SourceShare> raw = new ArrayList<>();
    for (Object[] row : rows) {
      long c = ((Number) row[1]).longValue();
      total += c;
      raw.add(new AnalyticsDtos.SourceShare(String.valueOf(row[0]), c, 0));
    }
    long finalTotal = total;
    return raw.stream()
        .map(s -> new AnalyticsDtos.SourceShare(
            s.source(),
            s.count(),
            finalTotal == 0 ? 0 : Math.round(s.count() * 1000.0 / finalTotal) / 10.0
        ))
        .sorted(Comparator.comparingLong(AnalyticsDtos.SourceShare::count).reversed())
        .toList();
  }

  private static List<AnalyticsDtos.DailyPoint> buildDaily(List<Object[]> rows, int days) {
    Map<String, Map<String, Long>> byDay = new TreeMap<>();
    LocalDate start = LocalDate.now(ZoneOffset.UTC).minusDays(days - 1L);
    for (int i = 0; i < days; i++) {
      byDay.put(start.plusDays(i).toString(), new LinkedHashMap<>());
    }
    for (Object[] row : rows) {
      String day = row[0] == null ? null : String.valueOf(row[0]);
      if (day == null) continue;
      // java.sql.Date toString is yyyy-MM-dd
      if (day.length() > 10) day = day.substring(0, 10);
      String type = String.valueOf(row[1]);
      long cnt = ((Number) row[2]).longValue();
      byDay.computeIfAbsent(day, k -> new LinkedHashMap<>()).merge(type, cnt, Long::sum);
    }
    return byDay.entrySet().stream()
        .map(e -> new AnalyticsDtos.DailyPoint(e.getKey(), e.getValue()))
        .toList();
  }
}

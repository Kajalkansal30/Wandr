package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.SpottedDtos;
import com.wandr.repo.FavoriteRepository;
import com.wandr.repo.PlaceMediaRepository;
import com.wandr.repo.PlaceRepository;
import com.wandr.repo.SpotLikeRepository;
import com.wandr.repo.SpotReportRepository;
import com.wandr.security.VerifiedEmailGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpottedService {

  private final PlaceMediaRepository placeMediaRepository;
  private final PlaceRepository placeRepository;
  private final SpotLikeRepository spotLikeRepository;
  private final SpotReportRepository spotReportRepository;
  private final FavoriteRepository favoriteRepository;
  private final PlaceService placeService;

  @Transactional(readOnly = true)
  public List<SpottedDtos.SpotResponse> feed(
      User user, Double lat, Double lng, String filter, Integer limit, String prefs
  ) {
    int lim = limit == null || limit < 1 ? 40 : Math.min(limit, 100);
    String f = filter == null ? "all" : filter.trim().toLowerCase();

    // Bound DB scan — do not load every approved video into memory
    int scanLimit = Math.min(Math.max(lim * 5, 80), 250);
    List<PlaceMedia> media = placeMediaRepository
        .findByStatusAndMediaTypeOrderByCreatedAtDesc(
            MediaStatus.APPROVED,
            MediaType.VIDEO,
            org.springframework.data.domain.PageRequest.of(0, scanLimit)
        );

    Set<Long> placeIds = media.stream().map(PlaceMedia::getPlaceId).collect(Collectors.toSet());
    Map<Long, Place> places = placeRepository.findAllById(placeIds).stream()
        .collect(Collectors.toMap(Place::getId, p -> p, (a, b) -> a));

    Set<Long> liked = likedIds(user, media.stream().map(PlaceMedia::getId).toList());
    PreferenceSignal signal = buildPreferenceSignal(user, prefs);
    String tod = timeOfDayBucket();

    List<Scored> scored = new ArrayList<>();
    for (PlaceMedia m : media) {
      Place place = places.get(m.getPlaceId());
      if (place == null || place.getStatus() != PlaceStatus.APPROVED) continue;
      if (place.getOperatingStatus() == OperatingStatus.PERMANENTLY_CLOSED) continue;

      Double dist = distanceKm(lat, lng, place.getLat(), place.getLng());
      boolean isNew = (place.getOpenedDaysAgo() != null && place.getOpenedDaysAgo() <= 14)
          || m.getSpotKind() == SpotKind.NEW_CAFE;
      if ("new".equals(f) && !isNew) continue;
      if ("nearby".equals(f) && (dist == null || dist > 5.0)) continue;

      double score = (m.getLikeCount() != null ? m.getLikeCount() : 0) * 2.0;
      if (m.getCreatedAt() != null) {
        long ageHours = Math.max(1, (System.currentTimeMillis() - m.getCreatedAt().toEpochMilli()) / 3_600_000L);
        score += 48.0 / ageHours;
      }
      // Geographic preference — stronger near user
      if (dist != null) {
        score += Math.max(0, 14.0 - dist * 1.4);
      }
      // Adaptive taste from saves + explicit vibe chips
      score += tasteBoost(place, signal);
      // Time-of-day context (meal / ambience / late)
      score += timeOfDayBoost(m.getSpotKind(), place, tod);
      // Soft popularity for cold-start when no taste signal
      if (!signal.hasAny()) {
        score += Math.min(4.0, (place.getSavesThisWeek() != null ? place.getSavesThisWeek() : 0) * 0.4);
        score += (place.getRating() != null ? place.getRating() : 0) * 0.4;
      }

      scored.add(new Scored(m, place, dist, score));
    }

    if ("nearby".equals(f)) {
      scored.sort(Comparator
          .comparing((Scored s) -> s.distance == null ? Double.MAX_VALUE : s.distance)
          .thenComparing(s -> -s.score));
    } else {
      scored.sort(Comparator.comparingDouble((Scored s) -> -s.score));
    }

    return scored.stream()
        .limit(lim)
        .map(s -> SpottedDtos.SpotResponse.from(s.media, s.place, s.distance, liked.contains(s.media.getId())))
        .toList();
  }

  public List<SpottedDtos.SpotResponse> forPlace(User user, Long placeId) {
    placeService.requirePlace(placeId);
    Place place = placeRepository.findById(placeId).orElseThrow();
    List<PlaceMedia> media = placeMediaRepository
        .findByPlaceIdAndStatusAndMediaTypeOrderByCreatedAtDesc(placeId, MediaStatus.APPROVED, MediaType.VIDEO);
    Set<Long> liked = likedIds(user, media.stream().map(PlaceMedia::getId).toList());
    return media.stream()
        .map(m -> SpottedDtos.SpotResponse.from(m, place, null, liked.contains(m.getId())))
        .toList();
  }

  @Transactional
  public SpottedDtos.SpotResponse create(User user, SpottedDtos.CreateRequest req) {
    if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    VerifiedEmailGuard.requireVerified(user);
    if (req == null || req.placeId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "placeId is required");
    }
    if (req.url() == null || req.url().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url is required");
    }
    String url = requireHttpsUrl(req.url().trim(), "url");
    String thumbnailUrl = blankToNull(req.thumbnailUrl());
    if (thumbnailUrl != null) {
      thumbnailUrl = requireHttpsUrl(thumbnailUrl, "thumbnailUrl");
    }

    Place place = placeRepository.findByIdWithOwner(req.placeId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
    if (place.getStatus() != PlaceStatus.APPROVED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Café must be approved");
    }

    SpotKind kind = SpottedDtos.parseSpotKind(req.spotKind());
    if (kind == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "spotKind is required");
    }

    Integer durationSec = req.durationSec();
    if (durationSec != null && (durationSec < 1 || durationSec > 30)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "durationSec must be between 1 and 30");
    }

    boolean ownerUpload = place.getOwner() != null && place.getOwner().getId().equals(user.getId());

    PlaceMedia media = placeMediaRepository.save(PlaceMedia.builder()
        .placeId(place.getId())
        .userId(user.getId())
        .url(url)
        .thumbnailUrl(thumbnailUrl)
        .mediaType(MediaType.VIDEO)
        .spotKind(kind)
        .caption(blankToNull(req.caption()))
        .durationSec(durationSec)
        .likeCount(0)
        .source(ownerUpload ? MediaSource.OWNER : MediaSource.COMMUNITY)
        .status(MediaStatus.APPROVED)
        .build());

    return SpottedDtos.SpotResponse.from(media, place, null, false);
  }

  @Transactional
  public Map<String, Object> toggleLike(User user, Long mediaId) {
    if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    PlaceMedia media = placeMediaRepository.findById(mediaId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spot not found"));
    if (media.getMediaType() != MediaType.VIDEO) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a spot");
    }

    Optional<SpotLike> existing = spotLikeRepository.findByUserIdAndMediaId(user.getId(), mediaId);
    boolean liked;
    if (existing.isPresent()) {
      spotLikeRepository.delete(existing.get());
      media.setLikeCount(Math.max(0, (media.getLikeCount() == null ? 0 : media.getLikeCount()) - 1));
      liked = false;
    } else {
      spotLikeRepository.save(SpotLike.builder().userId(user.getId()).mediaId(mediaId).build());
      media.setLikeCount((media.getLikeCount() == null ? 0 : media.getLikeCount()) + 1);
      liked = true;
    }
    placeMediaRepository.save(media);
    return Map.of("liked", liked, "likeCount", media.getLikeCount());
  }

  @Transactional
  public void report(User user, Long mediaId, SpottedDtos.ReportRequest req) {
    if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    PlaceMedia media = placeMediaRepository.findById(mediaId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spot not found"));
    if (req == null || req.reason() == null || req.reason().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required");
    }
    spotReportRepository.save(SpotReport.builder()
        .mediaId(mediaId)
        .placeId(media.getPlaceId())
        .userId(user.getId())
        .reason(req.reason().trim())
        .note(blankToNull(req.note()))
        .status(ReportStatus.OPEN)
        .build());
  }

  private PreferenceSignal buildPreferenceSignal(User user, String prefsCsv) {
    Set<String> tags = new HashSet<>();
    Set<String> bestFor = new HashSet<>();
    Set<String> categories = new HashSet<>();
    Set<String> chips = parsePrefChips(prefsCsv);

    applyChipPriors(chips, tags, bestFor, categories);

    if (user != null) {
      var favPage = favoriteRepository.findByUserIdOrderByCreatedAtDesc(
          user.getId(),
          org.springframework.data.domain.PageRequest.of(0, 40)
      );
      Set<Long> favPlaceIds = favPage.getContent().stream()
          .map(Favorite::getPlace)
          .filter(Objects::nonNull)
          .map(Place::getId)
          .filter(Objects::nonNull)
          .collect(Collectors.toSet());
      if (!favPlaceIds.isEmpty()) {
        for (Place p : placeRepository.findAllById(favPlaceIds)) {
          if (p.getCategory() != null && !p.getCategory().isBlank()) {
            categories.add(p.getCategory().trim().toLowerCase(Locale.ROOT));
          }
          for (String t : csvTokens(p.getTags())) tags.add(t);
          for (String b : csvTokens(p.getBestFor())) bestFor.add(b);
        }
      }
    }

    return new PreferenceSignal(tags, bestFor, categories, chips);
  }

  private static void applyChipPriors(
      Set<String> chips, Set<String> tags, Set<String> bestFor, Set<String> categories
  ) {
    for (String chip : chips) {
      switch (chip) {
        case "coffee" -> {
          tags.add("coffee");
          categories.add("coffee");
          categories.add("cafe");
        }
        case "desserts" -> {
          tags.add("dessert");
          tags.add("desserts");
          tags.add("bakery");
          categories.add("desserts");
        }
        case "outdoor" -> {
          tags.add("outdoor");
          tags.add("garden");
          tags.add("rooftop");
          bestFor.add("outdoor");
        }
        case "study" -> {
          tags.add("quiet");
          tags.add("study");
          bestFor.add("study");
        }
        case "date" -> {
          tags.add("romantic");
          tags.add("date");
          bestFor.add("date");
        }
        case "work" -> {
          tags.add("work");
          tags.add("wifi");
          bestFor.add("work");
        }
        default -> {
          // Learned search/view tokens (e.g. southindian, dosa)
          if (chip.length() >= 3) tags.add(chip);
        }
      }
    }
  }

  private static double tasteBoost(Place place, PreferenceSignal signal) {
    if (signal == null || !signal.hasAny()) return 0;
    double score = 0;
    String cat = place.getCategory() != null ? place.getCategory().trim().toLowerCase(Locale.ROOT) : "";
    if (!cat.isEmpty() && signal.categories.contains(cat)) score += 3.0;
    for (String t : csvTokens(place.getTags())) {
      if (signal.tags.contains(t)) score += 2.0;
    }
    for (String b : csvTokens(place.getBestFor())) {
      if (signal.bestFor.contains(b)) score += 2.5;
    }
    return Math.min(12.0, score);
  }

  private static double timeOfDayBoost(SpotKind kind, Place place, String tod) {
    double score = 0;
    Set<String> best = new HashSet<>(csvTokens(place.getBestFor()));
    Set<String> tags = new HashSet<>(csvTokens(place.getTags()));
    if ("morning".equals(tod)) {
      if (kind == SpotKind.AMBIENCE || kind == SpotKind.NEW_CAFE) score += 2;
      if (best.contains("study") || best.contains("work") || tags.contains("coffee")) score += 2;
    } else if ("lunch".equals(tod)) {
      if (kind == SpotKind.FOOD || kind == SpotKind.NEW_MENU || kind == SpotKind.OFFER) score += 2.5;
    } else if ("afternoon".equals(tod)) {
      if (kind == SpotKind.FOOD || kind == SpotKind.HIDDEN_GEM) score += 1.5;
      if (tags.contains("dessert") || tags.contains("outdoor")) score += 1.5;
    } else if ("evening".equals(tod)) {
      if (kind == SpotKind.AMBIENCE || kind == SpotKind.EXPERIENCE || kind == SpotKind.EVENT) score += 2.5;
      if (best.contains("date")) score += 2;
    } else { // late
      if (kind == SpotKind.FOOD || kind == SpotKind.OFFER) score += 2;
      if (tags.contains("late")) score += 2;
    }
    return score;
  }

  private static String timeOfDayBucket() {
    int h = LocalTime.now(ZoneId.of("Asia/Kolkata")).getHour();
    if (h >= 5 && h < 11) return "morning";
    if (h >= 11 && h < 15) return "lunch";
    if (h >= 15 && h < 18) return "afternoon";
    if (h >= 18 && h < 22) return "evening";
    return "late";
  }

  private static Set<String> parsePrefChips(String prefsCsv) {
    if (prefsCsv == null || prefsCsv.isBlank()) return Set.of();
    return Arrays.stream(prefsCsv.split("[,|]"))
        .map(s -> s.trim().toLowerCase(Locale.ROOT))
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toCollection(LinkedHashSet::new));
  }

  private static List<String> csvTokens(String csv) {
    if (csv == null || csv.isBlank()) return List.of();
    return Arrays.stream(csv.split("[,|]"))
        .map(s -> s.trim().toLowerCase(Locale.ROOT))
        .filter(s -> !s.isEmpty())
        .toList();
  }

  private Set<Long> likedIds(User user, List<Long> mediaIds) {
    if (user == null || mediaIds == null || mediaIds.isEmpty()) return Set.of();
    return spotLikeRepository.findByUserIdAndMediaIdIn(user.getId(), mediaIds).stream()
        .map(SpotLike::getMediaId)
        .collect(Collectors.toSet());
  }

  private static Double distanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
    double r = 6371.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private static String blankToNull(String s) {
    if (s == null) return null;
    String t = s.trim();
    return t.isEmpty() ? null : t;
  }

  /** Media binaries live in Cloudinary (or any https host); never store blobs in Postgres. */
  private static String requireHttpsUrl(String url, String field) {
    if (!url.startsWith("https://")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be an https URL");
    }
    return url;
  }

  private record Scored(PlaceMedia media, Place place, Double distance, double score) {}

  private record PreferenceSignal(
      Set<String> tags,
      Set<String> bestFor,
      Set<String> categories,
      Set<String> chips
  ) {
    boolean hasAny() {
      return !tags.isEmpty() || !bestFor.isEmpty() || !categories.isEmpty() || !chips.isEmpty();
    }
  }
}

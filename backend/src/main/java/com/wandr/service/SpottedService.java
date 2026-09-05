package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.SpottedDtos;
import com.wandr.repo.PlaceMediaRepository;
import com.wandr.repo.PlaceRepository;
import com.wandr.repo.SpotLikeRepository;
import com.wandr.repo.SpotReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpottedService {

  private final PlaceMediaRepository placeMediaRepository;
  private final PlaceRepository placeRepository;
  private final SpotLikeRepository spotLikeRepository;
  private final SpotReportRepository spotReportRepository;
  private final PlaceService placeService;

  public List<SpottedDtos.SpotResponse> feed(User user, Double lat, Double lng, String filter, Integer limit) {
    int lim = limit == null || limit < 1 ? 40 : Math.min(limit, 100);
    String f = filter == null ? "all" : filter.trim().toLowerCase();

    List<PlaceMedia> media = placeMediaRepository
        .findByStatusAndMediaTypeOrderByCreatedAtDesc(MediaStatus.APPROVED, MediaType.VIDEO);

    Set<Long> placeIds = media.stream().map(PlaceMedia::getPlaceId).collect(Collectors.toSet());
    Map<Long, Place> places = placeRepository.findAllById(placeIds).stream()
        .collect(Collectors.toMap(Place::getId, p -> p, (a, b) -> a));

    Set<Long> liked = likedIds(user, media.stream().map(PlaceMedia::getId).toList());

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
      if (dist != null) {
        score += Math.max(0, 10.0 - dist);
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
    if (req == null || req.placeId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "placeId is required");
    }
    if (req.url() == null || req.url().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url is required");
    }
    String url = req.url().trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url must be http(s)");
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

    boolean ownerUpload = place.getOwner() != null && place.getOwner().getId().equals(user.getId());

    PlaceMedia media = placeMediaRepository.save(PlaceMedia.builder()
        .placeId(place.getId())
        .userId(user.getId())
        .url(url)
        .thumbnailUrl(blankToNull(req.thumbnailUrl()))
        .mediaType(MediaType.VIDEO)
        .spotKind(kind)
        .caption(blankToNull(req.caption()))
        .durationSec(req.durationSec())
        .likeCount(0)
        .source(ownerUpload ? MediaSource.OWNER : MediaSource.COMMUNITY)
        .status(ownerUpload || user.getRole() == Role.ADMIN ? MediaStatus.APPROVED : MediaStatus.PENDING)
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

  private record Scored(PlaceMedia media, Place place, Double distance, double score) {}
}

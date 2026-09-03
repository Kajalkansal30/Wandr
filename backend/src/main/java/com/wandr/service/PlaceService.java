package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.PlaceDtos;
import com.wandr.repo.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaceService {

  private static final String DEFAULT_IMAGE =
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80";

  private final PlaceRepository placeRepository;
  private final BoostService boostService;

  @Transactional(readOnly = true)
  public List<PlaceDtos.PlaceResponse> listApproved(Double lat, Double lng) {
    var activeBoosts = boostService.activeByPlaceId();
    return placeRepository.findByStatusOrderByCreatedAtDesc(PlaceStatus.APPROVED).stream()
        .filter(p -> p.getOperatingStatus() != OperatingStatus.PERMANENTLY_CLOSED)
        .map(p -> boostService.enrich(p, distanceKm(lat, lng, p.getLat(), p.getLng()), activeBoosts))
        .sorted(Comparator.comparing(r -> r.distance() == null ? Double.MAX_VALUE : r.distance()))
        .toList();
  }

  @Transactional(readOnly = true)
  public PlaceDtos.PlaceResponse getApproved(Long id, Double lat, Double lng) {
    Place place = placeRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
    if (place.getStatus() != PlaceStatus.APPROVED) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found");
    }
    return boostService.enrich(place, distanceKm(lat, lng, place.getLat(), place.getLng()), boostService.activeByPlaceId());
  }

  @Transactional(readOnly = true)
  public PlaceDtos.PlaceResponse getAny(Long id) {
    Place place = placeRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
    return PlaceDtos.PlaceResponse.from(place, null);
  }

  @Transactional(readOnly = true)
  public List<PlaceDtos.PlaceResponse> listByStatus(PlaceStatus status) {
    if (status == PlaceStatus.PENDING_REVIEW || status == PlaceStatus.PENDING) {
      return placeRepository.findAll().stream()
          .filter(p -> p.getStatus() != null && p.getStatus().isPendingReview())
          .sorted(Comparator.comparing(Place::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
          .map(p -> PlaceDtos.PlaceResponse.from(p, null))
          .toList();
    }
    return placeRepository.findByStatusOrderByCreatedAtDesc(status).stream()
        .map(p -> PlaceDtos.PlaceResponse.from(p, null))
        .toList();
  }

  public long countByStatus(PlaceStatus status) {
    if (status == PlaceStatus.PENDING_REVIEW || status == PlaceStatus.PENDING) {
      return placeRepository.findAll().stream()
          .filter(p -> p.getStatus() != null && p.getStatus().isPendingReview())
          .count();
    }
    return placeRepository.countByStatus(status);
  }

  public long countByOwnership(OwnershipStatus status) {
    return placeRepository.countByOwnershipStatus(status);
  }

  @Transactional(readOnly = true)
  public List<PlaceDtos.PlaceResponse> listByOwner(User owner) {
    return placeRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
        .map(p -> PlaceDtos.PlaceResponse.from(p, null))
        .toList();
  }

  @Transactional(readOnly = true)
  public PlaceDtos.PlaceResponse getOwned(User owner, Long id) {
    return PlaceDtos.PlaceResponse.from(requireOwned(owner, id), null);
  }

  @Transactional(readOnly = true)
  public Place requireOwned(User owner, Long id) {
    Place place = placeRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
    if (place.getOwner() == null || !place.getOwner().getId().equals(owner.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your listing");
    }
    return place;
  }

  public Place requirePlace(Long id) {
    return placeRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
  }

  @Transactional
  public PlaceDtos.PlaceResponse create(User owner, PlaceDtos.PlaceUpsertRequest req) {
    if (req.name() == null || req.name().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
    }
    LocationType locType = parseLocationType(req.locationType());
    Place place = Place.builder()
        .name(req.name().trim())
        .category(blankToNull(req.category()))
        .type(resolveType(req.type(), req.category(), locType))
        .locationType(locType)
        .description(blankToNull(req.description()))
        .address(blankToNull(req.address()))
        .city(blankToNull(req.city()))
        .exactAddressPrivate(blankToNull(req.exactAddressPrivate()))
        .serviceArea(blankToNull(req.serviceArea()))
        .imageUrl(blankToNull(req.image()) != null ? req.image().trim() : DEFAULT_IMAGE)
        .phone(blankToNull(req.phone()))
        .whatsapp(blankToNull(req.whatsapp()))
        .website(blankToNull(req.website()))
        .instagram(blankToNull(req.instagram()))
        .hours(blankToNull(req.hours()))
        .lat(req.lat())
        .lng(req.lng())
        .priceLevel(req.priceLevel() != null ? req.priceLevel() : 2)
        .avgCostForTwo(req.avgCostForTwo())
        .tags(join(req.tags()))
        .bestFor(join(req.bestFor()))
        .openingDate(req.openingDate())
        .status(PlaceStatus.PENDING_REVIEW)
        .ownershipStatus(OwnershipStatus.OWNER_CLAIMED)
        .operatingStatus(OperatingStatus.OPEN)
        .claimedAt(java.time.Instant.now())
        .owner(owner)
        .rating(0.0)
        .reviewCount(0)
        .savedCount(0)
        .build();
    return PlaceDtos.PlaceResponse.from(placeRepository.save(place), null);
  }

  @Transactional
  public PlaceDtos.PlaceResponse createCommunity(User user, PlaceDtos.CommunitySubmitRequest req) {
    if (req == null || req.name() == null || req.name().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
    }
    LocationType locType = parseLocationType(req.locationType());
    Place place = Place.builder()
        .name(req.name().trim())
        .category(blankToNull(req.category()))
        .type(resolveType(null, req.category(), locType))
        .locationType(locType)
        .description(blankToNull(req.description()))
        .address(blankToNull(req.address()))
        .city(blankToNull(req.city()))
        .imageUrl(blankToNull(req.image()) != null ? req.image().trim() : DEFAULT_IMAGE)
        .instagram(blankToNull(req.instagram()))
        .lat(req.lat())
        .lng(req.lng())
        .priceLevel(req.priceLevel() != null ? req.priceLevel() : 2)
        .tags(join(req.tags()))
        .status(PlaceStatus.PENDING_REVIEW)
        .ownershipStatus(OwnershipStatus.UNCLAIMED)
        .operatingStatus(OperatingStatus.OPEN)
        .rating(0.0)
        .reviewCount(0)
        .savedCount(0)
        .build();
    return PlaceDtos.PlaceResponse.from(placeRepository.save(place), null);
  }

  @Transactional
  public PlaceDtos.PlaceResponse update(User owner, Long id, PlaceDtos.PlaceUpsertRequest req) {
    Place place = requireOwned(owner, id);
    if (req.name() != null && !req.name().isBlank()) place.setName(req.name().trim());
    if (req.category() != null) place.setCategory(blankToNull(req.category()));
    if (req.locationType() != null) place.setLocationType(parseLocationType(req.locationType()));
    if (req.type() != null || req.category() != null || req.locationType() != null) {
      place.setType(resolveType(req.type(), req.category() != null ? req.category() : place.getCategory(), place.getLocationType()));
    }
    if (req.description() != null) place.setDescription(blankToNull(req.description()));
    if (req.address() != null) place.setAddress(blankToNull(req.address()));
    if (req.city() != null) place.setCity(blankToNull(req.city()));
    if (req.exactAddressPrivate() != null) place.setExactAddressPrivate(blankToNull(req.exactAddressPrivate()));
    if (req.serviceArea() != null) place.setServiceArea(blankToNull(req.serviceArea()));
    if (req.image() != null && !req.image().isBlank()) place.setImageUrl(req.image().trim());
    if (req.phone() != null) place.setPhone(blankToNull(req.phone()));
    if (req.whatsapp() != null) place.setWhatsapp(blankToNull(req.whatsapp()));
    if (req.website() != null) place.setWebsite(blankToNull(req.website()));
    if (req.instagram() != null) place.setInstagram(blankToNull(req.instagram()));
    if (req.hours() != null) place.setHours(blankToNull(req.hours()));
    if (req.lat() != null) place.setLat(req.lat());
    if (req.lng() != null) place.setLng(req.lng());
    if (req.priceLevel() != null) place.setPriceLevel(req.priceLevel());
    if (req.avgCostForTwo() != null) place.setAvgCostForTwo(req.avgCostForTwo());
    if (req.tags() != null) place.setTags(join(req.tags()));
    if (req.bestFor() != null) place.setBestFor(join(req.bestFor()));
    if (req.openingDate() != null) place.setOpeningDate(req.openingDate());
    if (place.getStatus() == PlaceStatus.APPROVED || place.getStatus() == PlaceStatus.REJECTED) {
      place.setStatus(PlaceStatus.PENDING_REVIEW);
    }
    return PlaceDtos.PlaceResponse.from(placeRepository.save(place), null);
  }

  public PlaceDtos.PlaceResponse setStatus(Long id, PlaceStatus status) {
    Place place = requirePlace(id);
    place.setStatus(status);
    if (status == PlaceStatus.CLOSED) {
      place.setClosedAt(java.time.Instant.now());
      place.setOperatingStatus(OperatingStatus.PERMANENTLY_CLOSED);
    }
    if (status == PlaceStatus.SUSPENDED) {
      place.setTemporarilyClosed(true);
    }
    return PlaceDtos.PlaceResponse.from(placeRepository.save(place), null);
  }

  public Place save(Place place) {
    return placeRepository.save(place);
  }

  private static LocationType parseLocationType(String raw) {
    if (raw == null || raw.isBlank()) return LocationType.CAFE;
    try {
      return LocationType.valueOf(raw.trim().toUpperCase().replace('-', '_').replace(' ', '_'));
    } catch (Exception e) {
      String c = raw.toLowerCase();
      if (c.contains("truck")) return LocationType.FOOD_TRUCK;
      if (c.contains("street")) return LocationType.STREET_FOOD;
      if (c.contains("bakery") || c.contains("home")) return LocationType.HOME_BAKERY;
      if (c.contains("pop")) return LocationType.POP_UP;
      if (c.contains("restaurant")) return LocationType.RESTAURANT;
      return LocationType.CAFE;
    }
  }

  private static String resolveType(String type, String category, LocationType loc) {
    if (type != null && !type.isBlank()) return type.trim().toLowerCase();
    if (loc != null) {
      return switch (loc) {
        case FOOD_TRUCK -> "food-truck";
        case STREET_FOOD -> "street-food";
        case HOME_BAKERY, HOME_KITCHEN -> "home-business";
        case POP_UP -> "pop-up";
        case RESTAURANT -> "restaurant";
        default -> "cafe";
      };
    }
    String c = category == null ? "" : category.toLowerCase();
    if (c.contains("street")) return "street-food";
    if (c.contains("truck")) return "food-truck";
    return "cafe";
  }

  private static String join(List<String> values) {
    if (values == null || values.isEmpty()) return null;
    return values.stream()
        .filter(s -> s != null && !s.isBlank())
        .map(String::trim)
        .collect(Collectors.joining(","));
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  public static Double distanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
    double r = 6371.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

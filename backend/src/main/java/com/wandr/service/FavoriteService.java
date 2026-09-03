package com.wandr.service;

import com.wandr.domain.Favorite;
import com.wandr.domain.Place;
import com.wandr.domain.User;
import com.wandr.dto.PlaceDtos;
import com.wandr.repo.FavoriteRepository;
import com.wandr.repo.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FavoriteService {

  private final FavoriteRepository favoriteRepository;
  private final PlaceRepository placeRepository;

  public List<PlaceDtos.PlaceResponse> list(User user) {
    return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(Favorite::getPlace)
        .map(p -> PlaceDtos.PlaceResponse.from(p, null))
        .toList();
  }

  public List<Long> ids(User user) {
    return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(f -> f.getPlace().getId())
        .toList();
  }

  @Transactional
  public Map<String, Object> toggle(User user, Long placeId) {
    Place place = placeRepository.findById(placeId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));

    boolean exists = favoriteRepository.existsByUserIdAndPlaceId(user.getId(), placeId);
    if (exists) {
      favoriteRepository.deleteByUserIdAndPlaceId(user.getId(), placeId);
      place.setSavedCount(Math.max(0, (place.getSavedCount() == null ? 0 : place.getSavedCount()) - 1));
      placeRepository.save(place);
      return Map.of("saved", false, "placeId", placeId);
    }

    favoriteRepository.save(Favorite.builder().user(user).place(place).build());
    place.setSavedCount((place.getSavedCount() == null ? 0 : place.getSavedCount()) + 1);
    place.setSavesThisWeek((place.getSavesThisWeek() == null ? 0 : place.getSavesThisWeek()) + 1);
    placeRepository.save(place);
    return Map.of("saved", true, "placeId", placeId);
  }
}

package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.PlaceDtos;
import com.wandr.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

  private final FavoriteService favoriteService;

  @GetMapping
  public List<PlaceDtos.PlaceResponse> list(@AuthenticationPrincipal User user) {
    return favoriteService.list(user);
  }

  @GetMapping("/ids")
  public List<Long> ids(@AuthenticationPrincipal User user) {
    return favoriteService.ids(user);
  }

  @PostMapping("/{placeId}/toggle")
  public Map<String, Object> toggle(
      @AuthenticationPrincipal User user,
      @PathVariable Long placeId
  ) {
    return favoriteService.toggle(user, placeId);
  }
}

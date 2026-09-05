package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.SpottedDtos;
import com.wandr.service.SpottedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SpottedController {

  private final SpottedService spottedService;

  @GetMapping("/api/spotted/feed")
  public List<SpottedDtos.SpotResponse> feed(
      @AuthenticationPrincipal User user,
      @RequestParam(required = false) Double lat,
      @RequestParam(required = false) Double lng,
      @RequestParam(required = false, defaultValue = "all") String filter,
      @RequestParam(required = false) Integer limit
  ) {
    return spottedService.feed(user, lat, lng, filter, limit);
  }

  @PostMapping("/api/spotted")
  public SpottedDtos.SpotResponse create(
      @AuthenticationPrincipal User user,
      @RequestBody SpottedDtos.CreateRequest body
  ) {
    return spottedService.create(user, body);
  }

  @PostMapping("/api/spotted/{id}/like")
  public Map<String, Object> like(
      @AuthenticationPrincipal User user,
      @PathVariable Long id
  ) {
    return spottedService.toggleLike(user, id);
  }

  @PostMapping("/api/spotted/{id}/report")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void report(
      @AuthenticationPrincipal User user,
      @PathVariable Long id,
      @RequestBody SpottedDtos.ReportRequest body
  ) {
    spottedService.report(user, id, body);
  }

  @GetMapping("/api/places/{id}/spots")
  public List<SpottedDtos.SpotResponse> placeSpots(
      @AuthenticationPrincipal User user,
      @PathVariable Long id
  ) {
    return spottedService.forPlace(user, id);
  }
}

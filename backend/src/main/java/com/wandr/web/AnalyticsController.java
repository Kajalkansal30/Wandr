package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.AnalyticsDtos;
import com.wandr.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

  private final AnalyticsService analyticsService;

  @PostMapping("/events")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void track(
      @RequestBody AnalyticsDtos.TrackRequest body,
      @AuthenticationPrincipal User user
  ) {
    analyticsService.track(body, user);
  }
}

package com.wandr.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Liveness vs readiness:
 * - /api/health — process is up (no DB). Safe for external uptime monitors.
 * - /api/ready — can serve traffic (DB reachable). Used by Render healthCheckPath.
 */
@RestController
@RequiredArgsConstructor
public class HealthController {

  private final JdbcTemplate jdbcTemplate;

  @GetMapping("/api/health")
  public Map<String, String> liveness() {
    return Map.of("status", "UP", "service", "wandr-backend");
  }

  @GetMapping("/api/ready")
  public ResponseEntity<Map<String, String>> readiness() {
    try {
      Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
      if (one == null || one != 1) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("status", "DOWN", "database", "DOWN"));
      }
      return ResponseEntity.ok(Map.of("status", "UP", "database", "UP"));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(Map.of("status", "DOWN", "database", "DOWN"));
    }
  }
}

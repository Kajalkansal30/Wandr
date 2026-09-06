package com.wandr.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

  private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

  private record Rule(String method, String pattern, int capacity, Duration period) {}

  private static final Rule[] RULES = {
      new Rule("POST", "/api/auth/login", 10, Duration.ofMinutes(1)),
      new Rule("POST", "/api/auth/signup", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/auth/forgot-password", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/auth/reset-password", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/places/*/reviews", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/places/*/report", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/spotted/*/report", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/media/cloudinary-sign", 30, Duration.ofHours(1)),
  };

  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    Rule rule = matchRule(request);
    if (rule != null) {
      String ip = clientIp(request);
      String key = rule.method + ":" + rule.pattern + ":" + ip;
      Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket(rule.capacity, rule.period));
      if (!bucket.tryConsume(1)) {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getOutputStream().write(
            "{\"message\":\"Too many requests. Please try again later.\"}".getBytes(StandardCharsets.UTF_8)
        );
        return;
      }
    }
    filterChain.doFilter(request, response);
  }

  private static Rule matchRule(HttpServletRequest request) {
    String method = request.getMethod();
    String path = request.getRequestURI();
    for (Rule rule : RULES) {
      if (rule.method.equals(method) && PATH_MATCHER.match(rule.pattern, path)) {
        return rule;
      }
    }
    return null;
  }

  private static Bucket newBucket(int capacity, Duration period) {
    Bandwidth limit = Bandwidth.builder()
        .capacity(capacity)
        .refillIntervally(capacity, period)
        .build();
    return Bucket.builder().addLimit(limit).build();
  }

  static String clientIp(HttpServletRequest request) {
    String xff = request.getHeader("X-Forwarded-For");
    if (xff != null && !xff.isBlank()) {
      String first = xff.split(",")[0].trim();
      if (!first.isEmpty()) return first;
    }
    return request.getRemoteAddr();
  }
}

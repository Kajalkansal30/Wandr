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
      new Rule("POST", "/api/auth/resend-verification", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/places/*/claim", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/places/claims/*/phone/start", 5, Duration.ofMinutes(15)),
      new Rule("POST", "/api/places/claims/*/phone/verify", 10, Duration.ofMinutes(15)),
      new Rule("POST", "/api/places/claims/*/email/start", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/places/claims/*/email/verify", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/places/claims/*/domain/start", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/places/claims/*/domain/check", 20, Duration.ofHours(1)),
      new Rule("POST", "/api/places/claims/*/video", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/places/claims/*/document", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/places/*/reviews", 5, Duration.ofHours(1)),
      new Rule("POST", "/api/places/*/report", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/spotted/*/report", 10, Duration.ofHours(1)),
      new Rule("POST", "/api/media/cloudinary-sign", 30, Duration.ofHours(1)),
  };

  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
  private static final int MAX_BUCKETS = 10_000;

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
      if (buckets.size() > MAX_BUCKETS) {
        buckets.clear();
      }
      Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket(rule.capacity, rule.period));
      if (!bucket.tryConsume(1)) {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getOutputStream().write(
            "{\"status\":429,\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests. Please try again later.\"}"
                .getBytes(StandardCharsets.UTF_8)
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

  /**
   * Client IP for rate limiting.
   * Prefer Render's {@code True-Client-Ip} / rightmost trusted hop.
   * Only use X-Forwarded-For when remote addr is a private/proxy hop (do not trust raw client XFF alone).
   * NOTE: in-memory buckets are per-instance — use Redis before horizontal scale.
   */
  static String clientIp(HttpServletRequest request) {
    String trueClient = request.getHeader("True-Client-Ip");
    if (trueClient != null && !trueClient.isBlank()) {
      return trueClient.trim();
    }
    String remote = request.getRemoteAddr();
    String xff = request.getHeader("X-Forwarded-For");
    if (xff != null && !xff.isBlank() && isProxyHop(remote)) {
      String[] parts = xff.split(",");
      String first = parts[0].trim();
      if (!first.isEmpty()) return first;
    }
    return remote != null ? remote : "unknown";
  }

  private static boolean isProxyHop(String addr) {
    if (addr == null || addr.isBlank()) return false;
    return addr.startsWith("10.")
        || addr.startsWith("192.168.")
        || addr.startsWith("172.16.")
        || addr.startsWith("172.17.")
        || addr.startsWith("172.18.")
        || addr.startsWith("172.19.")
        || addr.startsWith("127.")
        || "0:0:0:0:0:0:0:1".equals(addr)
        || "::1".equals(addr);
  }
}

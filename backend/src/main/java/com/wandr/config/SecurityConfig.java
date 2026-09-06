package com.wandr.config;

import com.wandr.security.JwtAuthFilter;
import com.wandr.security.RateLimitFilter;
import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final RateLimitFilter rateLimitFilter;

  @Value("${wandr.cors.allowed-origin-patterns}")
  private String allowedOriginPatterns;

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .headers(headers -> {
          headers.frameOptions(frame -> frame.deny());
          headers.contentTypeOptions(Customizer.withDefaults());
          headers.referrerPolicy(referrer -> referrer
              .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
          headers.httpStrictTransportSecurity(hsts -> hsts
              .includeSubDomains(true)
              .maxAgeInSeconds(31536000));
          headers.contentSecurityPolicy(csp -> csp
              .policyDirectives("default-src 'none'; frame-ancestors 'none'"));
          headers.permissionsPolicy(permissions -> permissions
              .policy("geolocation=(), microphone=(), camera=()"));
        })
        .authorizeHttpRequests(auth -> auth
            .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD).permitAll()
            .requestMatchers("/error").permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/api/health").permitAll()
            .requestMatchers(
                HttpMethod.POST,
                "/api/auth/login",
                "/api/auth/signup",
                "/api/auth/forgot-password",
                "/api/auth/reset-password",
                "/api/auth/verify-email",
                "/api/auth/refresh",
                "/api/auth/logout"
            ).permitAll()
            .requestMatchers(HttpMethod.POST, "/api/analytics/events").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/places", "/api/places/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/spotted/feed").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/media/cloudinary-sign").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/spotted").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/spotted/*/like").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/spotted/*/report").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/places/community").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/places/*/claim").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/places/*/confirm").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/places/*/report").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/places/*/reviews").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/places/*/media").authenticated()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/owner/**").hasAnyRole("OWNER", "ADMIN")
            .anyRequest().authenticated()
        )
        // Register JWT first so RateLimitFilter can anchor before it (Spring Security 6.4+)
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(rateLimitFilter, JwtAuthFilter.class);

    return http.build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    List<String> patterns = Arrays.stream(allowedOriginPatterns.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();
    if (patterns.isEmpty()) {
      config.setAllowedOriginPatterns(List.of(
          "http://localhost:*",
          "http://127.0.0.1:*"
      ));
    } else {
      config.setAllowedOriginPatterns(patterns);
    }
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}

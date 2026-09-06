package com.wandr.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

  private final String from;
  private final String resendApiKey;
  private final String webBaseUrl;
  private final RestClient restClient;

  public EmailService(
      @Value("${wandr.email.from}") String from,
      @Value("${wandr.email.resend-api-key:}") String resendApiKey,
      @Value("${wandr.app.web-base-url}") String webBaseUrl
  ) {
    this.from = from;
    this.resendApiKey = resendApiKey == null ? "" : resendApiKey.trim();
    this.webBaseUrl = webBaseUrl.endsWith("/") ? webBaseUrl.substring(0, webBaseUrl.length() - 1) : webBaseUrl;
    this.restClient = RestClient.builder().baseUrl("https://api.resend.com").build();
  }

  public void sendVerification(String to, String token) {
    String link = webBaseUrl + "/verify-email?token=" + token;
    String html = """
        <p>Welcome to Wandr!</p>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="%s">Verify email</a></p>
        <p>This link expires in 24 hours.</p>
        """.formatted(link);
    sendSimple(to, "Verify your Wandr email", html);
  }

  public void sendPasswordReset(String to, String token) {
    String link = webBaseUrl + "/reset-password?token=" + token;
    String html = """
        <p>We received a request to reset your Wandr password.</p>
        <p><a href="%s">Reset password</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
        """.formatted(link);
    sendSimple(to, "Reset your Wandr password", html);
  }

  public void sendPasswordChanged(String to) {
    String html = """
        <p>Your Wandr password was successfully changed.</p>
        <p>If you did not make this change, reset your password immediately and contact support.</p>
        """;
    sendSimple(to, "Your Wandr password was changed", html);
  }

  public void sendNewLogin(String to) {
    String html = """
        <p>Your Wandr account was accessed from a new sign-in.</p>
        <p>If this was you, no action is needed. If not, reset your password right away.</p>
        """;
    sendSimple(to, "New sign-in on your Wandr account", html);
  }

  public void sendSimple(String to, String subject, String html) {
    if (resendApiKey.isBlank()) {
      log.info("Email (dev/no Resend key) to={} subject={} html={}", to, subject, html);
      return;
    }
    restClient.post()
        .uri("/emails")
        .contentType(MediaType.APPLICATION_JSON)
        .header("Authorization", "Bearer " + resendApiKey)
        .body(Map.of(
            "from", from,
            "to", List.of(to),
            "subject", subject,
            "html", html
        ))
        .retrieve()
        .toBodilessEntity();
  }
}

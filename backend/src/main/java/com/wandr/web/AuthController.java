package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.AuthDtos;
import com.wandr.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  public static final String REFRESH_COOKIE = "wandr_refresh";

  private final AuthService authService;

  @Value("${wandr.jwt.refresh-expiration-ms:604800000}")
  private long refreshExpirationMs;

  @Value("${wandr.app.web-base-url:http://localhost:5173}")
  private String webBaseUrl;

  @PostMapping("/signup")
  public AuthDtos.AuthResponse signup(
      @Valid @RequestBody AuthDtos.SignupRequest request,
      HttpServletResponse response
  ) {
    AuthService.AuthResult result = authService.signup(request);
    setRefreshCookie(response, result.refreshToken());
    return result.response();
  }

  @PostMapping("/login")
  public AuthDtos.AuthResponse login(
      @Valid @RequestBody AuthDtos.LoginRequest request,
      HttpServletResponse response
  ) {
    AuthService.AuthResult result = authService.login(request);
    setRefreshCookie(response, result.refreshToken());
    return result.response();
  }

  @PostMapping("/verify-email")
  public AuthDtos.MessageResponse verifyEmail(@Valid @RequestBody AuthDtos.VerifyEmailRequest request) {
    return authService.verifyEmail(request.token());
  }

  @PostMapping("/forgot-password")
  public AuthDtos.MessageResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
    return authService.forgotPassword(request.email());
  }

  @PostMapping("/reset-password")
  public AuthDtos.MessageResponse resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
    return authService.resetPassword(request.token(), request.newPassword());
  }

  @PostMapping("/change-password")
  public AuthDtos.MessageResponse changePassword(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody AuthDtos.ChangePasswordRequest request,
      HttpServletResponse response
  ) {
    requireUser(user);
    AuthDtos.MessageResponse msg = authService.changePassword(user, request.oldPassword(), request.newPassword());
    clearRefreshCookie(response);
    return msg;
  }

  @PostMapping("/refresh")
  public AuthDtos.RefreshResponse refresh(HttpServletRequest request, HttpServletResponse response) {
    String raw = readRefreshCookie(request);
    AuthService.AuthResult result = authService.refresh(raw);
    setRefreshCookie(response, result.refreshToken());
    return new AuthDtos.RefreshResponse(result.response().token(), result.response().emailVerified());
  }

  @PostMapping("/logout")
  public AuthDtos.MessageResponse logout(HttpServletRequest request, HttpServletResponse response) {
    authService.logout(readRefreshCookie(request));
    clearRefreshCookie(response);
    return new AuthDtos.MessageResponse("Logged out");
  }

  @PostMapping("/logout-all")
  public AuthDtos.MessageResponse logoutAll(
      @AuthenticationPrincipal User user,
      HttpServletResponse response
  ) {
    requireUser(user);
    authService.logoutAll(user.getId());
    clearRefreshCookie(response);
    return new AuthDtos.MessageResponse("Logged out everywhere");
  }

  @DeleteMapping("/account")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAccount(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody AuthDtos.DeleteAccountRequest request,
      HttpServletResponse response
  ) {
    requireUser(user);
    authService.deleteAccount(user, request.password());
    clearRefreshCookie(response);
  }

  private void setRefreshCookie(HttpServletResponse response, String rawToken) {
    boolean secure = webBaseUrl != null && webBaseUrl.startsWith("https");
    ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, rawToken)
        .httpOnly(true)
        .secure(secure)
        .path("/api/auth")
        .maxAge(Duration.ofMillis(refreshExpirationMs))
        .sameSite(secure ? "None" : "Lax")
        .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private void clearRefreshCookie(HttpServletResponse response) {
    boolean secure = webBaseUrl != null && webBaseUrl.startsWith("https");
    ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
        .httpOnly(true)
        .secure(secure)
        .path("/api/auth")
        .maxAge(0)
        .sameSite(secure ? "None" : "Lax")
        .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private static String readRefreshCookie(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return null;
    for (Cookie cookie : cookies) {
      if (REFRESH_COOKIE.equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }

  private static void requireUser(User user) {
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    }
  }
}

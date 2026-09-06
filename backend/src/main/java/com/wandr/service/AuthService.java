package com.wandr.service;

import com.wandr.domain.RefreshToken;
import com.wandr.domain.Role;
import com.wandr.domain.User;
import com.wandr.dto.AuthDtos;
import com.wandr.repo.RefreshTokenRepository;
import com.wandr.repo.UserRepository;
import com.wandr.security.JwtService;
import com.wandr.security.TokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final EmailService emailService;
  private final NotificationService notificationService;
  private final AccountDeletionService accountDeletionService;

  @Value("${wandr.jwt.refresh-expiration-ms:604800000}")
  private long refreshExpirationMs;

  public record AuthResult(AuthDtos.AuthResponse response, String refreshToken) {}

  @Transactional
  public AuthResult signup(AuthDtos.SignupRequest req) {
    if (userRepository.existsByEmailIgnoreCase(req.email())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
    }
    Role role = req.role() == null ? Role.USER : req.role();
    if (role != Role.USER) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only user accounts can self-register");
    }

    String verificationToken = UUID.randomUUID().toString();
    User user = User.builder()
        .email(req.email().trim().toLowerCase())
        .passwordHash(passwordEncoder.encode(req.password()))
        .displayName(req.displayName().trim())
        .role(Role.USER)
        .emailVerified(false)
        .emailVerificationToken(verificationToken)
        .emailVerificationExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
        .build();
    userRepository.save(user);
    emailService.sendVerification(user.getEmail(), verificationToken);
    return issueAuth(user, false);
  }

  @Transactional
  public AuthResult login(AuthDtos.LoginRequest req) {
    User user = userRepository.findByEmailIgnoreCase(req.email().trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
    boolean returning = refreshTokenRepository.countByUserId(user.getId()) > 0;
    return issueAuth(user, returning);
  }

  @Transactional
  public AuthDtos.MessageResponse verifyEmail(String token) {
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token is required");
    }
    User user = userRepository.findByEmailVerificationToken(token)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token"));

    if (user.getEmailVerificationExpiresAt() != null
        && user.getEmailVerificationExpiresAt().isBefore(Instant.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token");
    }
    user.setEmailVerified(true);
    user.setEmailVerificationToken(null);
    user.setEmailVerificationExpiresAt(null);
    userRepository.save(user);
    return new AuthDtos.MessageResponse("Email verified");
  }

  @Transactional
  public AuthDtos.MessageResponse forgotPassword(String email) {
    userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
      String rawToken = UUID.randomUUID().toString();
      user.setPasswordResetTokenHash(TokenHasher.sha256Hex(rawToken));
      user.setPasswordResetExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
      userRepository.save(user);
      emailService.sendPasswordReset(user.getEmail(), rawToken);
    });
    return new AuthDtos.MessageResponse("If that email exists, a reset link has been sent");
  }

  @Transactional
  public AuthDtos.MessageResponse resetPassword(String token, String newPassword) {
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token is required");
    }
    String hash = TokenHasher.sha256Hex(token);
    User user = userRepository.findByPasswordResetTokenHash(hash)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token"));

    if (user.getPasswordResetExpiresAt() == null
        || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setPasswordResetTokenHash(null);
    user.setPasswordResetExpiresAt(null);
    userRepository.save(user);
    refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
    notifyPasswordChanged(user);
    return new AuthDtos.MessageResponse("Password updated");
  }

  @Transactional
  public AuthDtos.MessageResponse changePassword(User user, String oldPassword, String newPassword) {
    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
    refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
    notifyPasswordChanged(user);
    return new AuthDtos.MessageResponse("Password changed");
  }

  @Transactional
  public void deleteAccount(User user, String password) {
    accountDeletionService.deleteAccount(user, password);
  }

  @Transactional
  public AuthResult refresh(String rawRefreshToken) {
    if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token required");
    }
    String hash = TokenHasher.sha256Hex(rawRefreshToken);
    RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

    if (stored.getExpiresAt().isBefore(Instant.now())) {
      refreshTokenRepository.revokeById(stored.getId(), Instant.now());
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
    }

    User user = userRepository.findById(stored.getUserId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

    refreshTokenRepository.revokeById(stored.getId(), Instant.now());
    return issueAuth(user, false);
  }

  @Transactional
  public void logout(String rawRefreshToken) {
    if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
    String hash = TokenHasher.sha256Hex(rawRefreshToken);
    refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash)
        .ifPresent(t -> refreshTokenRepository.revokeById(t.getId(), Instant.now()));
  }

  @Transactional
  public void logoutAll(Long userId) {
    refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
  }

  private void notifyPasswordChanged(User user) {
    String eventId = "password-changed:" + user.getId() + ":" + Instant.now().getEpochSecond();
    notificationService.create(
        user.getId(),
        "PASSWORD_CHANGED",
        "Password changed",
        "Your Wandr password was successfully changed.",
        "USER",
        user.getId(),
        null,
        eventId
    );
    emailService.sendPasswordChanged(user.getEmail());
  }

  private void notifyNewLogin(User user) {
    String eventId = "new-login:" + user.getId() + ":" + Instant.now().getEpochSecond() / 3600;
    notificationService.create(
        user.getId(),
        "NEW_LOGIN",
        "New sign-in",
        "Your Wandr account was accessed from a new sign-in.",
        "USER",
        user.getId(),
        null,
        eventId
    );
    emailService.sendNewLogin(user.getEmail());
  }

  private AuthResult issueAuth(User user, boolean notifyNewLogin) {
    String access = jwtService.generate(user.getId(), user.getEmail(), user.getRole().name());
    String refresh = createRefreshToken(user.getId());
    if (notifyNewLogin) {
      notifyNewLogin(user);
    }
    AuthDtos.AuthResponse response = new AuthDtos.AuthResponse(
        access,
        user.getId(),
        user.getEmail(),
        user.getDisplayName(),
        user.getRole().name(),
        user.isEmailVerified()
    );
    return new AuthResult(response, refresh);
  }

  private String createRefreshToken(Long userId) {
    String raw = UUID.randomUUID().toString() + UUID.randomUUID();
    String hash = TokenHasher.sha256Hex(raw);
    refreshTokenRepository.save(RefreshToken.builder()
        .userId(userId)
        .tokenHash(hash)
        .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
        .build());
    return raw;
  }
}

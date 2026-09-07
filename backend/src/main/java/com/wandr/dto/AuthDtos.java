package com.wandr.dto;

import com.wandr.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

  public record LoginRequest(
      @Email @NotBlank String email,
      @NotBlank String password
  ) {}

  public record SignupRequest(
      @Email @NotBlank String email,
      @NotBlank @Size(min = 6) String password,
      @NotBlank String displayName,
      Role role
  ) {}

  /**
   * Access token always present. {@code refreshToken} is included for native/mobile clients;
   * web continues to use the HttpOnly cookie and may ignore this field.
   */
  public record AuthResponse(
      String token,
      Long userId,
      String email,
      String displayName,
      String role,
      boolean emailVerified,
      String refreshToken
  ) {
    public AuthResponse withoutRefresh() {
      return new AuthResponse(token, userId, email, displayName, role, emailVerified, null);
    }
  }

  public record MessageResponse(String message) {}

  public record VerifyEmailRequest(@NotBlank String token) {}

  public record ForgotPasswordRequest(@Email @NotBlank String email) {}

  public record ResetPasswordRequest(
      @NotBlank String token,
      @NotBlank @Size(min = 6) String newPassword
  ) {}

  public record ChangePasswordRequest(
      @NotBlank String oldPassword,
      @NotBlank @Size(min = 6) String newPassword
  ) {}

  public record DeleteAccountRequest(@NotBlank String password) {}

  public record RefreshRequest(String refreshToken) {}

  public record RefreshResponse(String token, boolean emailVerified, String refreshToken) {}
}

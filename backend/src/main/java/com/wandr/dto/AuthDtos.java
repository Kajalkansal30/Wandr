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

  public record AuthResponse(
      String token,
      Long userId,
      String email,
      String displayName,
      String role,
      boolean emailVerified
  ) {}

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

  public record RefreshResponse(String token, boolean emailVerified) {}
}

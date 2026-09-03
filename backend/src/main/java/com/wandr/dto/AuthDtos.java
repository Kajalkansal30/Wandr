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
      String role
  ) {}
}

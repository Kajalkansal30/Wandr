package com.wandr.web;

import com.wandr.dto.AuthDtos;
import com.wandr.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/signup")
  public AuthDtos.AuthResponse signup(@Valid @RequestBody AuthDtos.SignupRequest request) {
    return authService.signup(request);
  }

  @PostMapping("/login")
  public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
    return authService.login(request);
  }
}

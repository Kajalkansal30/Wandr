package com.wandr.service;

import com.wandr.domain.Role;
import com.wandr.domain.User;
import com.wandr.dto.AuthDtos;
import com.wandr.repo.UserRepository;
import com.wandr.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest req) {
    if (userRepository.existsByEmailIgnoreCase(req.email())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
    }
    Role role = req.role() == null ? Role.USER : req.role();
    if (role == Role.ADMIN) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot self-register as admin");
    }

    User user = User.builder()
        .email(req.email().trim().toLowerCase())
        .passwordHash(passwordEncoder.encode(req.password()))
        .displayName(req.displayName().trim())
        .role(role)
        .build();
    userRepository.save(user);
    return toAuth(user);
  }

  public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
    User user = userRepository.findByEmailIgnoreCase(req.email().trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
    return toAuth(user);
  }

  private AuthDtos.AuthResponse toAuth(User user) {
    String token = jwtService.generate(user.getId(), user.getEmail(), user.getRole().name());
    return new AuthDtos.AuthResponse(
        token,
        user.getId(),
        user.getEmail(),
        user.getDisplayName(),
        user.getRole().name()
    );
  }
}

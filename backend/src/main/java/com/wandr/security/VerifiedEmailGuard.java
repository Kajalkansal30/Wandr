package com.wandr.security;

import com.wandr.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class VerifiedEmailGuard {

  private VerifiedEmailGuard() {}

  public static void requireVerified(User user) {
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    }
    if (!user.isEmailVerified()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email verification required");
    }
  }
}

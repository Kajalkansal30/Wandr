package com.wandr.repo;

import com.wandr.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);
  Optional<User> findByEmailVerificationToken(String token);
  Optional<User> findByPasswordResetTokenHash(String tokenHash);

  List<User> findTop30ByOrderByCreatedAtDesc();

  long countByEmailVerifiedFalse();

  @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :from")
  long countCreatedSince(@Param("from") Instant from);
}

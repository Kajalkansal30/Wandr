package com.wandr.repo;

import com.wandr.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);

  @Modifying
  @Query("UPDATE RefreshToken r SET r.revokedAt = :now WHERE r.userId = :userId AND r.revokedAt IS NULL")
  int revokeAllByUserId(@Param("userId") Long userId, @Param("now") Instant now);

  @Modifying
  @Query("UPDATE RefreshToken r SET r.revokedAt = :now WHERE r.id = :id AND r.revokedAt IS NULL")
  int revokeById(@Param("id") Long id, @Param("now") Instant now);
}

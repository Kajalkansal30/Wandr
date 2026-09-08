package com.wandr.repo;

import com.wandr.domain.PushDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushDeviceTokenRepository extends JpaRepository<PushDeviceToken, Long> {
  Optional<PushDeviceToken> findByToken(String token);
  List<PushDeviceToken> findByUserId(Long userId);
  void deleteByTokenAndUserId(String token, Long userId);
}

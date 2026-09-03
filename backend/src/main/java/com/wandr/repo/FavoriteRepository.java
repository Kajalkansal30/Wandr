package com.wandr.repo;

import com.wandr.domain.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
  List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
  Optional<Favorite> findByUserIdAndPlaceId(Long userId, Long placeId);
  boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
  void deleteByUserIdAndPlaceId(Long userId, Long placeId);
}

package com.wandr.repo;

import com.wandr.domain.SpotLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SpotLikeRepository extends JpaRepository<SpotLike, Long> {
  Optional<SpotLike> findByUserIdAndMediaId(Long userId, Long mediaId);

  boolean existsByUserIdAndMediaId(Long userId, Long mediaId);

  List<SpotLike> findByUserIdAndMediaIdIn(Long userId, Collection<Long> mediaIds);

  void deleteByUserIdAndMediaId(Long userId, Long mediaId);
}

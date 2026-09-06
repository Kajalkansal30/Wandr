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

  @org.springframework.data.jpa.repository.Modifying
  @org.springframework.data.jpa.repository.Query("DELETE FROM SpotLike s WHERE s.userId = :userId")
  int deleteByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
